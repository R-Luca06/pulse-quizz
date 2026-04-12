import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { checkAndUnlockAchievements } from '../services/achievements'
import type { AchievementWithStatus } from '../types/quiz'

interface Profile {
  username: string
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  pendingAchievements: AchievementWithStatus[]
  clearPendingAchievements: () => void
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
      queueMicrotask(() => setProfile(null))
      return
    }
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ username: data.username })
      })
    // Vérification rétroactive silencieuse — fire and forget
    checkAndUnlockAchievements(user.id).catch(err => console.error('Achievement check failed:', err))
  }, [user])

  function clearPendingAchievements() {
    setPendingAchievements([])
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Inscription échouée')

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username })

    if (profileError) {
      await supabase.auth.signOut()
      throw profileError
    }
    setProfile({ username })

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
      .select('username')
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile({ username: data.username })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, pendingAchievements, clearPendingAchievements, signUp, signIn, signOut, refreshProfile }}>
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
