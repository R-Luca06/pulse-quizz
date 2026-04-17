import type { ReactNode } from 'react'
import { resolveCardDesign } from '../../constants/cosmetics/cardDesigns'

interface Props {
  equippedId: string | null
  children:   ReactNode
}

export default function CardDesignSlot({ equippedId, children }: Props) {
  const { Component } = resolveCardDesign(equippedId)
  return <Component>{children}</Component>
}
