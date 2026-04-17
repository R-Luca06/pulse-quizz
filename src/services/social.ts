import { supabase } from './supabase'
import { AppError } from './errors'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendshipRow {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
}

export interface FriendProfile {
  userId: string
  username: string
  featuredBadges: string[]
  friendshipId: string
}

export interface PendingRequest {
  friendshipId: string
  userId: string
  username: string
  featuredBadges: string[]
  direction: 'received' | 'sent'
  createdAt: string
}

export interface SearchResult {
  userId: string
  username: string
  featuredBadges: string[]
  /** null = pas de relation, sinon l'état de la relation */
  friendshipStatus: FriendshipStatus | null
  friendshipId: string | null
  /** true si c'est nous qui avons initié la demande */
  isRequester: boolean | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapError(error: { code?: string; message?: string }, fallback: string): Error {
  const msg = error.message ?? fallback
  if (error.code === '42501' || /row-level security/i.test(msg)) {
    return new AppError('auth_error', 'Session expirée')
  }
  if (error.code === '23505') {
    // unique_violation — demande déjà existante
    return new AppError('validation_error', 'Une demande existe déjà avec cet utilisateur')
  }
  return new AppError('db_error', msg)
}

// ─── Recherche de joueurs ──────────────────────────────────────────────────────

/**
 * Cherche des profils par préfixe de username (insensible à la casse).
 * Exclut l'utilisateur courant. Enrichit les résultats avec l'état
 * de la relation amicale si l'utilisateur est connecté.
 */
export async function searchUsers(
  query: string,
  currentUserId: string | null,
  limit = 10,
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, featured_badges')
    .ilike('username', `${query.trim()}%`)
    .neq('id', currentUserId ?? '00000000-0000-0000-0000-000000000000')
    .limit(limit)

  if (error) throw mapError(error, 'Erreur de recherche')
  if (!profiles || profiles.length === 0) return []

  // Si non connecté : pas d'état de relation
  if (!currentUserId) {
    return profiles.map(p => ({
      userId: p.id,
      username: p.username,
      featuredBadges: p.featured_badges ?? [],
      friendshipStatus: null,
      friendshipId: null,
      isRequester: null,
    }))
  }

  // Récupère les relations existantes avec ces utilisateurs
  const userIds = profiles.map(p => p.id)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.in.(${userIds.join(',')})),` +
      `and(addressee_id.eq.${currentUserId},requester_id.in.(${userIds.join(',')}))`
    )

  const fsMap = new Map<string, { id: string; status: FriendshipStatus; isRequester: boolean }>()
  for (const fs of friendships ?? []) {
    const otherId = fs.requester_id === currentUserId ? fs.addressee_id : fs.requester_id
    fsMap.set(otherId, {
      id: fs.id,
      status: fs.status as FriendshipStatus,
      isRequester: fs.requester_id === currentUserId,
    })
  }

  return profiles.map(p => {
    const rel = fsMap.get(p.id)
    return {
      userId: p.id,
      username: p.username,
      featuredBadges: p.featured_badges ?? [],
      friendshipStatus: rel?.status ?? null,
      friendshipId: rel?.id ?? null,
      isRequester: rel?.isRequester ?? null,
    }
  })
}

// ─── Gestion des amis ─────────────────────────────────────────────────────────

/** Envoie une demande d'amitié. */
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<FriendshipRow> {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single()

  if (error) throw mapError(error, "Impossible d'envoyer la demande")
  return data as FriendshipRow
}

/** Accepte une demande reçue (seul l'addressee peut appeler). */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('status', 'pending')

  if (error) throw mapError(error, "Impossible d'accepter la demande")
}

/** Refuse une demande reçue. */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'rejected' })
    .eq('id', friendshipId)
    .eq('status', 'pending')

  if (error) throw mapError(error, 'Impossible de refuser la demande')
}

/** Supprime une relation (retrait d'ami ou annulation de demande). */
export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) throw mapError(error, "Impossible de supprimer la relation")
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/** Retourne la liste des amis acceptés avec leur profil. */
export async function getFriends(userId: string): Promise<FriendProfile[]> {
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (error) throw mapError(error, 'Impossible de charger les amis')
  if (!rows || rows.length === 0) return []

  const friendIds = rows.map(r => r.requester_id === userId ? r.addressee_id : r.requester_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, featured_badges')
    .in('id', friendIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  return rows.map(row => {
    const friendId = row.requester_id === userId ? row.addressee_id : row.requester_id
    const p = profileMap.get(friendId)
    return {
      friendshipId: row.id,
      userId: friendId,
      username: p?.username ?? '?',
      featuredBadges: (p as { featured_badges?: string[] } | undefined)?.featured_badges ?? [],
    }
  })
}

/** Retourne les demandes en attente (reçues et envoyées). */
export async function getPendingRequests(userId: string): Promise<PendingRequest[]> {
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, created_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw mapError(error, 'Impossible de charger les demandes')
  if (!rows || rows.length === 0) return []

  const otherIds = rows.map(r => r.requester_id === userId ? r.addressee_id : r.requester_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, featured_badges')
    .in('id', otherIds)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  return rows.map(row => {
    const isRequester = row.requester_id === userId
    const otherId = isRequester ? row.addressee_id : row.requester_id
    const p = profileMap.get(otherId)
    return {
      friendshipId: row.id,
      userId: otherId,
      username: p?.username ?? '?',
      featuredBadges: (p as { featured_badges?: string[] } | undefined)?.featured_badges ?? [],
      direction: isRequester ? 'sent' : 'received',
      createdAt: row.created_at,
    } as PendingRequest
  })
}

/** Retourne le statut de la relation entre deux utilisateurs. */
export async function getFriendshipStatus(
  currentUserId: string,
  targetUserId: string,
): Promise<{ status: FriendshipStatus | null; friendshipId: string | null; isRequester: boolean | null }> {
  const { data } = await supabase
    .from('friendships')
    .select('id, requester_id, status')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),` +
      `and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .limit(1)
    .maybeSingle()

  if (!data) return { status: null, friendshipId: null, isRequester: null }
  return {
    status: data.status as FriendshipStatus,
    friendshipId: data.id,
    isRequester: data.requester_id === currentUserId,
  }
}

/** Compte les demandes reçues en attente (pour le badge notif). */
export async function getPendingReceivedCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) return 0
  return count ?? 0
}
