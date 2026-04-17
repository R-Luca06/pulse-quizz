import { supabase } from './supabase'
import { AppError } from './errors'
import type { InventoryItem, ItemType, OwnedBadge, BadgeSource } from '../types/quiz'

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
