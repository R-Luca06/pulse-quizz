import { Component, type ReactNode } from 'react'
import AvatarPlaceholder from './AvatarPlaceholder'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AvatarErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[AvatarErrorBoundary] avatar failed to load:', error)
  }

  render() {
    if (this.state.hasError) {
      return <AvatarPlaceholder />
    }
    return this.props.children
  }
}
