# Set Solaire « Héliarque » — Vol. 01

Handoff pour Claude Code. Ce dossier contient :
- **7 fichiers à drop / merger** dans le codebase `pulse-quizz`.
- Un système de **sets** (option B de l'audit) non-destructif pour regrouper les cosmétiques.
- **6 pièces** en tier `legendary` : 3 badges, 1 blason, 1 titre, 1 card design, 1 background, 1 screen animation.

## Structure livrée

```
handoff-set-solaire/
├── README.md                           ← ce fichier
├── INTEGRATION.md                      ← ordre d'implémentation + migration boutique
├── src/constants/cosmetics/
│   ├── sets.ts                         ← NOUVEAU · SET_REGISTRY + helpers
│   └── solarSet.tsx                    ← NOUVEAU · tous les composants React
├── patches/
│   ├── emblems.patch.tsx               ← ajouter entry `heliarque`
│   ├── titles.patch.ts                 ← ajouter entry `heliarque`
│   ├── cardDesigns.patch.tsx           ← ajouter entry `or_en_fusion`
│   ├── backgrounds.patch.tsx           ← ajouter entry `horizon_incandescent`
│   ├── screenAnimations.patch.tsx      ← ajouter entry `braises_ascendantes`
│   ├── shopBadges.patch.ts             ← ajouter 3 badges hex
│   ├── registry.patch.ts               ← exposer listSets / getSet / getSetProgress
│   └── tailwind.config.patch.js        ← ajouter keyframes solaires
```

## Principes de design respectés

- **Non destructif** : `setId` est un champ *optionnel* sur les entries existantes. Aucune entry actuelle n'est modifiée.
- **Convention tokens** : toutes les valeurs chromatiques passent par la palette `solar-*` (à ajouter dans `tailwind.config.js` → `theme.extend.colors.solar`).
- **Conventions motion** : réutilise les keyframes existants (`stroke-flow`, `solar-pulse`) quand possible. Nouveaux keyframes ajoutés : `ember-rise`, `sun-rays`, `heat-shimmer`, `solar-shine`, `phoenix-float`, `horizon-pulse`.
- **Tier** : toutes les pièces sont `legendary` (set cohérent).
- **Slots utilisés** : `emblem` · `title` · `card_design` · `background` · `screen_animation` · `badge` (×3).

## Payoff joueur

Une fois le set implémenté, l'onglet **Collections** dans l'inventaire affiche le Set Solaire comme un tout :
- Progression `X/6`.
- Bouton **Tout équiper** (applique les 5 slots en un clic).
- Bonus gameplay optionnel : `+10% XP` quand le set est complet et équipé (à activer plus tard via `getSetProgress`).

En boutique, le set se vend en bundle à `-20%` (prix unitaires cumulés `◈ 7 500` → bundle `◈ 6 000`).

## Preview visuelle

Voir `Set Solaire Previews.html` à la racine du projet de design pour le rendu visuel complet (pièces, contexte, collection card, bundle boutique).
