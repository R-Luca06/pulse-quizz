import { supabase } from './supabase'
import { AppError } from './errors'
import type { InventoryItem, ItemType, OwnedBadge, BadgeSource, CosmeticType } from '../types/quiz'

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserInventory(userId: string, itemType?: ItemType): Promise<InventoryItem[]> {
  let query = supabase
    .from('user_inventory')
    .select('item_type, item_id, source, obtained_at')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false })

  if (itemType) query = query.eq('item_type', itemType)

  const { data, error } = await query
  if (error) throw new AppError('db_error', error.message)

  return (data ?? []).map((row: { item_type: string; item_id: string; source: string; obtained_at: string }) => ({
    item_type:   row.item_type as ItemType,
    item_id:     row.item_id,
    source:      row.source as BadgeSource,
    obtained_at: row.obtained_at,
  }))
}

export async function getUserBadges(userId: string): Promise<OwnedBadge[]> {
  const items = await getUserInventory(userId, 'badge')
  return items as OwnedBadge[]
}

// ─── Equip cosmétiques ────────────────────────────────────────────────────────

const EQUIPPED_COLUMN: Record<CosmeticType, string> = {
  emblem:           'equipped_emblem_id',
  background:       'equipped_background_id',
  title:            'equipped_title_id',
  card_design:      'equipped_card_design_id',
  screen_animation: 'equipped_screen_anim_id',
}

export async function equipCosmetic(userId: string, type: CosmeticType, itemId: string | null): Promise<void> {
  const column = EQUIPPED_COLUMN[type]
  const { error } = await supabase
    .from('profiles')
    .update({ [column]: itemId })
    .eq('id', userId)
  if (error) throw new AppError('db_error', error.message)
}
