import { resolveEmblem } from '../../constants/cosmetics/emblems'

interface Props {
  equippedId: string | null
  rank:       number | null
}

export default function EmblemSlot({ equippedId, rank }: Props) {
  const { Component } = resolveEmblem(equippedId)
  return <Component rank={rank} />
}
