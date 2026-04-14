import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LandingPage from './LandingPage'
import type { GameSettings } from '../../hooks/useSettings'

const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

// ArenaBackground invoque Spline/WebGL — simplifié en stub.
vi.mock('./ArenaBackground', () => ({
  default: () => <div data-testid="arena-bg" />,
}))

// ConnectedLanding utilise un AvatarContainer lazy + Spline — stub.
vi.mock('./ConnectedLanding', () => ({
  default: () => <div data-testid="connected-landing" />,
}))

vi.mock('./GuestLanding', () => ({
  default: () => <div data-testid="guest-landing" />,
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

function renderLanding() {
  return render(
    <LandingPage
      settings={makeSettings()}
      onSettingsChange={vi.fn()}
      onStart={vi.fn()}
      onExplosion={vi.fn()}
      screen="landing"
      onShowStats={vi.fn()}
      onOpenSignIn={vi.fn()}
      onOpenSignUp={vi.fn()}
      onShowProfile={vi.fn()}
      onShowAchievements={vi.fn()}
      onViewProfile={vi.fn()}
    />,
  )
}

describe('LandingPage — bascule vitrine ↔ connectée (Story 6.5)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('affiche un loader pendant que AuthContext est en cours de chargement', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      signOut: vi.fn(),
    })
    renderLanding()
    expect(screen.getByRole('status', { name: /chargement/i })).toBeInTheDocument()
    expect(screen.queryByTestId('guest-landing')).not.toBeInTheDocument()
    expect(screen.queryByTestId('connected-landing')).not.toBeInTheDocument()
  })

  it('rend GuestLanding quand user est null après chargement', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signOut: vi.fn(),
    })
    renderLanding()
    expect(screen.getByTestId('guest-landing')).toBeInTheDocument()
    expect(screen.queryByTestId('connected-landing')).not.toBeInTheDocument()
  })

  it('rend ConnectedLanding quand user est non-null', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      profile: { username: 'luca' },
      loading: false,
      signOut: vi.fn(),
    })
    renderLanding()
    expect(screen.getByTestId('connected-landing')).toBeInTheDocument()
    expect(screen.queryByTestId('guest-landing')).not.toBeInTheDocument()
  })

  it('bascule de GuestLanding vers ConnectedLanding quand user devient non-null', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      signOut: vi.fn(),
    })
    const { rerender } = renderLanding()
    expect(screen.getByTestId('guest-landing')).toBeInTheDocument()

    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      profile: { username: 'luca' },
      loading: false,
      signOut: vi.fn(),
    })
    rerender(
      <LandingPage
        settings={makeSettings()}
        onSettingsChange={vi.fn()}
        onStart={vi.fn()}
        onExplosion={vi.fn()}
        screen="landing"
        onShowStats={vi.fn()}
        onOpenSignIn={vi.fn()}
        onOpenSignUp={vi.fn()}
        onShowProfile={vi.fn()}
        onShowAchievements={vi.fn()}
      />,
    )

    // AnimatePresence mode="wait" retient le guest pendant l'exit animation ;
    // on attend que le connected finisse par monter.
    await waitFor(() => {
      expect(screen.getByTestId('connected-landing')).toBeInTheDocument()
    })
  })
})
