import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../contexts/ToastContext'
import { updatePassword, deleteAccount } from '../../../services/profile'
import { AppError } from '../../../services/errors'

interface Props {
  onBack: () => void
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ConfidentialityTab({ onBack }: Props) {
  const { profile, signOut } = useAuth()
  const toast = useToast()

  // ── Mot de passe ──
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) { setPasswordError('Minimum 8 caractères'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas'); return }
    setPasswordLoading(true)
    try {
      await updatePassword(newPassword)
      toast.success('Mot de passe mis à jour !')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordOpen(false)
    } catch (err) {
      setPasswordError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setPasswordLoading(false)
    }
  }

  function cancelPassword() {
    setPasswordOpen(false)
    setPasswordError('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // ── Suppression compte ──
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function openDeleteModal() { setDeleteConfirmText(''); setDeleteError(''); setShowDeleteModal(true) }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteAccount()
    } catch (err) {
      setDeleteError(err instanceof AppError ? err.message : 'Erreur lors de la suppression')
      setDeleteLoading(false)
      return
    }
    try { await signOut() } catch { /* ignoré intentionnellement */ }
    onBack()
  }

  const canDelete = deleteConfirmText === `@${profile?.username}` && !deleteLoading

  const inputClass = 'w-full rounded-lg border border-game-border bg-game-bg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-neon-violet/70 focus:ring-1 focus:ring-neon-violet/30'

  return (
    <div className="flex flex-col">

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-7 bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-game-border bg-game-card text-white/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Confidentialité</p>
            <p className="mt-0.5 text-xs text-white/35">Sécurité et gestion du compte</p>
          </div>
        </div>
      </div>

      {/* ─── Section Sécurité ──────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Sécurité</p>

        <div className="overflow-hidden rounded-xl border border-game-border bg-game-card/40 divide-y divide-game-border/60">
          {/* Mot de passe — accordion */}
          <div>
            <button
              onClick={() => setPasswordOpen(o => !o)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
            >
              <span className="shrink-0 text-white/35"><LockIcon /></span>
              <span className="w-28 shrink-0 text-xs text-white/35">Mot de passe</span>
              <span className="flex-1 text-sm tracking-widest text-white/25">••••••••</span>
              <ChevronIcon open={passwordOpen} />
            </button>

            <AnimatePresence initial={false}>
              {passwordOpen && (
                <motion.div
                  key="pwd-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-game-border/50"
                >
                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2 px-4 py-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoFocus
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Nouveau mot de passe (8 car. min.)"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Confirmer le mot de passe"
                    />
                    {passwordError && (
                      <p className="text-xs text-game-danger">{passwordError}</p>
                    )}
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={cancelPassword} disabled={passwordLoading} className="text-xs text-white/40 transition-colors hover:text-white/70 disabled:opacity-40">
                        Annuler
                      </button>
                      <button type="submit" disabled={passwordLoading || !newPassword || !confirmPassword} className="text-xs font-semibold text-neon-violet transition-opacity disabled:opacity-40 hover:text-neon-violet/80">
                        {passwordLoading ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sessions — placeholder bientôt */}
          <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
            <span className="shrink-0 text-white/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </span>
            <span className="w-28 shrink-0 text-xs text-white/35">Sessions actives</span>
            <span className="flex-1 text-sm text-white/20">—</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/30">Bientôt</span>
          </div>

          {/* 2FA — placeholder bientôt */}
          <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
            <span className="shrink-0 text-white/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span className="w-28 shrink-0 text-xs text-white/35">Double auth.</span>
            <span className="flex-1 text-sm text-white/20">Désactivée</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/30">Bientôt</span>
          </div>
        </div>
      </div>

      {/* ─── Zone critique ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-game-danger/60">Zone critique</p>

        <div className="overflow-hidden rounded-xl border border-game-danger/20 bg-game-danger/5">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-game-danger/30 bg-game-danger/10 text-game-danger">
              <TrashIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-game-danger">Supprimer mon compte</p>
              <p className="mt-0.5 text-xs text-white/30">Action irréversible — toutes tes données seront perdues</p>
            </div>
            <button
              onClick={openDeleteModal}
              className="shrink-0 rounded-lg border border-game-danger/40 bg-game-danger/10 px-3 py-1.5 text-xs font-medium text-game-danger transition-colors hover:bg-game-danger/20"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modale de confirmation ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-game-border bg-game-card shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            >
              {/* Header modale */}
              <div className="border-b border-game-danger/20 bg-game-danger/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-game-danger/30 bg-game-danger/15 text-game-danger">
                    <TrashIcon />
                  </div>
                  <p className="font-bold text-white">Supprimer mon compte</p>
                </div>
              </div>

              {/* Corps */}
              <div className="px-5 py-4">
                <p className="text-sm text-white/60">
                  Cette action est <strong className="text-white/80">irréversible</strong>. Toutes tes données seront définitivement supprimées.
                </p>
                <p className="mt-4 text-xs text-white/50">
                  Tape <strong className="font-mono text-white/80">@{profile?.username}</strong> pour confirmer :
                </p>
                <input
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-game-border bg-game-bg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-game-danger/60"
                  placeholder={`@${profile?.username}`}
                  autoComplete="off"
                />
                {deleteError && (
                  <p className="mt-2 text-xs text-game-danger">{deleteError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-game-border px-5 py-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className="flex-1 rounded-xl border border-game-border px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!canDelete}
                  className="flex-1 rounded-xl bg-game-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  {deleteLoading ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
