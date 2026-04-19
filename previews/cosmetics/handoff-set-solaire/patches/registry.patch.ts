/**
 * PATCH for: src/constants/cosmetics/registry.ts
 *
 * 1. Add an optional `setId` to the base Cosmetic interface.
 * 2. Re-export the set helpers.
 */

// ─── 1. Base type update ────────────────────────────────────
// Locate the base interface (likely named `Cosmetic` or `BaseCosmetic`)
// and add this field:

export interface CosmeticBasePatch {
  // ...existing fields (id, name, tier, ...)
  /** Optional — when present, piece belongs to the set of that id. */
  setId?: string;
}

// ─── 2. Re-exports ──────────────────────────────────────────
// Add at the bottom of registry.ts:

export {
  SET_REGISTRY,
  listSets,
  getSet,
  getSetPieceIds,
  getSetProgress,
  isSetEquipped,
  getSetForCosmetic,
} from './sets';

export type { CosmeticSet, SlotName } from './sets';

/*
 * OPTIONAL: add a convenience lookup that combines inventory + sets.
 *
 *   export function getInventoryView(userOwnedIds: string[]) {
 *     return {
 *       loose: userOwnedIds.filter(id => !getSetForCosmetic(id)),
 *       bySet: listSets().map(set => ({
 *         set,
 *         progress: getSetProgress(userOwnedIds, set.id),
 *       })),
 *     };
 *   }
 */
