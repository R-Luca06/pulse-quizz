import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import MiniBadge from '../shared/MiniBadge'
import {
  getFriends,
  getPendingRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriendship,
} from '../../services/social'
import type { FriendProfile, PendingRequest, SearchResult } from '../../services/social'
import { getCompLeaderboardPage } from '../../services/leaderboard'

import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface Props {
  onBack: () => void
  onViewProfile: (username: string) => void
  embedded?: boolean
}

// Classe commune pour les noms de joueurs cliquables
const playerLink = 'underline decoration-transparent decoration-1 underline-offset-2 transition-colors hover:decoration-neon-violet'

function InitialAvatar({ username, size = 34 }: { username: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-neon-violet/20 font-black text-neon-violet ring-1 ring-neon-violet/30"
    >
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

// ─── Podium classement amis ───────────────────────────────────────────────────

const PODIUM_CFG = [
  { color: '#94A3B8', borderColor: 'rgba(148,163,184,0.35)', bg: 'rgba(148,163,184,0.08)', pt: 'pt-6',  bar: 'h-7',  medal: '🥈' },
  { color: '#EAB308', borderColor: 'rgba(234,179,8,0.45)',   bg: 'rgba(234,179,8,0.10)',   pt: 'pt-0',  bar: 'h-12', medal: '🥇' },
  { color: '#CD7F32', borderColor: 'rgba(205,127,50,0.35)',  bg: 'rgba(205,127,50,0.08)', pt: 'pt-10', bar: 'h-4',  medal: '🥉' },
]
const PODIUM_ORDER = [1, 0, 2]

function truncate(s: string, max = 9) { return s.length > max ? s.slice(0, max - 1) + '…' : s }

interface RankedPlayer { userId: string; username: string; score: number; featuredBadges: string[]; isMe?: boolean }


function FriendsLeaderboard({
  friends,
  myUserId,
  myUsername,
  onViewProfile,
  compact = false,
}: {
  friends: FriendProfile[]
  myUserId: string
  myUsername: string
  onViewProfile: (u: string) => void
  compact?: boolean
}) {
  const [scores, setScores] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (friends.length === 0) { setLoading(false); return }
    getCompLeaderboardPage('fr', 0, 100)
      .then(entries => {
        const map = new Map<string, number>()
        for (const e of entries) map.set(e.user_id, e.score)
        setScores(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [friends])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
      </div>
    )
  }

  const myScore = scores.get(myUserId) ?? 0
  const all: RankedPlayer[] = [
    { userId: myUserId, username: myUsername, score: myScore, featuredBadges: [], isMe: true },
    ...friends.map(f => ({ userId: f.userId, username: f.username, score: scores.get(f.userId) ?? 0, featuredBadges: f.featuredBadges })),
  ].sort((a, b) => b.score - a.score)

  const top3 = all.slice(0, 3)
  const rest = all.slice(3)

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-end justify-center pb-1 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {PODIUM_ORDER.map((dataIdx, displayPos) => {
          const entry = top3[dataIdx]
          const cfg = PODIUM_CFG[displayPos]
          if (!entry) return <div key={dataIdx} className={compact ? 'w-[60px]' : 'w-[76px]'} />
          const w = compact ? 'w-[60px]' : 'w-[76px]'
          const medal = compact ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-lg'
          return (
            <div key={entry.userId} className={`flex ${w} flex-col items-center ${cfg.pt}`}>
              <div
                className={`mb-1 flex ${medal} items-center justify-center rounded-full`}
                style={{ background: cfg.bg, border: `1.5px solid ${cfg.borderColor}`, boxShadow: entry.isMe ? `0 0 8px ${cfg.color}44` : 'none' }}
              >
                {cfg.medal}
              </div>
              <button
                onClick={() => !entry.isMe && onViewProfile(entry.username)}
                className={[
                  `mb-0.5 max-w-full truncate text-center leading-tight ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold`,
                  entry.isMe ? 'cursor-default text-neon-violet' : `cursor-pointer text-white/70 ${playerLink}`,
                ].join(' ')}
              >
                {truncate(entry.username, compact ? 7 : 9)}
                {entry.isMe && <span className="ml-0.5 text-neon-violet"> ★</span>}
              </button>
              <span className={`mb-1 font-black tabular-nums ${compact ? 'text-[10px]' : 'text-[11px]'}`} style={{ color: cfg.color }}>
                {entry.score > 0 ? entry.score.toLocaleString('fr-FR') : '—'}
              </span>
              <div className={`w-full rounded-t-md ${cfg.bar}`} style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}`, borderBottom: 'none' }} />
            </div>
          )
        })}
      </div>
      {rest.map((entry, i) => (
        <div
          key={entry.userId}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
            entry.isMe ? 'bg-neon-violet/10 ring-1 ring-neon-violet/20 text-white' : 'text-white/65 hover:bg-white/[0.03]'
          }`}
        >
          <span className="w-5 shrink-0 text-center font-bold text-white/30">#{i + 4}</span>
          <button
            onClick={() => !entry.isMe && onViewProfile(entry.username)}
            className={entry.isMe ? 'min-w-0 flex-1 truncate cursor-default font-medium' : `min-w-0 flex-1 truncate font-medium text-left ${playerLink}`}
          >
            {entry.username}
            {entry.isMe && <span className="ml-1 text-neon-violet">★</span>}
          </button>
          <span className="shrink-0 font-bold tabular-nums text-white/50">
            {entry.score > 0 ? entry.score.toLocaleString('fr-FR') : '—'}
          </span>
        </div>
      ))}
      {all.length === 0 && (
        <p className="py-6 text-center text-xs text-white/30">Ajoute des amis pour voir le classement</p>
      )}
    </div>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

function SearchBar({ query, onChange, loading }: { query: string; onChange: (v: string) => void; loading: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 transition-colors focus-within:border-neon-violet/40">
      {loading ? (
        <div className="h-3 w-3 shrink-0 animate-spin rounded-full border border-white/20 border-t-white/60" />
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-white/30">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      )}
      <input
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Rechercher un joueur par pseudo…"
        className="w-full bg-transparent text-sm text-white placeholder-white/25 outline-none"
      />
      {query && (
        <button onClick={() => onChange('')} className="shrink-0 text-white/30 hover:text-white/60">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Ligne résultat de recherche ──────────────────────────────────────────────

function SearchResultRow({
  result,
  onViewProfile,
  onAdd,
  onCancel,
  loading,
}: {
  result: SearchResult
  onViewProfile: (u: string) => void
  onAdd: (userId: string) => void
  onCancel: (id: string) => void
  loading: boolean
}) {
  const { friendshipStatus, isRequester } = result

  const actionSlot = () => {
    if (friendshipStatus === 'accepted') {
      return <span className="shrink-0 rounded-lg border border-game-success/20 bg-game-success/10 px-2 py-1 text-[10px] font-bold text-game-success/70">Amis ✓</span>
    }
    if (friendshipStatus === 'pending' && isRequester) {
      return (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-white/30">En attente</span>
          <button
            disabled={loading}
            onClick={() => result.friendshipId && onCancel(result.friendshipId)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/35 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger disabled:opacity-50"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )
    }
    if (friendshipStatus === 'pending') {
      return <span className="shrink-0 rounded-lg border border-white/[0.06] px-2 py-1 text-[10px] text-white/30">Reçue</span>
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
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <InitialAvatar username={result.username} size={30} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button onClick={() => onViewProfile(result.username)} className={`min-w-0 shrink truncate text-sm font-bold text-white ${playerLink}`}>
          {result.username}
        </button>
        {result.featuredBadges.length > 0 && (
          <span className="flex shrink-0 items-center gap-0.5">
            {result.featuredBadges.map(id => <MiniBadge key={id} achievementId={id} size={16} />)}
          </span>
        )}
      </div>
      <div className="shrink-0">{actionSlot()}</div>
    </div>
  )
}

// ─── RequestCard ──────────────────────────────────────────────────────────────

function RequestCard({
  req, onAccept, onReject, onCancel, onViewProfile,
}: {
  req: PendingRequest
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
  onViewProfile: (u: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <InitialAvatar username={req.username} size={30} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button onClick={() => onViewProfile(req.username)} className={`min-w-0 shrink truncate text-sm font-bold text-white ${playerLink}`}>
          {req.username}
        </button>
        {req.featuredBadges.length > 0 && (
          <span className="flex shrink-0 items-center gap-0.5">
            {req.featuredBadges.map(id => <MiniBadge key={id} achievementId={id} size={16} />)}
          </span>
        )}
      </div>
      {req.direction === 'received' ? (
        <div className="flex shrink-0 gap-1.5">
          <button onClick={() => onAccept(req.friendshipId)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-game-success/30 bg-game-success/10 text-game-success transition-colors hover:bg-game-success/25">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button onClick={() => onReject(req.friendshipId)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 transition-colors hover:border-white/20 hover:text-white/70">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-white/25">En attente</span>
          <button onClick={() => onCancel(req.friendshipId)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/35 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── FriendItem (avec confirmation avant suppression) ────────────────────────

function FriendItem({
  friend,
  compact,
  onViewProfile,
  onRemove,
}: {
  friend: FriendProfile
  compact?: boolean
  onViewProfile: (u: string) => void
  onRemove: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 2500)
    return () => clearTimeout(t)
  }, [confirming])

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 border-b border-white/[0.04] last:border-0 px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
        <InitialAvatar username={friend.username} size={26} />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button onClick={() => onViewProfile(friend.username)} className={`truncate text-xs font-bold text-white ${playerLink}`}>{friend.username}</button>
          {friend.featuredBadges.slice(0, 1).map(id => <MiniBadge key={id} achievementId={id} size={14} />)}
        </div>
        {confirming ? (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => { setConfirming(false); onRemove(friend.friendshipId) }} className="flex h-5 items-center gap-1 rounded border border-game-danger/40 bg-game-danger/15 px-1 text-[9px] font-bold text-game-danger">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Ok
            </button>
            <button onClick={() => setConfirming(false)} className="flex h-5 w-5 items-center justify-center rounded border border-white/[0.06] text-white/30 hover:text-white/60">
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-transparent text-white/20 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-2.5 last:border-0 transition-colors hover:bg-white/[0.02]">
      <InitialAvatar username={friend.username} size={30} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button onClick={() => onViewProfile(friend.username)} className={`min-w-0 shrink truncate text-sm font-bold text-white ${playerLink}`}>
          {friend.username}
        </button>
        {friend.featuredBadges.length > 0 && (
          <span className="flex shrink-0 items-center gap-0.5">
            {friend.featuredBadges.map(id => <MiniBadge key={id} achievementId={id} size={16} />)}
          </span>
        )}
      </div>
      {confirming ? (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => { setConfirming(false); onRemove(friend.friendshipId) }} className="flex h-[26px] items-center gap-1 rounded-lg border border-game-danger/40 bg-game-danger/15 px-1.5 text-[10px] font-bold text-game-danger transition-colors hover:bg-game-danger/25">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Ok
          </button>
          <button onClick={() => setConfirming(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-white/[0.06] text-white/30 transition-colors hover:text-white/60">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-white/20 transition-colors hover:border-game-danger/30 hover:bg-game-danger/10 hover:text-game-danger">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  )
}

// ─── SocialPage principale ────────────────────────────────────────────────────

export default function SocialPage({ onBack, onViewProfile, embedded = false }: Props) {
  const { user, profile } = useAuth()
  const toast = useToast()

  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const receivedRequests = requests.filter(r => r.direction === 'received')
  const sentRequests = requests.filter(r => r.direction === 'sent')

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [f, r] = await Promise.all([getFriends(user.id), getPendingRequests(user.id)])
      setFriends(f)
      setRequests(r)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchUsers(searchQuery, user?.id ?? null)
        setSearchResults(results)
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, user])

  // ── Actions ──

  async function handleAdd(targetUserId: string) {
    if (!user) return
    setActionLoading(true)
    try {
      const row = await sendFriendRequest(user.id, targetUserId)
      const target = searchResults.find(r => r.userId === targetUserId)
      setSearchResults(prev => prev.map(r =>
        r.userId === targetUserId ? { ...r, friendshipStatus: 'pending' as const, friendshipId: row.id, isRequester: true } : r
      ))
      // Injecte immédiatement dans les demandes envoyées
      if (target) {
        setRequests(prev => [...prev, {
          friendshipId: row.id,
          userId: target.userId,
          username: target.username,
          featuredBadges: target.featuredBadges,
          direction: 'sent' as const,
          createdAt: new Date().toISOString(),
        }])
      }
      toast.success('Demande envoyée !')
    } catch { toast.error("Impossible d'envoyer la demande") }
    finally { setActionLoading(false) }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(true)
    try {
      await acceptFriendRequest(friendshipId)
      await loadData()
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
      // Invalide dans les résultats de recherche si actifs
      setSearchResults(prev => prev.map(r =>
        r.friendshipId === friendshipId
          ? { ...r, friendshipStatus: null, friendshipId: null, isRequester: null }
          : r
      ))
      toast.success('Ami supprimé')
    } catch { toast.error('Impossible de supprimer') }
    finally { setActionLoading(false) }
  }

  async function handleCancel(friendshipId: string) {
    setActionLoading(true)
    try {
      await removeFriendship(friendshipId)
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId))
      setSearchResults(prev => prev.map(r =>
        r.friendshipId === friendshipId ? { ...r, friendshipStatus: null, friendshipId: null, isRequester: null } : r
      ))
      toast.success('Demande annulée')
    } catch { toast.error("Impossible d'annuler") }
    finally { setActionLoading(false) }
  }

  const isSearching = searchQuery.trim().length > 0

  // ── Sections ──

  const requestsSection = (receivedRequests.length > 0 || sentRequests.length > 0) && (
    <div className="flex flex-col gap-3">
      {receivedRequests.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wider text-game-danger/70">
            Demandes reçues · {receivedRequests.length}
          </p>
          <div className="flex flex-col gap-2">
            {receivedRequests.map(r => (
              <RequestCard key={r.friendshipId} req={r} onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} onViewProfile={onViewProfile} />
            ))}
          </div>
        </>
      )}
      {sentRequests.length > 0 && (
        <>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/20">
            Envoyées · {sentRequests.length}
          </p>
          <div className="flex flex-col gap-2">
            {sentRequests.map(r => (
              <RequestCard key={r.friendshipId} req={r} onAccept={handleAccept} onReject={handleReject} onCancel={handleCancel} onViewProfile={onViewProfile} />
            ))}
          </div>
        </>
      )}
    </div>
  )

  const leaderboardSection = user && profile && (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
        Classement entre amis
      </p>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] px-4 py-4">
        <FriendsLeaderboard
          friends={friends}
          myUserId={user.id}
          myUsername={profile.username}
          onViewProfile={onViewProfile}
          compact={embedded}
        />
      </div>
    </div>
  )

  const friendsListSection = (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
        Amis · {friends.length}
      </p>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : friends.length === 0 ? (
        <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-sm text-white/30">
          Pas encore d'amis — utilise la recherche pour en trouver !
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          {friends.map(f => (
            <FriendItem
              key={f.friendshipId}
              friend={f}
              onViewProfile={onViewProfile}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (embedded) {
    return (
      <div className="flex flex-col">
        <div className="flex w-full flex-1 gap-5 px-3 py-4">

          {/* ── Desktop : colonne gauche (sticky dans le scroll ProfilePage) ── */}
          <div className="hidden w-[380px] shrink-0 flex-col gap-3 self-start lg:flex lg:sticky lg:top-4">
          {/* Recherche */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Rechercher</p>
            <SearchBar query={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
            {isSearching && (
              <div className="mt-1 flex flex-col gap-1.5">
                {searchResults.length === 0 && !searchLoading ? (
                  <p className="text-center text-xs text-white/30">Aucun résultat</p>
                ) : (
                  searchResults.map(r => (
                    <SearchResultRow
                      key={r.userId}
                      result={r}
                      onViewProfile={onViewProfile}
                      onAdd={handleAdd}
                      onCancel={handleCancel}
                      loading={actionLoading}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Liste amis compacte (toujours visible) */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Amis</p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-white/30">{friends.length}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : friends.length === 0 ? (
              <p className="px-4 py-3 text-xs text-white/30">Aucun ami</p>
            ) : (
              friends.map(f => (
                <FriendItem key={f.friendshipId} friend={f} compact onViewProfile={onViewProfile} onRemove={handleRemove} />
              ))
            )}
          </div>
        </div>

        {/* ── Colonne droite (desktop) / pleine largeur (mobile) ── */}
        <div className="flex flex-1 flex-col gap-6 min-w-0">

          {/* Recherche mobile — résultats en overlay flottant */}
          <div className="relative lg:hidden">
            <SearchBar query={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
            {isSearching && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-white/[0.08] bg-game-card py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {searchResults.length === 0 && !searchLoading ? (
                  <p className="px-4 py-4 text-center text-xs text-white/30">Aucun résultat</p>
                ) : (
                  <div className="flex flex-col gap-0.5 px-2">
                    {searchResults.map(r => (
                      <SearchResultRow key={r.userId} result={r} onViewProfile={onViewProfile} onAdd={handleAdd} onCancel={handleCancel} loading={actionLoading} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contenu toujours visible */}
          {requestsSection}
          {leaderboardSection}
          {/* Liste amis mobile uniquement */}
          <div className="lg:hidden">{friendsListSection}</div>
        </div>
      </div>
    </div>
  )
}

  // ── Mode pleine page ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-game-bg">
      {/* Blob décoratif */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/[0.06] blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 border-b border-white/[0.06] bg-game-bg/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            ← Retour
          </button>
          <span className="text-sm font-black text-white">Social</span>
          <div className="w-20" />
        </motion.div>
      </div>

      {/* Contenu */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 py-6 lg:px-6">

        {/* ── Desktop : colonne gauche (sticky) ── */}
        <div className="hidden w-[300px] shrink-0 flex-col gap-4 self-start lg:flex lg:sticky lg:top-[65px]">
          {/* Recherche */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Rechercher</p>
            <SearchBar query={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
            {isSearching && (
              <div className="mt-1 flex flex-col gap-1.5">
                {searchResults.length === 0 && !searchLoading ? (
                  <p className="text-center text-xs text-white/30">Aucun résultat</p>
                ) : (
                  searchResults.map(r => (
                    <SearchResultRow
                      key={r.userId}
                      result={r}
                      onViewProfile={onViewProfile}
                      onAdd={handleAdd}
                      onCancel={handleCancel}
                      loading={actionLoading}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Liste amis compacte (toujours visible) */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Amis</p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-white/30">{friends.length}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              </div>
            ) : friends.length === 0 ? (
              <p className="px-4 py-3 text-xs text-white/30">Aucun ami</p>
            ) : (
              friends.map(f => (
                <FriendItem key={f.friendshipId} friend={f} compact onViewProfile={onViewProfile} onRemove={handleRemove} />
              ))
            )}
          </div>
        </div>

        {/* ── Colonne droite (desktop) / pleine largeur (mobile) ── */}
        <div className="flex flex-1 flex-col gap-6 min-w-0">

          {/* Recherche mobile — résultats en overlay flottant */}
          <div className="relative lg:hidden">
            <SearchBar query={searchQuery} onChange={setSearchQuery} loading={searchLoading} />
            {isSearching && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-white/[0.08] bg-game-card py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {searchResults.length === 0 && !searchLoading ? (
                  <p className="px-4 py-4 text-center text-xs text-white/30">Aucun résultat</p>
                ) : (
                  <div className="flex flex-col gap-0.5 px-2">
                    {searchResults.map(r => (
                      <SearchResultRow key={r.userId} result={r} onViewProfile={onViewProfile} onAdd={handleAdd} onCancel={handleCancel} loading={actionLoading} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contenu toujours visible */}
          {requestsSection}
          {leaderboardSection}
          {/* Liste amis mobile uniquement */}
          <div className="lg:hidden">{friendsListSection}</div>
        </div>
      </div>
    </div>
  )
}
