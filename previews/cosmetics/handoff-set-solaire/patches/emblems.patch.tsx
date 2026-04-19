/**
 * PATCH for: src/constants/cosmetics/emblems.tsx
 *
 * ADD the `heliarque` entry to the EMBLEM_REGISTRY (or equivalent export).
 * Keep the existing entries untouched.
 *
 * ─────────────────────────────────────────────────────────────
 *  1. Add this import at the top of the file:
 */
import { HeliarqueEmblem } from './solarSet';

/*
 * ─────────────────────────────────────────────────────────────
 *  2. Inside EMBLEM_REGISTRY, add the entry below:
 */

export const EMBLEM_REGISTRY_PATCH_heliarque = {
  heliarque: {
    id: 'heliarque',
    name: 'Héliarque',
    description: 'Blason solaire couronné. Volume 01 du set Héliarque.',
    tier: 'legendary',
    setId: 'solaire_v1',                      // ← NEW optional field
    render: (props: { size?: number }) => <HeliarqueEmblem {...props} />,
  },
};

/*
 * ─────────────────────────────────────────────────────────────
 * NOTE for Claude Code:
 *  - Merge the `heliarque` key into the existing `EMBLEM_REGISTRY` object.
 *  - The `setId` field is NEW — if the Emblem type doesn’t include it,
 *    add `setId?: string` to the type (see registry.patch.ts).
 *  - Do not remove or rename any existing emblem entry.
 */
