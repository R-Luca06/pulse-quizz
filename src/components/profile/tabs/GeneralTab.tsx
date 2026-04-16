import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../hooks/useAuth'
import { getLevelProgress } from '../../../constants/levels'
import { useToast } from '../../../contexts/ToastContext'
import { updateUsername, updateEmail, updateDescription } from '../../../services/profile'
import { AppError } from '../../../services/errors'
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  DEFAULT_PREFS,
  type NotificationPrefs,
} from '../../../services/notifications'
import { getRecentTransactions, getTransactionsSince, type WalletTransaction } from '../../../services/pulses'

// ─── Icônes inline ───────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <motion.svg
    animate={{ rotate: open ? 180 : 0 }}
    transition={{ duration: 0.2 }}
    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0 text-white/20"
  >
    <polyline points="6 9 12 15 18 9" />
  </motion.svg>
)

// ─── Boutons de form inline ───────────────────────────────────────────────────

function InlineActions({ onCancel, loading, disabled }: { onCancel: () => void; loading: boolean; disabled: boolean }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel} disabled={loading} className="text-xs text-white/40 transition-colors hover:text-white/70 disabled:opacity-40">
        Annuler
      </button>
      <button type="submit" disabled={disabled} className="text-xs font-semibold text-neon-violet transition-opacity disabled:opacity-40 hover:text-neon-violet/80">
        {loading ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}

// ─── Notification toggle ──────────────────────────────────────────────────────

function NotifToggle({
  label,
  description,
  enabled,
  loading,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  loading: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/70">{label}</p>
        <p className="text-xs text-white/30">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        aria-checked={enabled}
        role="switch"
        className={[
          'flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-all duration-200',
          loading ? 'cursor-wait opacity-50' : 'cursor-pointer',
          enabled ? 'bg-neon-violet/80' : 'bg-white/[0.08]',
        ].join(' ')}
      >
        <motion.div
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={['h-4 w-4 rounded-full shadow-sm transition-colors', enabled ? 'bg-white' : 'bg-white/30'].join(' ')}
        />
      </button>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type ActiveField = 'username' | 'email' | 'description' | null

export default function GeneralTab() {
  const { user, profile, refreshProfile, triggerAchievementCheck, setLocalDescription, totalXp, pulsesBalance } = useAuth()
  const xpData = getLevelProgress(totalXp)
  const toast = useToast()
  const initial = (profile?.username?.[0] ?? '?').toUpperCase()

  // ── Préférences notifications ──
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS })
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsReady, setPrefsReady] = useState(false)

  useEffect(() => {
    if (!user) return
    getNotificationPrefs(user.id).then(p => { setPrefs(p); setPrefsReady(true) }).catch(() => {})
  }, [user])

  async function handleTogglePref(key: keyof NotificationPrefs) {
    if (!user || prefsLoading) return
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setPrefsLoading(true)
    try {
      await updateNotificationPrefs(user.id, next)
    } catch {
      setPrefs(prefs) // rollback
      toast.error('Impossible de sauvegarder la préférence')
    } finally {
      setPrefsLoading(false)
    }
  }

  // ── Hero inline edit ──
  const [heroEdit, setHeroEdit] = useState(false)
  const [heroUsername, setHeroUsername] = useState(profile?.username ?? '')
  const [heroLoading, setHeroLoading] = useState(false)
  const [heroError, setHeroError] = useState<string | null>(null)

  useEffect(() => {
    setHeroUsername(profile?.username ?? '')
  }, [profile?.username])

  async function handleHeroSave() {
    if (!user) return
    setHeroError(null)
    setHeroLoading(true)
    try {
      await updateUsername(user.id, heroUsername)
      await refreshProfile()
      toast.success('Pseudo mis à jour')
      setHeroEdit(false)
      triggerAchievementCheck().catch(console.error)
    } catch (err) {
      setHeroError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setHeroLoading(false)
    }
  }

  function cancelHeroEdit() {
    setHeroEdit(false)
    setHeroError(null)
    setHeroUsername(profile?.username ?? '')
  }

  // ── Profil section accordion ──
  const [activeField, setActiveField] = useState<ActiveField>(null)
  const [username,    setUsername]    = useState(profile?.username ?? '')
  const [email,       setEmail]       = useState(user?.email ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [fieldLoading, setFieldLoading] = useState(false)
  const [fieldError,   setFieldError]   = useState<string | null>(null)

  useEffect(() => { setUsername(profile?.username ?? '') },    [profile?.username])
  useEffect(() => { setEmail(user?.email ?? '') },             [user?.email])
  useEffect(() => { setDescription(profile?.description ?? '') }, [profile?.description])

  function toggleField(field: ActiveField) {
    if (activeField === field) {
      setActiveField(null)
      setFieldError(null)
    } else {
      setActiveField(field)
      setFieldError(null)
      if (field === 'username')    setUsername(profile?.username ?? '')
      if (field === 'email')       setEmail(user?.email ?? '')
      if (field === 'description') setDescription(profile?.description ?? '')
    }
  }

  async function handleUsernameSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!user) return
    setFieldError(null)
    setFieldLoading(true)
    try {
      await updateUsername(user.id, username)
      await refreshProfile()
      toast.success('Pseudo mis à jour')
      setActiveField(null)
      triggerAchievementCheck().catch(console.error)
    } catch (err) {
      setFieldError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setFieldLoading(false)
    }
  }

  async function handleEmailSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!user) return
    setFieldError(null)
    setFieldLoading(true)
    try {
      await updateEmail(email)
      toast.success(`Confirmation envoyée à ${email}`)
      setActiveField(null)
    } catch (err) {
      setFieldError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setFieldLoading(false)
    }
  }

  async function handleDescriptionSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!user) return
    setFieldError(null)
    setFieldLoading(true)
    try {
      await updateDescription(user.id, description)
      setLocalDescription(description.trim())
      toast.success('Description mise à jour')
      setActiveField(null)
    } catch (err) {
      setFieldError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setFieldLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-game-border bg-game-bg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-neon-violet/70 focus:ring-1 focus:ring-neon-violet/30'

  return (
    <div className="flex flex-col">

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-8 bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-4 h-36 w-36 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative flex items-center gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-neon-violet/40 bg-game-card text-3xl font-black text-neon-violet shadow-[0_0_24px_rgba(139,92,246,0.18)]">
            {initial}
          </div>

          {/* Identité */}
          <div className="min-w-0 flex-1">
            {!heroEdit ? (
              <button
                onClick={() => setHeroEdit(true)}
                className="group flex items-center gap-1.5 text-left"
              >
                <span className="text-2xl font-black leading-tight text-white">
                  @{profile?.username ?? '—'}
                </span>
                <span className="mt-0.5 shrink-0 text-white/20 transition-colors group-hover:text-neon-violet/60">
                  <PencilIcon />
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-black text-white/40">@</span>
                  <input
                    value={heroUsername}
                    onChange={e => setHeroUsername(e.target.value)}
                    maxLength={20}
                    autoFocus
                    autoComplete="off"
                    className="w-full bg-transparent pb-0.5 text-2xl font-black text-white outline-none border-b border-neon-violet/60 focus:border-neon-violet placeholder-white/30"
                    placeholder="pseudo"
                  />
                </div>
                {heroError && <p className="text-xs text-game-danger">{heroError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelHeroEdit}
                    disabled={heroLoading}
                    className="text-xs text-white/40 transition-colors hover:text-white/70 disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleHeroSave}
                    disabled={heroLoading || heroUsername.trim() === profile?.username || heroUsername.trim().length < 3}
                    className="text-xs font-semibold text-neon-violet transition-opacity disabled:opacity-40 hover:text-neon-violet/80"
                  >
                    {heroLoading ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {!heroEdit && (
              <p className="mt-1 text-xs text-white/35">{user?.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bande XP (Option B) ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-game-border/40 bg-game-card/20 px-6 py-2.5">
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neon-violet/60">Niv.</span>
          <span className="text-sm font-black text-neon-violet">{xpData.level}</span>
        </div>
        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
            initial={{ width: 0 }}
            animate={{ width: `${xpData.percentage}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-[10px] text-white/30">
          {xpData.progressXp.toLocaleString('fr-FR')}&thinsp;/&thinsp;{xpData.neededXp.toLocaleString('fr-FR')} XP
        </span>
      </div>

      {/* ─── Wallet Pulses ──────────────────────────────────────────────────── */}
      {user && <WalletCard userId={user.id} balance={pulsesBalance} />}

      {/* ─── Section Profil ────────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Profil</p>

        <div className="overflow-hidden rounded-xl border border-game-border bg-game-card/40 divide-y divide-game-border/60">

          {/* Pseudo */}
          <div>
            <button
              onClick={() => toggleField('username')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-neon-violet/50"><PencilIcon /></span>
              <span className="w-20 shrink-0 text-xs text-white/35">Pseudo</span>
              <span className="flex-1 truncate text-sm text-white/70">@{profile?.username ?? '—'}</span>
              <ChevronIcon open={activeField === 'username'} />
            </button>
            <AnimatePresence initial={false}>
              {activeField === 'username' && (
                <motion.div
                  key="username-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-game-border/50"
                >
                  <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-2 px-4 py-3">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      maxLength={20}
                      autoFocus
                      autoComplete="off"
                      className={inputClass}
                      placeholder="3–20 caractères, lettres, chiffres ou _"
                    />
                    {fieldError && activeField === 'username' && (
                      <p className="text-xs text-game-danger">{fieldError}</p>
                    )}
                    <InlineActions
                      onCancel={() => { setActiveField(null); setFieldError(null) }}
                      loading={fieldLoading}
                      disabled={fieldLoading || username.trim() === profile?.username}
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div>
            <button
              onClick={() => toggleField('email')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-neon-blue/50">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <span className="w-20 shrink-0 text-xs text-white/35">Email</span>
              <span className="flex-1 truncate text-sm text-white/70">{user?.email}</span>
              <ChevronIcon open={activeField === 'email'} />
            </button>
            <AnimatePresence initial={false}>
              {activeField === 'email' && (
                <motion.div
                  key="email-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-game-border/50"
                >
                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2 px-4 py-3">
                    <p className="text-[10px] text-white/30">
                      Un lien de confirmation sera envoyé à la nouvelle adresse.
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      className={inputClass}
                      placeholder="nouvelle@adresse.com"
                    />
                    {fieldError && activeField === 'email' && (
                      <p className="text-xs text-game-danger">{fieldError}</p>
                    )}
                    <InlineActions
                      onCancel={() => { setActiveField(null); setFieldError(null) }}
                      loading={fieldLoading}
                      disabled={fieldLoading || email.trim() === user?.email}
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div>
            <button
              onClick={() => toggleField('description')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-white/30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
                </svg>
              </span>
              <span className="w-20 shrink-0 text-xs text-white/35">Description</span>
              <span className="flex-1 truncate text-sm text-white/70">
                {profile?.description ? profile.description : <span className="italic text-white/25">Non renseignée</span>}
              </span>
              <ChevronIcon open={activeField === 'description'} />
            </button>
            <AnimatePresence initial={false}>
              {activeField === 'description' && (
                <motion.div
                  key="description-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-game-border/50"
                >
                  <form onSubmit={handleDescriptionSubmit} className="flex flex-col gap-2 px-4 py-3">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={120}
                      autoFocus
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="Décris-toi en quelques mots…"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/25">{description.length}/120</span>
                      {fieldError && activeField === 'description' && (
                        <p className="text-xs text-game-danger">{fieldError}</p>
                      )}
                    </div>
                    <InlineActions
                      onCancel={() => { setActiveField(null); setFieldError(null) }}
                      loading={fieldLoading}
                      disabled={fieldLoading || description.trim() === (profile?.description ?? '')}
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ─── Section Notifications ──────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Notifications</p>

        <div className="overflow-hidden rounded-xl border border-game-border bg-game-card/40 divide-y divide-game-border/60">
          {!prefsReady ? (
            <div className="flex justify-center py-6">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          ) : (
            <>
              <NotifToggle
                label="Badges débloqués"
                description="Nouveaux trophées après une partie"
                enabled={prefs.achievement_unlocked}
                loading={prefsLoading}
                onToggle={() => handleTogglePref('achievement_unlocked')}
              />
              <NotifToggle
                label="Classement compétitif"
                description="Évolution de ton rang après une partie"
                enabled={prefs.rank_change}
                loading={prefsLoading}
                onToggle={() => handleTogglePref('rank_change')}
              />
            </>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── WalletCard ───────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  game_normal:           { label: 'Partie — normal',    icon: '🎯' },
  game_competitif:       { label: 'Partie — compétitif', icon: '🔥' },
  game_daily:            { label: 'Défi journalier',    icon: '📅' },
  achievement_common:    { label: 'Achievement',        icon: '🏆' },
  achievement_rare:      { label: 'Achievement rare',   icon: '🏆' },
  achievement_epic:      { label: 'Achievement épique', icon: '🏆' },
  achievement_legendary: { label: 'Achievement légendaire', icon: '🏆' },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1)  return "à l'instant"
  if (min < 60) return `il y a ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `il y a ${d}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function WalletCard({ userId, balance }: { userId: string; balance: number }) {
  const [recent, setRecent] = useState<WalletTransaction[] | null>(null)
  const [weekly, setWeekly] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getRecentTransactions(userId, 10).catch(() => [] as WalletTransaction[]),
      getTransactionsSince(userId, 7).catch(() => 0),
    ]).then(([tx, sum]) => {
      if (!cancelled) { setRecent(tx); setWeekly(sum) }
    })
    return () => { cancelled = true }
  }, [userId, balance])

  const visibleTx = expanded ? (recent ?? []) : (recent ?? []).slice(0, 3)
  const hasMoreTx = (recent?.length ?? 0) > 3

  return (
    <div className="px-5 pt-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Pulses</p>

      <div className="overflow-hidden rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.04] to-transparent">
        {/* Balance + weekly trend */}
        <div className="flex items-end justify-between gap-3 px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/60">Solde</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black leading-none text-cyan-300">◈</span>
              <span className="tabular-nums text-2xl font-black leading-none text-white">
                {balance.toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
          {weekly !== null && weekly > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-400">
              ↑ +{weekly.toLocaleString('fr-FR')} sur 7j
            </span>
          )}
        </div>

        {/* Recent transactions */}
        <div className="border-t border-cyan-400/10 bg-game-card/30">
          {recent === null ? (
            <div className="flex justify-center py-4">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
            </div>
          ) : recent.length === 0 ? (
            <p className="px-4 py-3 text-center text-[11px] italic text-white/30">
              Aucun gain pour le moment — joue une partie !
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {visibleTx.map(tx => {
                const meta = SOURCE_LABELS[tx.source] ?? { label: tx.source, icon: '◈' }
                return (
                  <li key={tx.id} className="flex items-center gap-2.5 px-4 py-2">
                    <span className="text-sm leading-none" aria-hidden="true">{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/60">{meta.label}</p>
                      <p className="text-[10px] text-white/25">{formatRelative(tx.created_at)}</p>
                    </div>
                    <span className="tabular-nums text-xs font-bold text-cyan-300">
                      +{tx.amount.toLocaleString('fr-FR')}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer — history link + boutique teaser */}
        <div className="flex items-center justify-between gap-2 border-t border-cyan-400/10 px-4 py-2.5">
          {hasMoreTx ? (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="text-[10px] font-semibold text-cyan-300/70 underline-offset-2 transition-colors hover:text-cyan-300 hover:underline"
            >
              {expanded ? '← Réduire' : `Voir l'historique complet →`}
            </button>
          ) : <span />}
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/40">
            Boutique bientôt
          </span>
        </div>
      </div>
    </div>
  )
}
