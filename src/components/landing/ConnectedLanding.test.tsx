import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ConnectedLanding from './ConnectedLanding'
import GuestLanding from './GuestLanding'

// --- Mocks requis pour les composants rendus par PodiumScene ---

// LeaderboardCard et PlayerStatsCard appellent useAuth()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, profile: null, loading: false }),
}))

// LeaderboardCard appelle getCompTopScores
// PlayerStatsCard appelle getUserBestScore
// PodiumScene appelle getUserRank
vi.mock('../../services/leaderboard', () => ({
  getCompTopScores: vi.fn().mockResolvedValue([]),
  getUserBestScore: vi.fn().mockResolvedValue(0),
  getUserRank: vi.fn().mockResolvedValue(null),
}))

// PlayerStatsCard appelle fetchAllStats
vi.mock('../../services/cloudStats', () => ({
  fetchAllStats: vi.fn().mockResolvedValue({ categories: [], global: null }),
}))

// Flush les microtasks pendantes après chaque test pour éviter les warnings act()
// causés par LeaderboardCard.useEffect (promise résolue hors du wrapper act)
afterEach(async () => {
  await act(async () => {})
})

const noop = () => {}

function renderConnected(overrides: Partial<React.ComponentProps<typeof ConnectedLanding>> = {}) {
  const props: React.ComponentProps<typeof ConnectedLanding> = {
    onShowStats: noop,
    onShowProfile: noop,
    onShowAchievements: noop,
    onSignOut: noop,
    username: 'luca',
    ...overrides,
  }
  return render(<ConnectedLanding {...props} />)
}

describe('Landing branches (Story 5.2)', () => {
  it('ConnectedLanding rend le header et les cards latérales', () => {
    renderConnected()
    // Header : bouton Navigation (dropdown) présent
    expect(screen.getByRole('button', { name: /^navigation$/i })).toBeInTheDocument()
    // Cards latérales présentes (rendues 2× : layout mobile + layout desktop dans PodiumScene)
    expect(screen.getAllByText('Hall of Gloire').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mes Stats').length).toBeGreaterThan(0)
  })

  it('GuestLanding rend le hero avec un h1 unique et des CTAs auth', () => {
    renderGuest()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /s'inscrire/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /se connecter/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByTestId('avatar-placeholder')).not.toBeInTheDocument()
  })
})

function renderGuest(overrides: Partial<React.ComponentProps<typeof GuestLanding>> = {}) {
  const props: React.ComponentProps<typeof GuestLanding> = {
    onOpenSettings: noop,
    onOpenSignIn: noop,
    onOpenSignUp: noop,
    ...overrides,
  }
  return render(<GuestLanding {...props} />)
}

describe('GuestLanding vitrine (Story 6.1)', () => {
  it('rend le header vitrine avec les CTA Se connecter + S\'inscrire', () => {
    renderGuest()
    expect(screen.getAllByRole('button', { name: /^se connecter/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('button', { name: /^s'inscrire/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('affiche les 3 lignes Feature alternées avec h3', () => {
    renderGuest()
    expect(screen.getByRole('heading', { level: 3, name: /un quiz à ton rythme/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /compétition.*paroxysme/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /progresse.*débloque/i })).toBeInTheDocument()
  })

  it('affiche la FAQ et permet de déplier une question', () => {
    renderGuest()
    expect(screen.getByRole('heading', { level: 2, name: /questions fréquentes/i })).toBeInTheDocument()
    const firstQuestion = screen.getByRole('button', { name: /qu'est-ce que pulse quizz/i })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(firstQuestion)
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('GuestLanding CTA auth (Story 6.2)', () => {
  it('header vitrine : Se connecter appelle onOpenSignIn, S\'inscrire appelle onOpenSignUp', () => {
    const onOpenSignIn = vi.fn()
    const onOpenSignUp = vi.fn()
    renderGuest({ onOpenSignIn, onOpenSignUp })
    const signInButtons = screen.getAllByRole('button', { name: /^se connecter/i })
    const signUpButtons = screen.getAllByRole('button', { name: /^s'inscrire/i })
    // Header (sticky) + hero + FinalCtaSection => ≥3 boutons auth de chaque côté
    expect(signInButtons.length).toBeGreaterThanOrEqual(2)
    expect(signUpButtons.length).toBeGreaterThanOrEqual(2)
    fireEvent.click(signInButtons[0])
    fireEvent.click(signUpButtons[0])
    expect(onOpenSignIn).toHaveBeenCalledTimes(1)
    expect(onOpenSignUp).toHaveBeenCalledTimes(1)
  })

  it('hero : les CTA S\'inscrire + Se connecter sont visibles', () => {
    renderGuest()
    expect(screen.getAllByRole('button', { name: /^s'inscrire/i }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('button', { name: /^se connecter/i }).length).toBeGreaterThanOrEqual(2)
  })

  it('header vitrine : bouton Jouer présent (guest play accessible) et appelle onOpenSettings', () => {
    const onOpenSettings = vi.fn()
    renderGuest({ onOpenSettings })
    const playBtns = screen.getAllByRole('button', { name: /jouer maintenant en mode invité/i })
    expect(playBtns.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(playBtns[0])
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('header vitrine : aucun lien Classement/Statistiques/Achievements (nécessitent un compte)', () => {
    renderGuest()
    // La nav guest ne propose plus ces liens — le header est réservé à Jouer + auth.
    expect(screen.queryByRole('button', { name: /^classement$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^statistiques$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^achievements$/i })).not.toBeInTheDocument()
  })

  it('hero : bouton Play dédié avec mention explicite du mode Normal et appelle onOpenSettings (Story 6.3)', () => {
    const onOpenSettings = vi.fn()
    renderGuest({ onOpenSettings })
    // Mention explicite du mode normal sous le bouton Play
    expect(screen.getByText(/mode normal/i)).toBeInTheDocument()
    // Le bouton Jouer existe dans le hero (le header guest n'a plus de bouton Jouer)
    const playBtns = screen.getAllByRole('button', { name: /jouer maintenant en mode invité/i })
    expect(playBtns.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(playBtns[playBtns.length - 1])
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('section finale "Prêt à vibrer" présente avec CTA S\'inscrire', () => {
    renderGuest()
    expect(screen.getByRole('heading', { level: 2, name: /prêt à vibrer/i })).toBeInTheDocument()
  })

  it('tous les boutons auth ont un aria-label explicite', () => {
    renderGuest()
    const signInLabelled = screen.getAllByLabelText(/se connecter à pulse quizz/i)
    const signUpLabelled = screen.getAllByLabelText(/s'inscrire.*pulse quizz/i)
    expect(signInLabelled.length).toBeGreaterThanOrEqual(2)
    expect(signUpLabelled.length).toBeGreaterThanOrEqual(2)
  })
})

describe('ConnectedHeader via ConnectedLanding (Story 5.4)', () => {
  // Le header expose un bouton "Navigation" (icône grille) qui ouvre un dropdown
  // contenant Classement / Statistiques / Achievements / Inventaire.
  function openNavDropdown() {
    fireEvent.click(screen.getByRole('button', { name: /^navigation$/i }))
  }

  it('le dropdown Navigation expose Classement, Statistiques, Achievements (pas de bouton Profil dédié)', () => {
    renderConnected()
    openNavDropdown()
    expect(screen.getByRole('button', { name: /classement/i })).toHaveTextContent('Classement')
    expect(screen.getByRole('button', { name: /statistiques/i })).toHaveTextContent('Statistiques')
    expect(screen.getByRole('button', { name: /achievements/i })).toHaveTextContent('Achievements')
    expect(screen.queryByRole('button', { name: /^voir le profil$/i })).not.toBeInTheDocument()
  })

  it('clic sur Classement appelle onShowStats("leaderboard")', () => {
    const onShowStats = vi.fn()
    renderConnected({ onShowStats })
    openNavDropdown()
    fireEvent.click(screen.getByRole('button', { name: /classement/i }))
    expect(onShowStats).toHaveBeenCalledWith('leaderboard')
  })

  it('clic sur Statistiques appelle onShowProfile("stats")', () => {
    const onShowProfile = vi.fn()
    renderConnected({ onShowProfile })
    openNavDropdown()
    fireEvent.click(screen.getByRole('button', { name: /statistiques/i }))
    expect(onShowProfile).toHaveBeenCalledWith('stats')
  })

  it('clic sur Achievements appelle onShowProfile("achievements")', () => {
    const onShowProfile = vi.fn()
    renderConnected({ onShowProfile })
    openNavDropdown()
    fireEvent.click(screen.getByRole('button', { name: /achievements/i }))
    expect(onShowProfile).toHaveBeenCalledWith('achievements')
  })

  it('@username est cliquable et appelle onShowProfile', () => {
    const onShowProfile = vi.fn()
    renderConnected({ onShowProfile, username: 'luca' })
    const usernameBtn = screen.getByText('@luca').closest('button')
    expect(usernameBtn).not.toBeNull()
    fireEvent.click(usernameBtn!)
    expect(onShowProfile).toHaveBeenCalledTimes(1)
  })

  it('clic sur déconnexion appelle onSignOut', () => {
    const onSignOut = vi.fn()
    renderConnected({ onSignOut })
    fireEvent.click(screen.getByRole('button', { name: /se déconnecter/i }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('Podium scene (Story 8.1)', () => {
  it('rend le podium avec data-testid="podium"', () => {
    renderConnected()
    expect(screen.getByTestId('podium')).toBeInTheDocument()
  })

  it('rend les 4 slots de personnalisation réservés (data-slot)', () => {
    const { container } = renderConnected()
    expect(container.querySelector('[data-slot="behind-avatar"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="top-left"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="top-right"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="podium-front"]')).toBeInTheDocument()
  })
})

describe('Cards & CTA (Story 8.2)', () => {
  it('ConnectedLanding rend la LeaderboardCard sur desktop', async () => {
    renderConnected()
    // Card rendue 2× (mobile + desktop dans PodiumScene)
    expect(screen.getAllByText('Hall of Gloire').length).toBeGreaterThan(0)
    // Attend que l'effet async se termine (getCompTopScores retourne [])
    await waitFor(() =>
      expect(screen.getAllByText('Pas encore de scores').length).toBeGreaterThan(0),
    )
  })

  it('ConnectedLanding rend la PlayerStatsCard sur desktop', () => {
    renderConnected()
    expect(screen.getAllByText('Mes Stats').length).toBeGreaterThan(0)
  })

  // Note: le bouton JOUER est dans GameDock, monté par ConnectedBranch/LandingPage,
  // pas dans ConnectedLanding directement. Il est couvert par les tests d'intégration.
})
