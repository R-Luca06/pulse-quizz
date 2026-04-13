import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvatarContainer from './AvatarContainer'

// AvatarDisplay utilise useAuth pour récupérer l'initiale du username
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { username: 'luca' }, user: null, loading: false }),
}))

describe('Avatar simplifié', () => {
  it('rend AvatarContainer sans erreur', () => {
    const { container } = render(<AvatarContainer className="h-32 w-32" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("affiche l'initiale du username", () => {
    render(<AvatarContainer className="h-32 w-32" />)
    expect(screen.getByText('L')).toBeInTheDocument()
  })
})
