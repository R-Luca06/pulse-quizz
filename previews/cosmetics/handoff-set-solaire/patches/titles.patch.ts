/**
 * PATCH for: src/constants/cosmetics/titles.ts
 *
 * ADD the `heliarque` entry to TITLE_REGISTRY.
 *
 * ─────────────────────────────────────────────────────────────
 * 1. Add this import:
 */
import { HELIARQUE_TITLE_STYLE } from './solarSet';

/*
 * 2. Add this entry inside TITLE_REGISTRY:
 */
export const TITLE_REGISTRY_PATCH_heliarque = {
  heliarque: {
    id: 'heliarque',
    name: 'Héliarque',
    label: 'Héliarque',
    tier: 'legendary' as const,
    setId: 'solaire_v1',                      // ← NEW optional field
    /**
     * Inline style applied to the title text at render time.
     * The gradient uses `background-clip: text`.
     * Fallback color handled by the title slot.
     */
    style: HELIARQUE_TITLE_STYLE,
  },
};

/*
 * NOTE:
 *  - If TITLE_REGISTRY entries don't already support a `style` field,
 *    add `style?: React.CSSProperties` to the Title type.
 *  - The slot renderer should spread `entry.style` onto the `<span>`
 *    wrapping the label. Existing string-only titles keep working.
 */
