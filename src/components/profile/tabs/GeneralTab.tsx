import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../contexts/ToastContext'
import { updateUsername, updateEmail } from '../../../services/profile'
import { AppError } from '../../../services/errors'

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

// ─── Notification toggle (placeholder) ───────────────────────────────────────

function NotifRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/50">{label}</p>
        <p className="text-xs text-white/25">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded-full bg-neon-violet/10 px-2 py-0.5 text-[10px] font-semibold text-neon-violet/60">
          Bientôt
        </span>
        {/* Toggle placeholder */}
        <div className="flex h-5 w-9 cursor-not-allowed items-center rounded-full bg-white/[0.06] px-0.5 opacity-40">
          <div className="h-4 w-4 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type ActiveField = 'username' | 'email' | null

export default function GeneralTab() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const initial = (profile?.username?.[0] ?? '?').toUpperCase()

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
  const [username, setUsername] = useState(profile?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [fieldLoading, setFieldLoading] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => { setUsername(profile?.username ?? '') }, [profile?.username])
  useEffect(() => { setEmail(user?.email ?? '') }, [user?.email])

  function toggleField(field: ActiveField) {
    if (activeField === field) {
      setActiveField(null)
      setFieldError(null)
    } else {
      setActiveField(field)
      setFieldError(null)
      if (field === 'username') setUsername(profile?.username ?? '')
      if (field === 'email') setEmail(user?.email ?? '')
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

          {/* Description — placeholder bientôt */}
          <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
            <span className="shrink-0 text-white/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
              </svg>
            </span>
            <span className="w-20 shrink-0 text-xs text-white/35">Description</span>
            <span className="flex-1 text-sm text-white/25 italic">Non renseignée</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/30">
              Bientôt
            </span>
          </div>

        </div>
      </div>

      {/* ─── Section Notifications ──────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Notifications</p>

        <div className="overflow-hidden rounded-xl border border-game-border bg-game-card/40 divide-y divide-game-border/60">
          <NotifRow label="Nouvelles fonctionnalités" description="Sois le premier informé des mises à jour" />
          <NotifRow label="Résultats de quiz" description="Partages et défis reçus" />
          <NotifRow label="Rappels de pratique" description="Pour maintenir ta série" />
          <NotifRow label="Promotions" description="Offres et événements spéciaux" />
        </div>
      </div>

    </div>
  )
}
