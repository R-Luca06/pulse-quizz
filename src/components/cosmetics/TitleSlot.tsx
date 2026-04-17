import { resolveTitle } from '../../constants/cosmetics/titles'

interface Props {
  equippedId: string | null
  rank:       number | null
}

export default function TitleSlot({ equippedId, rank }: Props) {
  return <>{resolveTitle(equippedId, { rank })}</>
}
