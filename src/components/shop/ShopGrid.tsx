import { motion } from 'framer-motion'
import type { ShopItem } from '../../types/quiz'
import ShopItemCard from './ShopItemCard'

interface Props {
  items:   ShopItem[]
  owned:   Set<string>   // `${item_type}::${item_id}`
  balance: number
  onOpenItem: (item: ShopItem) => void
}

export default function ShopGrid({ items, owned, balance, onOpenItem }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-white/30">Aucun objet pour ce filtre</p>
      </div>
    )
  }
  return (
    <motion.div
      layout
      className="grid gap-3 p-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
    >
      {items.map((it, i) => (
        <ShopItemCard
          key={it.id}
          item={it}
          owned={owned.has(`${it.item_type}::${it.item_id}`)}
          balance={balance}
          onClick={onOpenItem}
          index={i}
        />
      ))}
    </motion.div>
  )
}
