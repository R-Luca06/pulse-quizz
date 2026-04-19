/**
 * PATCH for: src/constants/cosmetics/screenAnimations.tsx
 */
import { BraisesAscendantesAnim } from './solarSet';

export const SCREEN_ANIMATION_REGISTRY_PATCH_braises_ascendantes = {
  braises_ascendantes: {
    id: 'braises_ascendantes',
    name: 'Braises Ascendantes',
    description:
      'Overlay persistent de braises dorées qui s’élèvent depuis le bas de l’écran.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',
    /**
     * Renders an absolutely-positioned, pointer-events:none overlay.
     * Should be mounted once at the app shell level above the page content.
     */
    render: () => <BraisesAscendantesAnim />,
  },
};

/*
 * LAYERING:
 *   z-index recommendation: between background (z:0) and UI (z:10).
 *   Use z:5 so modals and tooltips remain above.
 */
