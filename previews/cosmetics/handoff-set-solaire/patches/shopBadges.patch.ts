/**
 * PATCH for: src/constants/shopBadges.ts (or wherever badge registry lives)
 *
 * ADD 3 legendary hex badges from the Solar set.
 */
import {
  EruptionBadge,
  CouronneSolaireBadge,
  PhenixBadge,
} from './cosmetics/solarSet';

export const BADGE_REGISTRY_PATCH_solar = {
  heliarque_eruption: {
    id: 'heliarque_eruption',
    name: 'Éruption',
    description: 'Flamme de forge en éruption.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',
    render: (props: { size?: number }) => <EruptionBadge {...props} />,
  },
  heliarque_couronne_solaire: {
    id: 'heliarque_couronne_solaire',
    name: 'Couronne Solaire',
    description: 'Soleil couronné à douze rayons.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',
    render: (props: { size?: number }) => <CouronneSolaireBadge {...props} />,
  },
  heliarque_phenix: {
    id: 'heliarque_phenix',
    name: 'Phénix',
    description: 'Phénix de braise, ailes déployées.',
    tier: 'legendary' as const,
    setId: 'solaire_v1',
    render: (props: { size?: number }) => <PhenixBadge {...props} />,
  },
};
