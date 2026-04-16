import { supabase } from './supabase'
import type { PulsesSource } from '../constants/pulses'

export interface Wallet {
  balance:         number
  lifetime_earned: number
  updated_at:      string | null
}

export interface WalletTransaction {
  id:         string
  amount:     number
  source:     string
  source_ref: string | null
  created_at: string
}

export async function getWallet(userId: string): Promise<Wallet> {
  const { data } = await supabase
    .from('user_wallet')
    .select('balance, lifetime_earned, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  return (data as Wallet | null) ?? { balance: 0, lifetime_earned: 0, updated_at: null }
}

export async function getRecentTransactions(userId: string, limit = 10): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from('wallet_transactions')
    .select('id, amount, source, source_ref, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as WalletTransaction[] | null) ?? []
}

/**
 * Crédite des Pulses à l'utilisateur courant via la RPC `add_pulses`
 * (insert atomique ledger + upsert wallet).
 */
export async function addPulses(amount: number, source: PulsesSource, sourceRef?: string | null): Promise<number | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null
  const { data, error } = await supabase.rpc('add_pulses', {
    p_amount:     Math.round(amount),
    p_source:     source,
    p_source_ref: sourceRef ?? null,
  })
  if (error) throw new Error(error.message)
  const balance = (data as { balance?: number } | null)?.balance
  return typeof balance === 'number' ? balance : null
}

/** Somme des amounts crédités depuis il y a `sinceDays` jours (inclus). */
export async function getTransactionsSince(userId: string, sinceDays: number): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)
  const { data } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
  return (data ?? []).reduce((sum, r: { amount: number }) => sum + r.amount, 0)
}
