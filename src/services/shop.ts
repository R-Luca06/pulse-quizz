import { supabase } from './supabase'
import { AppError } from './errors'
import type { ShopItem, PurchaseResult, PurchaseErrorCode, ItemType, AchievementTier } from '../types/quiz'

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchShopItems(itemType?: ItemType): Promise<ShopItem[]> {
  let query = supabase
    .from('shop_items')
    .select('id, item_type, item_id, name, description, tier, price, is_new, is_limited, featured, available_from, available_until, sort_order')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('price', { ascending: true })

  if (itemType) query = query.eq('item_type', itemType)

  const { data, error } = await query
  if (error) throw new AppError('db_error', error.message)

  return (data ?? []).map(row => ({
    id:              row.id,
    item_type:       row.item_type as ItemType,
    item_id:         row.item_id,
    name:            row.name,
    description:     row.description,
    tier:            row.tier as AchievementTier,
    price:           row.price,
    is_new:          row.is_new,
    is_limited:      row.is_limited,
    featured:        row.featured,
    available_from:  row.available_from,
    available_until: row.available_until,
    sort_order:      row.sort_order,
  }))
}

// ─── Achat ────────────────────────────────────────────────────────────────────

export async function purchaseItem(shopItemId: string): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc('purchase_item', { p_shop_item_id: shopItemId })
  if (error) {
    const code = parsePurchaseError(error.message)
    throw new AppError(code, error.message)
  }
  return data as PurchaseResult
}

function parsePurchaseError(message: string): PurchaseErrorCode {
  if (message.includes('not_authenticated'))    return 'not_authenticated'
  if (message.includes('item_not_found'))       return 'item_not_found'
  if (message.includes('not_yet_available'))    return 'not_yet_available'
  if (message.includes('no_longer_available'))  return 'no_longer_available'
  if (message.includes('already_owned'))        return 'already_owned'
  if (message.includes('insufficient_balance')) return 'insufficient_balance'
  return 'unknown'
}
