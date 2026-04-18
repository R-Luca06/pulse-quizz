import type posthogJs from 'posthog-js'
import type { GameMode, Difficulty, Category, Language, ShopItem } from '../types/quiz'

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined

let ph: typeof posthogJs | null = null

export function initAnalytics(): void {
  if (!KEY) return
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(KEY!, {
      api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: false,
    })
    ph = posthog
  })
}

export function identifyUser(id: string, traits: { username?: string; email?: string }): void {
  ph?.identify(id, traits)
}

export function resetIdentity(): void {
  ph?.reset()
}

// ── Events ────────────────────────────────────────────────────────────────────

export function trackScreenViewed(screen: string): void {
  ph?.capture('screen_viewed', { screen })
}

export function trackGameStarted(props: {
  mode: GameMode
  difficulty: Difficulty
  category: Category
  language: Language
}): void {
  ph?.capture('game_started', props)
}

export function trackGameFinished(props: {
  mode: GameMode
  difficulty: Difficulty
  category: Category
  language: Language
  score: number
  questions_answered: number
  end_reason: 'completed' | 'wrong_answer' | 'timeout'
}): void {
  ph?.capture('game_finished', props)
}

export function trackGameAbandoned(props: {
  mode: GameMode
  difficulty: Difficulty
  category: Category
  language: Language
}): void {
  ph?.capture('game_abandoned', props)
}

export function trackUserSignedUp(props: { username: string }): void {
  ph?.capture('user_signed_up', props)
}

export function trackUserSignedIn(): void {
  ph?.capture('user_signed_in')
}

export function trackShopItemViewed(item: ShopItem): void {
  ph?.capture('shop_item_viewed', {
    shop_item_id: item.id,
    item_type:    item.item_type,
    item_id:      item.item_id,
    tier:         item.tier,
    price:        item.price,
  })
}

export function trackShopItemPurchased(item: ShopItem, newBalance: number): void {
  ph?.capture('shop_item_purchased', {
    shop_item_id: item.id,
    item_type:    item.item_type,
    item_id:      item.item_id,
    tier:         item.tier,
    price:        item.price,
    new_balance:  newBalance,
  })
}
