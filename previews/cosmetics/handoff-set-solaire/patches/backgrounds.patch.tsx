/**
 * PATCH for: src/constants/cosmetics/backgrounds.tsx
 */
import { HorizonIncandescentBg } from './solarSet';

export const BACKGROUND_REGISTRY_PATCH_horizon_incandescent = {
  horizon_incandescent: {
    id: 'horizon_incandescent',
    name: 'Horizon Incandescent',
    description: 'Aube solaire, brumes de chaleur, braises en lente ascension.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',
    /**
     * Full-screen background. Renders absolutely-positioned content,
     * the slot is expected to provide a `position: relative` wrapper.
     */
    render: () => <HorizonIncandescentBg />,
  },
};

/*
 * PERF NOTE:
 *   18 animated particles. Fine on desktop. On mobile, gate through
 *   usePrefersReducedMotion() and/or a `navigator.deviceMemory < 4` check
 *   → drop particle count to 6 and disable the shimmer layer.
 */
