import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { checkAndUnlockAchievements, type AchievementContext } from '../services/achievements'
import type { AchievementWithStatus, EquippedCosmetics, PulsesBreakdown, XpBreakdown } from '../types/quiz'
import { identifyUser, resetIdentity, trackUserSignedUp, trackUserSignedIn } from '../services/analytics'
import { getLevelFromXp } from '../constants/levels'
import { getWallet } from '../services/pulses'

interface Profile {
  username: string
  featured_badges: string[]
  description: string
  equipped: EquippedCosmetics
}

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  emblem_id:      null,
  background_id:  null,
  title_id:       null,
  card_design_id: null,
  screen_anim_id: null,
}

interface ProfileRow {
  username:                  string
  featured_badges:           string[] | null
  description:               string | null
  equipped_emblem_id:        string | null
  equipped_background_id:    string | null
  equipped_title_id:         string | null
  equipped_card_design_id:   string | null
  equipped_screen_anim_id:   string | null
}

function mapProfileRow(data: ProfileRow): Profile {
  return {
    username:        data.username,
    featured_badges: data.featured_badges ?? [],
    description:     data.description ?? '',
    equipped: {
      emblem_id:      data.equipped_emblem_id      ?? null,
      background_id:  data.equipped_background_id  ?? null,
      title_id:       data.equipped_title_id       ?? null,
      card_design_id: data.equipped_card_design_id ?? null,
      screen_anim_id: data.equipped_screen_anim_id ?? null,
    },
  }
}

const PROFILE_SELECT = 'username, featured_badges, description, equipped_emblem_id, equipped_background_id, equipped_title_id, equipped_card_design_id, equipped_screen_anim_id'

export interface RewardNotification {
  gameXp: XpBreakdown | null
  achievementXp: number
  gamePulses: PulsesBreakdown | null
  achievementPulses: number
  totalXp: number
  totalPulses: number
  levelBefore: number
  levelAfter: number
  id: number  // unique ID to re-trigger animations on repeated toasts
}

export interface ShowRewardGainParams {
  gameXp: XpBreakdown | null
  achievementXp: number
  gamePulses?: PulsesBreakdown | null
  achievementPulses?: number
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  totalXp: number
  pulsesBalance: number
  rewardNotification: RewardNotification | null
  showRewardGain: (params: ShowRewardGainParams) => void
  clearRewardNotification: () => void
  pendingAchievements: AchievementWithStatus[]
  clearPendingAchievements: () => void
  statsRefreshKey: number
  refreshStats: () => void
  setLocalFeaturedBadges: (badges: string[]) => void
  setLocalDescription: (description: string) => void
  triggerAchievementCheck: (context?: AchievementContext) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshWallet: () => Promise<void>
  bumpPulses: (amount: number) => void
  bumpXp: (amount: number) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalXp, setTotalXp] = useState(0)
  const [pulsesBalance, setPulsesBalance] = useState(0)
  const [rewardNotification, setRewardNotification] = useState<RewardNotification | null>(null)
  const totalXpRef = useRef(0)
  const toastIdRef = useRef(0)
  const [pendingAchievements, setPendingAchievements] = useState<AchievementWithStatus[]>([])
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      let cancelled = false
      queueMicrotask(() => { if (!cancelled) { setProfile(null); setTotalXp(0); setPulsesBalance(0); resetIdentity() } })
      return () => { cancelled = true }
    }
    let cancelled = false
    Promise.all([
      supabase.from('profiles').select(PROFILE_SELECT).eq('id', user.id).maybeSingle(),
      supabase.from('user_global_stats').select('total_xp').eq('user_id', user.id).maybeSingle(),
      getWallet(user.id).catch(() => ({ balance: 0, lifetime_earned: 0, updated_at: null })),
    ]).then(([profileRes, xpRes, wallet]) => {
      if (!cancelled) {
        if (profileRes.data) {
          setProfile(mapProfileRow(profileRes.data as ProfileRow))
          identifyUser(user.id, { username: (profileRes.data as ProfileRow).username, email: user.email ?? undefined })
        }
        const xp = (xpRes.data as { total_xp: number } | null)?.total_xp ?? 0
        setTotalXp(xp)
        totalXpRef.current = xp
        setPulsesBalance(wallet.balance ?? 0)
      }
    })
    // Vérification rétroactive silencieuse — fire and forget
    checkAndUnlockAchievements(user.id).catch(err => console.error('Achievement check failed:', err))
    return () => { cancelled = true }
  }, [user])

  function showRewardGain({ gameXp, achievementXp, gamePulses = null, achievementPulses = 0 }: ShowRewardGainParams) {
    const totalXpDelta     = (gameXp?.total ?? 0) + achievementXp
    const totalPulsesDelta = (gamePulses?.total ?? 0) + achievementPulses
    if (totalXpDelta <= 0 && totalPulsesDelta <= 0) return
    const levelBefore = getLevelFromXp(totalXpRef.current)
    const levelAfter  = getLevelFromXp(totalXpRef.current + totalXpDelta)
    totalXpRef.current += totalXpDelta
    if (totalXpDelta > 0) setTotalXp(prev => prev + totalXpDelta)
    setRewardNotification({
      gameXp,
      achievementXp,
      gamePulses,
      achievementPulses,
      totalXp:     totalXpDelta,
      totalPulses: totalPulsesDelta,
      levelBefore,
      levelAfter,
      id: ++toastIdRef.current,
    })
  }

  function clearRewardNotification() {
    setRewardNotification(null)
  }

  function clearPendingAchievements() {
    setPendingAchievements([])
  }

  function refreshStats() {
    setStatsRefreshKey(k => k + 1)
  }

  function setLocalFeaturedBadges(badges: string[]) {
    setProfile(prev => prev ? { ...prev, featured_badges: badges } : prev)
  }

  function setLocalDescription(description: string) {
    setProfile(prev => prev ? { ...prev, description } : prev)
  }

  async function triggerAchievementCheck(context?: AchievementContext): Promise<void> {
    if (!user) return
    const unlocked = await checkAndUnlockAchievements(user.id, context).catch(err => {
      console.error('Achievement check failed:', err)
      return [] as AchievementWithStatus[]
    })
    if (unlocked.length > 0) setPendingAchievements(prev => [...prev, ...unlocked])
  }

  async function signUp(email: string, password: string, username: string) {
    // Pré-check case-insensitive du pseudo avant de créer le compte auth,
    // sinon on laisse un user orphelin dans auth.users quand l'insert profiles échoue.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle()
    if (existing) throw new Error('duplicate key value violates unique constraint "profiles_username_unique"')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Inscription échouée')

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username })

    if (profileError) {
      // Filet de sécurité race condition : delete_user() supprime auth.users
      // (SECURITY DEFINER, nécessite une session authentifiée — valide ici).
      await supabase.rpc('delete_user').then(() => {}, err => {
        console.error('Rollback delete_user failed:', err)
      })
      await supabase.auth.signOut()
      throw profileError
    }
    setProfile({ username, featured_badges: [], description: '', equipped: { ...DEFAULT_EQUIPPED } })
    trackUserSignedUp({ username })

    // Vérification des achievements post-inscription (profile existe maintenant)
    checkAndUnlockAchievements(data.user.id)
      .then(unlocked => { if (unlocked.length > 0) setPendingAchievements(unlocked) })
      .catch(err => console.error('Achievement check failed on signup:', err))
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    trackUserSignedIn()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setTotalXp(0)
    totalXpRef.current = 0
    setPulsesBalance(0)
  }

  async function refreshProfile(): Promise<void> {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile(mapProfileRow(data as ProfileRow))
  }

  async function refreshWallet(): Promise<void> {
    if (!user) { setPulsesBalance(0); return }
    const w = await getWallet(user.id).catch(() => null)
    if (w) setPulsesBalance(w.balance ?? 0)
  }

  function bumpPulses(amount: number) {
    if (!Number.isFinite(amount) || amount === 0) return
    setPulsesBalance(prev => Math.max(0, prev + amount))
  }

  function bumpXp(amount: number) {
    if (!Number.isFinite(amount) || amount === 0) return
    totalXpRef.current = Math.max(0, totalXpRef.current + amount)
    setTotalXp(prev => Math.max(0, prev + amount))
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, totalXp, pulsesBalance, rewardNotification, showRewardGain, clearRewardNotification, pendingAchievements, clearPendingAchievements, statsRefreshKey, refreshStats, setLocalFeaturedBadges, setLocalDescription, triggerAchievementCheck, signUp, signIn, signOut, refreshProfile, refreshWallet, bumpPulses, bumpXp }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
