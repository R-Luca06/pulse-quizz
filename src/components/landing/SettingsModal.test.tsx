import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsModal from './SettingsModal'
import type { GameSettings } from '../../hooks/useSettings'

const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

function makeSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    mode: 'normal',
    difficulty: 'easy',
    language: 'fr',
    category: 'all',
    ...overrides,
  }
}

interface RenderOpts {
  onSettingsChange?: ReturnType<typeof vi.fn>
  onLaunch?: ReturnType<typeof vi.fn>
  onRequireAuth?: ReturnType<typeof vi.fn>
}

function renderModal(settings: GameSettings, opts: RenderOpts = {}) {
  const onSettingsChange = opts.onSettingsChange ?? vi.fn()
  const onLaunch = opts.onLaunch ?? vi.fn()
  const onRequireAuth = opts.onRequireAuth
  return {
    onSettingsChange,
    onLaunch,
    onRequireAuth,
    ...render(
      <SettingsModal
        settings={settings}
        onSettingsChange={onSettingsChange}
        onLaunch={onLaunch}
        onClose={vi.fn()}
        onShowRules={vi.fn()}
        onRequireAuth={onRequireAuth}
      />,
    ),
  }
}

describe('SettingsModal — guest flow (Story 6.3 / 6.4)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
    localStorage.clear()
  })

  it('affiche le mode compétitif en état verrouillé quand user === null', () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderModal(makeSettings())

    const compBtn = screen.getByRole('button', { name: /^compétitif/i })
    expect(compBtn).toBeInTheDocument()
    expect(compBtn).toHaveAttribute('aria-disabled', 'true')
    expect(compBtn).toHaveAttribute('title', 'Connexion requise')
    expect(screen.getByText(/connexion requise/i)).toBeInTheDocument()
  })

  it('force mode === "normal" au montage si user === null et mode === "compétitif"', () => {
    mockUseAuth.mockReturnValue({ user: null })
    const onSettingsChange = vi.fn()
    renderModal(makeSettings({ mode: 'compétitif', difficulty: 'mixed', category: 'all' }), { onSettingsChange })

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'normal' }),
    )
  })

  it('ne force PAS le mode si l\'utilisateur est connecté', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'abc' } })
    const onSettingsChange = vi.fn()
    renderModal(makeSettings({ mode: 'compétitif', difficulty: 'mixed', category: 'all' }), { onSettingsChange })

    expect(onSettingsChange).not.toHaveBeenCalled()
  })

  it('le mode compétitif reste actif (non verrouillé) lorsque user est connecté', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'abc' } })
    renderModal(makeSettings())

    const compBtn = screen.getByRole('button', { name: /^compétitif/i })
    expect(compBtn).toHaveAttribute('aria-disabled', 'false')
  })

  it('laisse la difficulté et la catégorie modifiables pour un invité', () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderModal(makeSettings())

    expect(screen.getByRole('button', { name: /facile/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /moyen/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /difficile/i })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: /catégorie de questions/i })).toBeEnabled()
  })

  it('clic sur le bouton compétitif verrouillé déclenche onRequireAuth (AC3)', () => {
    mockUseAuth.mockReturnValue({ user: null })
    const onRequireAuth = vi.fn()
    const { onSettingsChange } = renderModal(makeSettings(), { onRequireAuth })

    onSettingsChange.mockClear()
    const compBtn = screen.getByRole('button', { name: /^compétitif/i })
    fireEvent.click(compBtn)

    expect(onRequireAuth).toHaveBeenCalledTimes(1)
    expect(onSettingsChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'compétitif' }),
    )
  })

  it('garde-fou : clic sur Lancer déclenche onRequireAuth si guest + mode compétitif (AC4)', () => {
    mockUseAuth.mockReturnValue({ user: null })
    const onLaunch = vi.fn()
    const onRequireAuth = vi.fn()
    // useEffect reset immédiatement le mode côté parent — on neutralise
    // onSettingsChange pour simuler un mode compétitif qui persiste
    // (cas contournement DevTools / session expirée).
    const onSettingsChange = vi.fn()
    renderModal(makeSettings({ mode: 'compétitif', difficulty: 'mixed', category: 'all' }), {
      onLaunch,
      onRequireAuth,
      onSettingsChange,
    })

    const launchBtn = screen.getByRole('button', { name: /entrer en compétition/i })
    fireEvent.click(launchBtn)

    expect(onRequireAuth).toHaveBeenCalledTimes(1)
    expect(onLaunch).not.toHaveBeenCalled()
  })
})
