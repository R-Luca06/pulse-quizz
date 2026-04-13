import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { checkAndUnlockAchievements, type AchievementContext } from '../services/achievements'
import type { AchievementWithStatus } from '../types/quiz'

interface Profile {
  username: string
  featured_badges: string[]
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  pendingAchievements: AchievementWithStatus[]
  clearPendingAchievements: () => void
  statsRefreshKey: number
  refreshStats: () => void
  setLocalFeaturedBadges: (badges: string[]) => void
  triggerAchievementCheck: (context?: AchievementContext) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
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
      queueMicrotask(() => { if (!cancelled) setProfile(null) })
      return () => { cancelled = true }
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('username, featured_badges')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setProfile({ username: data.username, featured_badges: data.featured_badges ?? [] })
      })
    // Vérification rétroactive silencieuse — fire and forget
    checkAndUnlockAchievements(user.id).catch(err => console.error('Achievement check failed:', err))
    return () => { cancelled = true }
  }, [user])

  function clearPendingAchievements() {
    setPendingAchievements([])
  }

  function refreshStats() {
    setStatsRefreshKey(k => k + 1)
  }

  function setLocalFeaturedBadges(badges: string[]) {
    setProfile(prev => prev ? { ...prev, featured_badges: badges } : prev)
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
    setProfile({ username, featured_badges: [] })

    // Vérification des achievements post-inscription (profile existe maintenant)
    checkAndUnlockAchievements(data.user.id)
      .then(unlocked => { if (unlocked.length > 0) setPendingAchievements(unlocked) })
      .catch(err => console.error('Achievement check failed on signup:', err))
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function refreshProfile(): Promise<void> {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('username, featured_badges')
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile({ username: data.username, featured_badges: data.featured_badges ?? [] })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, pendingAchievements, clearPendingAchievements, statsRefreshKey, refreshStats, setLocalFeaturedBadges, triggerAchievementCheck, signUp, signIn, signOut, refreshProfile }}>
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
