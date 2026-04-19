/**
 * PATCH for: src/constants/cosmetics/cardDesigns.tsx
 *
 * ADD the `or_en_fusion` entry to CARD_DESIGN_REGISTRY.
 */
import { OrEnFusionCard } from './solarSet';

export const CARD_DESIGN_REGISTRY_PATCH_or_en_fusion = {
  or_en_fusion: {
    id: 'or_en_fusion',
    name: 'Or en Fusion',
    description: 'Cartouche doré aux bordures fluides et reflets de forge.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',                      // ← NEW
    /**
     * HOC-style renderer: receives username + title as children and wraps
     * them in the Or-en-Fusion shell (static gold border + partial shine
     * sweep across the card).
     *
     * IMPORTANT: the card wraps BOTH the username AND the title together.
     * The title itself has no container — it's just styled text.
     */
    render: ({ children, width }: { children: React.ReactNode; width?: number }) => (
      <OrEnFusionCard width={width}>{children}</OrEnFusionCard>
    ),
  },
};

/*
 * INTEGRATION NOTE:
 *  Contract: the card slot's children should include BOTH the username
 *  and the title (if a title is equipped), stacked vertically. Example:
 *    <CardDesignSlot>
 *      <span className="username">{username}</span>
 *      {equippedTitle && <TitleSlot id={equippedTitle} />}
 *    </CardDesignSlot>
 */
