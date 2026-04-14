import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MiniBadge from '../shared/MiniBadge'
import {
  getFriends,
  getPendingRequests,
  getPendingReceivedCount,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendship,
} from '../../services/social'
import type { FriendProfile, PendingRequest, SearchResult } from '../../services/social'
import { useToast } from '../../contexts/ToastContext'

// Classe commune pour les noms de joueurs cliquables
const playerLink = 'underline decoration-transparent decoration-1 underline-offset-2 transition-colors hover:decoration-neon-violet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  onViewProfile: (username: string) => void
  onShowSocialPage: () => void
}

// ─── Avatar initial ───────────────────────────────────────────────────────────

function InitialAvatar({ username, size = 32 }: { username: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-neon-violet/20 font-black text-neon-violet ring-1 ring-neon-violet/30"
    >
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ─── Ligne ami (avec confirmation avant suppression) ─────────────────────────

function FriendRow({
  friend,
  onViewProfile,
  onRemove,
}: {
  friend: FriendProfile
  onViewProfile: (u: string) => void
  onRemove: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 2500)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
      <InitialAvatar username={friend.username} size={28} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
        <button
          onClick={() => onViewProfile(friend.username)}
          className={`max-w-[140px] shrink-0 truncate text-sm font-bold text-white ${playerLink}`}
        >
          {friend.username}
        </button>
        {friend.featuredBadges.map(id => (
          <MiniBadge key={id} achievementId={id} size={14} />
        ))}
      </div>
      <div className="flex shrink-0 gap-1">
        {confirming ? (
          <>
            <button
              onClick={() => { setConfirming(false); onRemove(friend.friendshipId) }}
              className="flex h-[26px] items-center gap-1 rounded-lg border border-game-danger/40 bg-game-danger/15 px-1.5 text-[10px] font-bold text-game-danger transition-colors hover:bg-game-danger/25"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Ok
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-white/[0.06] text-white/30 transition-colors hover:text-white/60"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-transparent text-white/20 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Ligne demande ────────────────────────────────────────────────────────────

function RequestRow({
  req,
  onAccept,
  onReject,
  onCancel,
}: {
  req: PendingRequest
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
      <InitialAvatar username={req.username} size={28} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
        <span className="max-w-[120px] shrink-0 truncate text-sm font-bold text-white">{req.username}</span>
        {req.featuredBadges.map(id => (
          <MiniBadge key={id} achievementId={id} size={14} />
        ))}
      </div>
      {req.direction === 'received' ? (
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onAccept(req.friendshipId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-game-success/30 bg-game-success/10 text-game-success transition-colors hover:bg-game-success/25"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
          <button
            onClick={() => onReject(req.friendshipId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-white/25">En attente</span>
          <button
            onClick={() => onCancel(req.friendshipId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Ligne résultat de recherche ──────────────────────────────────────────────

function SearchRow({
  result,
  onViewProfile,
  onAdd,
  onCancel,
  loading,
}: {
  result: SearchResult
  onViewProfile: (u: string) => void
  onAdd: (userId: string) => void
  onCancel: (friendshipId: string) => void
  loading: boolean
}) {
  const { friendshipStatus, isRequester } = result

  const actionSlot = () => {
    if (friendshipStatus === 'accepted') {
      return (
        <span className="shrink-0 rounded-lg border border-game-success/20 bg-game-success/10 px-2 py-1 text-[10px] font-bold text-game-success/60">
          Amis ✓
        </span>
      )
    }
    if (friendshipStatus === 'pending' && isRequester) {
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-white/25">En attente</span>
          <button
            disabled={loading}
            onClick={() => result.friendshipId && onCancel(result.friendshipId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger disabled:opacity-50"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )
    }
    if (friendshipStatus === 'pending' && !isRequester) {
      return (
        <span className="shrink-0 rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] text-white/30">
          Reçue
        </span>
      )
    }
    return (
      <button
        disabled={loading}
        onClick={() => onAdd(result.userId)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon-violet/30 bg-neon-violet/10 text-neon-violet transition-colors hover:bg-neon-violet/20 disabled:opacity-50"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
      <InitialAvatar username={result.username} size={28} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
        <button
          onClick={() => onViewProfile(result.username)}
          className={`max-w-[140px] shrink-0 truncate text-sm font-bold text-white ${playerLink}`}
        >
          {result.username}
        </button>
        {result.featuredBadges.map(id => (
          <MiniBadge key={id} achievementId={id} size={14} />
        ))}
      </div>
      <div className="shrink-0">{actionSlot()}</div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────

const MAX_FRIENDS_SHOWN = 5

export default function FriendsPanel({ userId, onViewProfile, onShowSocialPage }: Props) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const receivedRequests = requests.filter(r => r.direction === 'received')
  const sentRequests = requests.filter(r => r.direction === 'sent')

  // Fetch count au montage pour le badge (avant toute ouverture du panel)
  useEffect(() => {
    getPendingReceivedCount(userId).then(setPendingCount).catch(() => {})
  }, [userId])

  // Sync count depuis les données chargées
  useEffect(() => {
    if (dataLoaded) setPendingCount(receivedRequests.length)
  }, [dataLoaded, receivedRequests.length])

  // Ferme au clic extérieur
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Charge amis + demandes à l'ouverture
  const loadData = useCallback(async () => {
    if (dataLoaded) return
    try {
      const [f, r] = await Promise.all([getFriends(userId), getPendingRequests(userId)])
      setFriends(f)
      setRequests(r)
      setDataLoaded(true)
    } catch {
      // silencieux
    }
  }, [userId, dataLoaded])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  // Recherche avec debounce 300ms
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchUsers(searchQuery, userId)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery, userId])

  // ── Actions ──

  async function handleAdd(targetUserId: string) {
    setActionLoading(true)
    try {
      const row = await sendFriendRequest(userId, targetUserId)
      setSearchResults(prev => prev.map(r =>
        r.userId === targetUserId
          ? { ...r, friendshipStatus: 'pending' as const, friendshipId: row.id, isRequester: true }
          : r
      ))
      toast.success('Demande envoyée !')
    } catch { toast.error("Impossible d'envoyer la demande") }
    finally { setActionLoading(false) }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(true)
    try {
      await acceptFriendRequest(friendshipId)
      setDataLoaded(false)
      const [f, r] = await Promise.all([getFriends(userId), getPendingRequests(userId)])
      setFriends(f); setRequests(r); setDataLoaded(true)
      toast.success('Demande acceptée !')
    } catch { toast.error("Erreur lors de l'acceptation") }
    finally { setActionLoading(false) }
  }

  async function handleReject(friendshipId: string) {
    setActionLoading(true)
    try {
      await rejectFriendRequest(friendshipId)
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId))
      toast.success('Demande refusée')
    } catch { toast.error('Erreur lors du refus') }
    finally { setActionLoading(false) }
  }

  async function handleRemove(friendshipId: string) {
    setActionLoading(true)
    try {
      await removeFriendship(friendshipId)
      setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId))
      toast.success('Ami supprimé')
    } catch { toast.error('Impossible de supprimer') }
    finally { setActionLoading(false) }
  }

  async function handleCancelRequest(friendshipId: string) {
    setActionLoading(true)
    try {
      await removeFriendship(friendshipId)
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId))
      setSearchResults(prev => prev.map(r =>
        r.friendshipId === friendshipId
          ? { ...r, friendshipStatus: null, friendshipId: null, isRequester: null }
          : r
      ))
      toast.success('Demande annulée')
    } catch { toast.error("Impossible d'annuler") }
    finally { setActionLoading(false) }
  }

  const isSearching = searchQuery.trim().length > 0
  const displayedFriends = friends.slice(0, MAX_FRIENDS_SHOWN)
  const hasMoreFriends = friends.length > MAX_FRIENDS_SHOWN

  return (
    <div ref={panelRef} className="relative">
      {/* ── Bouton déclencheur ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Amis"
        className={[
          'relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
          open
            ? 'border-neon-violet/50 bg-neon-violet/15 text-neon-violet'
            : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/80',
        ].join(' ')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-game-danger px-1 text-[9px] font-black text-white">
            {pendingCount}
          </span>
        )}
      </button>

      {/* ── Panel dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-game-card shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Amis</span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-white/40">
                  {friends.length}
                </span>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-game-danger/20 px-2 py-0.5 text-[10px] font-bold text-game-danger">
                    {pendingCount} demande{pendingCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 transition-colors hover:text-white/60"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="border-b border-white/[0.06] px-3 py-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition-colors focus-within:border-neon-violet/40">
                {searchLoading ? (
                  <div className="h-3 w-3 shrink-0 animate-spin rounded-full border border-white/20 border-t-white/60" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-white/30">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un joueur…"
                  className="w-full bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="shrink-0 text-white/30 hover:text-white/60">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="max-h-[340px] overflow-y-auto py-1.5">
              {isSearching ? (
                searchResults.length === 0 && !searchLoading ? (
                  <p className="px-4 py-4 text-center text-xs text-white/30">Aucun résultat</p>
                ) : (
                  <div className="flex flex-col">
                    <p className="px-4 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
                      Résultats
                    </p>
                    {searchResults.map(r => (
                      <SearchRow
                        key={r.userId}
                        result={r}
                        onViewProfile={username => { onViewProfile(username); setOpen(false) }}
                        onAdd={handleAdd}
                        onCancel={handleCancelRequest}
                        loading={actionLoading}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col">
                  {receivedRequests.length > 0 && (
                    <div className="mb-1">
                      <p className="px-4 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-game-danger/60">
                        Demandes reçues
                      </p>
                      {receivedRequests.map(r => (
                        <RequestRow key={r.friendshipId} req={r} onAccept={handleAccept} onReject={handleReject} onCancel={handleCancelRequest} />
                      ))}
                      {sentRequests.length > 0 && (
                        <>
                          <p className="mt-1 px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/20">
                            Envoyées
                          </p>
                          {sentRequests.map(r => (
                            <RequestRow key={r.friendshipId} req={r} onAccept={handleAccept} onReject={handleReject} onCancel={handleCancelRequest} />
                          ))}
                        </>
                      )}
                      <div className="mx-3 mt-1 border-b border-white/[0.05]" />
                    </div>
                  )}

                  <p className="px-4 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/25">
                    Mes amis
                  </p>
                  {!dataLoaded ? (
                    <div className="flex justify-center py-6">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                    </div>
                  ) : friends.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-white/30">
                      Pas encore d'amis — recherche un joueur !
                    </p>
                  ) : (
                    displayedFriends.map(f => (
                      <FriendRow
                        key={f.friendshipId}
                        friend={f}
                        onViewProfile={username => { onViewProfile(username); setOpen(false) }}
                        onRemove={handleRemove}
                      />
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isSearching && (
              <div className="border-t border-white/[0.06] p-2">
                <button
                  onClick={() => { onShowSocialPage(); setOpen(false) }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-bold text-white/50 transition-colors hover:border-neon-violet/30 hover:bg-neon-violet/[0.06] hover:text-neon-violet"
                >
                  Voir tous les amis ({friends.length})
                  {hasMoreFriends && (
                    <span className="text-[10px] text-white/30">+{friends.length - MAX_FRIENDS_SHOWN} autres</span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
