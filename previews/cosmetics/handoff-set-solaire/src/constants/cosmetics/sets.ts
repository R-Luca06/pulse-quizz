/**
 * SET_REGISTRY — cosmetic sets (bundles of pieces with shared theme).
 *
 * Introduced with Set Solaire Vol. 01.
 * Non-destructive: existing cosmetics without a `setId` remain à-plat.
 *
 * A set is a *logical* grouping; nothing is stored in DB about sets.
 * Progress is derived from the user's owned cosmetic ids.
 */

import type { Tier } from './types';

export type SlotName =
  | 'emblem'
  | 'title'
  | 'card_design'
  | 'background'
  | 'screen_animation';

export interface CosmeticSet {
  id: string;
  name: string;
  volume: string;
  description: string;
  theme: string;           // semantic theme key (for future theming hooks)
  tier: Tier;              // dominant tier of the set
  pieces: {
    // One cosmetic id per single-instance slot
    emblem?: string;
    title?: string;
    card_design?: string;
    background?: string;
    screen_animation?: string;
    // Multiple badges allowed (user picks which to display)
    badges?: string[];
  };
  /** Gameplay bonus when the *full* set is owned AND equipped. Optional. */
  setBonus?: {
    key: string;           // e.g. 'xp_multiplier'
    value: number;         // e.g. 1.10 (= +10%)
    label: string;         // human-readable label for tooltips
  };
  /** Bundle pricing in shop. Optional. */
  shopBundle?: {
    priceUnits: number;    // cumulative price if bought à-la-carte
    priceBundle: number;   // discounted bundle price
    currency: 'pulses';
  };
}

export const SET_REGISTRY: Record<string, CosmeticSet> = {
  solaire_v1: {
    id: 'solaire_v1',
    name: 'Héliarque',
    volume: 'Vol. 01',
    description:
      'Forge solaire, or en fusion, braises ascendantes. Un set légendaire couronnant les joueurs qui ont traversé l’ère du feu.',
    theme: 'solar',
    tier: 'legendary',
    pieces: {
      emblem: 'heliarque',
      title: 'heliarque',
      card_design: 'or_en_fusion',
      background: 'horizon_incandescent',
      screen_animation: 'braises_ascendantes',
      badges: [
        'heliarque_eruption',
        'heliarque_couronne_solaire',
        'heliarque_phenix',
      ],
    },
    setBonus: {
      key: 'xp_multiplier',
      value: 1.1,
      label: '+10% XP en parties compétitives',
    },
    shopBundle: {
      priceUnits: 7500,
      priceBundle: 6000,
      currency: 'pulses',
    },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────

/** List all registered sets. */
export function listSets(): CosmeticSet[] {
  return Object.values(SET_REGISTRY);
}

/** Get a set by id, or undefined. */
export function getSet(setId: string): CosmeticSet | undefined {
  return SET_REGISTRY[setId];
}

/** Flatten the pieces of a set into a list of cosmetic ids. */
export function getSetPieceIds(set: CosmeticSet): string[] {
  const ids: string[] = [];
  if (set.pieces.emblem) ids.push(set.pieces.emblem);
  if (set.pieces.title) ids.push(set.pieces.title);
  if (set.pieces.card_design) ids.push(set.pieces.card_design);
  if (set.pieces.background) ids.push(set.pieces.background);
  if (set.pieces.screen_animation) ids.push(set.pieces.screen_animation);
  if (set.pieces.badges) ids.push(...set.pieces.badges);
  return ids;
}

/**
 * Compute progress of a user towards a set.
 * @param userOwnedIds  all cosmetic ids the user owns (any slot).
 * @param setId         the set to check.
 */
export function getSetProgress(
  userOwnedIds: readonly string[],
  setId: string,
): {
  owned: number;
  total: number;
  isComplete: boolean;
  missing: string[];
} {
  const set = getSet(setId);
  if (!set) return { owned: 0, total: 0, isComplete: false, missing: [] };

  const pieceIds = getSetPieceIds(set);
  const ownedSet = new Set(userOwnedIds);
  const ownedPieces = pieceIds.filter((id) => ownedSet.has(id));
  const missing = pieceIds.filter((id) => !ownedSet.has(id));

  return {
    owned: ownedPieces.length,
    total: pieceIds.length,
    isComplete: missing.length === 0,
    missing,
  };
}

/**
 * Does a user have the set fully EQUIPPED right now?
 * Used to decide whether to apply the `setBonus`.
 */
export function isSetEquipped(
  equipped: {
    emblem?: string | null;
    title?: string | null;
    card_design?: string | null;
    background?: string | null;
    screen_animation?: string | null;
  },
  setId: string,
): boolean {
  const set = getSet(setId);
  if (!set) return false;
  const { pieces } = set;
  if (pieces.emblem && equipped.emblem !== pieces.emblem) return false;
  if (pieces.title && equipped.title !== pieces.title) return false;
  if (pieces.card_design && equipped.card_design !== pieces.card_design) return false;
  if (pieces.background && equipped.background !== pieces.background) return false;
  if (pieces.screen_animation && equipped.screen_animation !== pieces.screen_animation) return false;
  return true;
}

/**
 * Reverse lookup: which set (if any) does a cosmetic belong to?
 * Useful for the inventory UI to show a "Part of: Héliarque" hint.
 */
export function getSetForCosmetic(cosmeticId: string): CosmeticSet | undefined {
  for (const set of listSets()) {
    if (getSetPieceIds(set).includes(cosmeticId)) return set;
  }
  return undefined;
}
