import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

function getAuthError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string; status?: number; code?: string }
    const msg = e.message ?? ''
    const code = e.code ?? ''
    if (msg.includes('Email already') || msg.includes('User already registered') || code === 'email_exists') return 'Email déjà utilisé'
    if (msg.includes('Invalid login') || msg.includes('Invalid email or password')) return 'Identifiants incorrects'
    if (msg.includes('Password should') || msg.includes('at least 6') || code === 'weak_password') return 'Mot de passe trop court (6 car. min.)'
    if (msg.includes('duplicate key') && msg.includes('username')) return 'Pseudo déjà pris'
    if (code === 'email_address_not_authorized') return 'Adresse email non autorisée'
    if (e.status === 422) return 'Données invalides — vérifie ton email et ton mot de passe'
  }
  return 'Une erreur est survenue — réessaie'
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-neon-violet/60 focus:outline-none'

export default function AuthModal({ onClose, defaultTab = 'signin' }: Props) {
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab)
  const { signIn, signUp } = useAuth()
  const toast = useToast()

  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siError, setSiError] = useState('')
  const [siLoading, setSiLoading] = useState(false)

  const [suUsername, setSuUsername] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suError, setSuError] = useState('')
  const [suLoading, setSuLoading] = useState(false)

  // Fermeture sur Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSiError('')
    setSiLoading(true)
    try {
      await signIn(siEmail, siPassword)
      toast.success('Connexion réussie !')
      onClose()
    } catch (err) {
      setSiError(getAuthError(err))
    } finally {
      setSiLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setSuError('')
    const USERNAME_RE = /^[a-zA-Z0-9_-]{2,20}$/
    if (!USERNAME_RE.test(suUsername.trim())) {
      setSuError('Pseudo invalide — lettres, chiffres, _ et - uniquement (2–20 car.)')
      return
    }
    setSuLoading(true)
    try {
      await signUp(suEmail, suPassword, suUsername.trim())
      toast.success('Compte créé — bienvenue !')
      onClose()
    } catch (err) {
      setSuError(getAuthError(err))
    } finally {
      setSuLoading(false)
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d18] p-6 shadow-2xl"
          initial={{ scale: 0.92, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => setTab('signin')}
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  tab === 'signin' ? 'bg-neon-violet/20 text-white' : 'text-white/40 hover:text-white/60',
                ].join(' ')}
              >
                Connexion
              </button>
              <button
                onClick={() => setTab('signup')}
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  tab === 'signup' ? 'bg-neon-violet/20 text-white' : 'text-white/40 hover:text-white/60',
                ].join(' ')}
              >
                Inscription
              </button>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'signin' ? (
              <motion.form
                key="signin"
                name="signin-form"
                onSubmit={handleSignIn}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
              >
                <input
                  id="si-email"
                  name="email"
                  type="email"
                  value={siEmail}
                  onChange={e => setSiEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  autoFocus
                  className={inputClass}
                />
                <input
                  id="si-password"
                  name="password"
                  type="password"
                  value={siPassword}
                  onChange={e => setSiPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
                {siError && <p className="text-xs text-game-danger">{siError}</p>}
                <motion.button
                  type="submit"
                  disabled={siLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-1 w-full rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {siLoading ? '…' : 'Se connecter'}
                </motion.button>
                <p className="text-center text-xs text-white/30">
                  Pas encore de compte ?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-neon-violet underline underline-offset-2">
                    Créer un compte
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                name="signup-form"
                onSubmit={handleSignUp}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-3"
              >
                <input
                  id="su-username"
                  name="username"
                  type="text"
                  value={suUsername}
                  onChange={e => setSuUsername(e.target.value)}
                  placeholder="Pseudo (2–20 car.)"
                  required
                  maxLength={20}
                  autoComplete="username"
                  autoFocus
                  className={inputClass}
                />
                <input
                  id="su-email"
                  name="email"
                  type="email"
                  value={suEmail}
                  onChange={e => setSuEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
                <input
                  id="su-password"
                  name="password"
                  type="password"
                  value={suPassword}
                  onChange={e => setSuPassword(e.target.value)}
                  placeholder="Mot de passe (6 car. min.)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                />
                {suError && <p className="text-xs text-game-danger">{suError}</p>}
                <motion.button
                  type="submit"
                  disabled={suLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-1 w-full rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {suLoading ? '…' : 'Créer mon compte'}
                </motion.button>
                <p className="text-center text-xs text-white/30">
                  Déjà un compte ?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-neon-violet underline underline-offset-2">
                    Se connecter
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  )
}
