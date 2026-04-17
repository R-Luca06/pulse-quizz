import { resolveBackground } from '../../constants/cosmetics/backgrounds'

interface Props {
  equippedId: string | null
}

export default function BackgroundSlot({ equippedId }: Props) {
  const { Component } = resolveBackground(equippedId)
  if (!Component) return null
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      <Component />
    </div>
  )
}
