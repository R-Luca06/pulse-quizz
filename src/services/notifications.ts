import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifType =
  | 'achievement_unlocked'
  | 'rank_up'
  | 'rank_down'

export interface AppNotification {
  id: string
  type: NotifType
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface NotificationPrefs {
  achievement_unlocked: boolean
  rank_change: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  achievement_unlocked: true,
  rank_change: true,
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/** Retourne les 20 dernières notifications de l'utilisateur. */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, data, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('getNotifications:', error.message)
    return []
  }
  return (data ?? []) as AppNotification[]
}

/** Retourne le nombre de notifications non lues (pour le badge au chargement). */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return 0
  return count ?? 0
}

// ─── Marquage ─────────────────────────────────────────────────────────────────

/** Marque une notification comme lue. */
export async function markRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export async function markAllRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}

// ─── Création (côté client) ───────────────────────────────────────────────────

/**
 * Crée une notification pour l'utilisateur courant.
 * Utilisé pour achievements et rank change (les events sociaux passent par des triggers DB).
 */
export async function createNotification(
  userId: string,
  type: NotifType,
  data: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, data })

  if (error) console.error('createNotification:', error.message)
}

// ─── Préférences ──────────────────────────────────────────────────────────────

/** Charge les préférences de notification depuis profiles.notification_prefs. */
export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return { ...DEFAULT_PREFS }

  const raw = data.notification_prefs as Partial<NotificationPrefs> | null
  if (!raw) return { ...DEFAULT_PREFS }

  return {
    achievement_unlocked: raw.achievement_unlocked ?? DEFAULT_PREFS.achievement_unlocked,
    rank_change:          raw.rank_change          ?? DEFAULT_PREFS.rank_change,
  }
}

/** Enregistre les préférences de notification dans profiles.notification_prefs. */
export async function updateNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ notification_prefs: prefs })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
