import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  type AppNotification,
  type NotifType,
} from '../../services/notifications'

// ─── Couleurs par type ────────────────────────────────────────────────────────

const TYPE_ICON_COLOR: Record<NotifType, string> = {
  achievement_unlocked: 'text-amber-400/90 bg-amber-400/10',
  rank_up:              'text-game-success bg-game-success/10',
  rank_down:            'text-game-danger  bg-game-danger/10',
}

const DOT_COLOR: Record<NotifType, string> = {
  achievement_unlocked: 'bg-amber-400',
  rank_up:              'bg-game-success',
  rank_down:            'bg-game-danger',
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotifType }) {
  const cls = `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TYPE_ICON_COLOR[type]}`

  switch (type) {
    case 'achievement_unlocked':
      return (
        <div className={cls}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
      )
    case 'rank_up':
      return (
        <div className={cls}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </div>
      )
    case 'rank_down':
      return (
        <div className={cls}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      )
  }
}

// ─── Texte de notification ────────────────────────────────────────────────────

function notifContent(n: AppNotification): { main: string; sub?: string } {
  const d = n.data
  switch (n.type) {
    case 'achievement_unlocked':
      return { main: 'Badge débloqué', sub: `${d.badge_icon ?? ''} ${d.badge_name ?? ''}`.trim() }
    case 'rank_up':
      return {
        main: `Tu grimpes au rang #${d.new_rank}`,
        sub: `+${d.delta} place${Number(d.delta) > 1 ? 's' : ''}`,
      }
    case 'rank_down':
      return {
        main: `Tu descends au rang #${d.new_rank}`,
        sub: `-${d.delta} place${Number(d.delta) > 1 ? 's' : ''}`,
      }
  }
}

// ─── Timestamp relatif ────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'hier'
  return `il y a ${d} j`
}

// ─── Ligne notification ───────────────────────────────────────────────────────

function NotifRow({ n, onRead }: { n: AppNotification; onRead: (id: string) => void }) {
  const { main, sub } = notifContent(n)
  return (
    <button
      onClick={() => { if (!n.read) onRead(n.id) }}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
    >
      <NotifIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${n.read ? 'text-white/50' : 'font-semibold text-white'}`}>
          {main}
        </p>
        {sub && (
          <p className={`mt-0.5 text-xs ${n.read ? 'text-white/25' : 'text-white/50'}`}>{sub}</p>
        )}
        <p className="mt-1 text-[10px] text-white/25">{relativeTime(n.created_at)}</p>
      </div>
      {!n.read && (
        <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[n.type]}`} />
      )}
    </button>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  userId: string
  notifications: AppNotification[]
  loading: boolean
  onRead: (id: string) => void
  onReadAll: () => void
  onClose: () => void
}

function NotifPanelContent({ userId: _userId, notifications, loading, onRead, onReadAll, onClose }: PanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-game-card shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-game-danger/20 px-2 py-0.5 text-[10px] font-bold text-game-danger">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onReadAll}
              className="text-[10px] font-semibold text-white/30 transition-colors hover:text-neon-violet"
            >
              Tout lire
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-white/30 transition-colors hover:text-white/60"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-white/[0.04]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] text-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-white/30">Aucune notification</p>
            <p className="text-xs text-white/20">Tu es à jour !</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotifRow key={n.id} n={n} onRead={onRead} />
          ))
        )}
      </div>
    </motion.div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [dataLoaded, setDataLoaded]   = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  // Badge au montage
  useEffect(() => {
    getUnreadCount(userId).then(setUnreadCount).catch(() => {})
  }, [userId])

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

  // Charge les données à l'ouverture
  const loadData = useCallback(async () => {
    if (dataLoaded) return
    setLoading(true)
    try {
      const data = await getNotifications(userId)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
      setDataLoaded(true)
    } catch {
      // silencieux
    } finally {
      setLoading(false)
    }
  }, [userId, dataLoaded])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  // ── Actions ──

  async function handleRead(notificationId: string) {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(c => Math.max(0, c - 1))
    await markRead(notificationId)
  }

  async function handleReadAll() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await markAllRead(userId)
  }

  function handleToggle() {
    setOpen(o => !o)
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className={[
          'relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
          open
            ? 'border-neon-violet/50 bg-neon-violet/15 text-neon-violet'
            : 'border-white/10 bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/80',
        ].join(' ')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-game-danger px-1 text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <div className="absolute right-0 top-11 z-50">
            <NotifPanelContent
              userId={userId}
              notifications={notifications}
              loading={loading}
              onRead={handleRead}
              onReadAll={handleReadAll}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
