import { resolveAnimation } from '../../constants/cosmetics/screenAnimations'

interface Props {
  equippedId: string | null
}

export default function ScreenAnimationSlot({ equippedId }: Props) {
  const { Component } = resolveAnimation(equippedId)
  if (!Component) return null
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' }}
    >
      <Component />
    </div>
  )
}
