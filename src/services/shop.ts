import { supabase } from './supabase'
import { AppError } from './errors'
import type { ShopItem, ShopBundle, PurchaseResult, BundlePurchaseResult, PurchaseErrorCode, ItemType, AchievementTier } from '../types/quiz'

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

// ─── Bundles ──────────────────────────────────────────────────────────────────

export async function fetchShopBundles(): Promise<ShopBundle[]> {
  const { data, error } = await supabase
    .from('shop_bundles')
    .select(`
      id, slug, name, description, tier, price, is_new, is_limited, featured,
      available_from, available_until, sort_order,
      shop_bundle_items (
        sort_order,
        shop_items ( id, item_type, item_id, name, description, tier, price, is_new, is_limited, featured, available_from, available_until, sort_order )
      )
    `)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })

  if (error) throw new AppError('db_error', error.message)

  return (data ?? []).map(row => ({
    id:              row.id,
    slug:            row.slug,
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
    items: ((row.shop_bundle_items ?? []) as Array<{ sort_order: number; shop_items: unknown }>)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(sbi => {
        const si = sbi.shop_items as {
          id: string
          item_type: string
          item_id: string
          name: string
          description: string | null
          tier: string
          price: number
          is_new: boolean
          is_limited: boolean
          featured: boolean
          available_from: string | null
          available_until: string | null
          sort_order: number
        }
        return {
          id:              si.id,
          item_type:       si.item_type as ItemType,
          item_id:         si.item_id,
          name:            si.name,
          description:     si.description,
          tier:            si.tier as AchievementTier,
          price:           si.price,
          is_new:          si.is_new,
          is_limited:      si.is_limited,
          featured:        si.featured,
          available_from:  si.available_from,
          available_until: si.available_until,
          sort_order:      si.sort_order,
        }
      }),
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

export async function purchaseBundle(bundleId: string): Promise<BundlePurchaseResult> {
  const { data, error } = await supabase.rpc('purchase_bundle', { p_bundle_id: bundleId })
  if (error) {
    const code = parsePurchaseError(error.message)
    throw new AppError(code, error.message)
  }
  return data as BundlePurchaseResult
}

function parsePurchaseError(message: string): PurchaseErrorCode {
  if (message.includes('not_authenticated'))    return 'not_authenticated'
  if (message.includes('bundle_not_found'))     return 'bundle_not_found'
  if (message.includes('item_not_found'))       return 'item_not_found'
  if (message.includes('not_yet_available'))    return 'not_yet_available'
  if (message.includes('no_longer_available'))  return 'no_longer_available'
  if (message.includes('already_owned'))        return 'already_owned'
  if (message.includes('insufficient_balance')) return 'insufficient_balance'
  return 'unknown'
}
