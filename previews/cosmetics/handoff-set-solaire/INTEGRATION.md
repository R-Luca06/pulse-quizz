# Intégration — ordre d'implémentation

Suivre cet ordre pour que le set soit testable progressivement à chaque étape.

## Étape 1 — Tokens (5 min)

Merge `patches/tailwind.config.patch.js` dans `tailwind.config.js` :
- Ajoute la palette `colors.solar` (scale 50→900 + `ember` + `deep`).
- Ajoute les 6 keyframes (`ember-rise`, `sun-rays`, `heat-shimmer`, `solar-shine`, `phoenix-float`, `horizon-pulse`).
- Ajoute les animations courtes dans `theme.extend.animation` (alias pratiques).

## Étape 2 — Composants (drop-in)

Copier tel quel :
```
handoff-set-solaire/src/constants/cosmetics/solarSet.tsx
 → src/constants/cosmetics/solarSet.tsx
```

Ce fichier exporte :
- `EruptionBadge`, `CouronneSolaireBadge`, `PhenixBadge` — 3 badges hexagonaux
- `HeliarqueEmblem` — blason
- `OrEnFusionCard` — card design (HOC wrapping children)
- `HorizonIncandescentBg` — background full-screen
- `BraisesAscendantesAnim` — screen animation overlay
- `HELIARQUE_TITLE_STYLE` — styles de titre (pour le slot titre qui rend une string)

## Étape 3 — Registry (entries)

Appliquer chaque patch :

| Patch | Fichier cible | Ce qu'il fait |
|---|---|---|
| `emblems.patch.tsx`        | `src/constants/cosmetics/emblems.tsx`       | Ajoute entry `heliarque` → pointe sur `<HeliarqueEmblem />` |
| `titles.patch.ts`          | `src/constants/cosmetics/titles.ts`         | Ajoute entry `heliarque` → label `"Héliarque"` + `style: HELIARQUE_TITLE_STYLE` |
| `cardDesigns.patch.tsx`    | `src/constants/cosmetics/cardDesigns.tsx`   | Ajoute entry `or_en_fusion` → render `<OrEnFusionCard>` |
| `backgrounds.patch.tsx`    | `src/constants/cosmetics/backgrounds.tsx`   | Ajoute entry `horizon_incandescent` |
| `screenAnimations.patch.tsx` | `src/constants/cosmetics/screenAnimations.tsx` | Ajoute entry `braises_ascendantes` |
| `shopBadges.patch.ts`      | `src/constants/shopBadges.ts` (ou équivalent badge registry) | Ajoute les 3 entries de badges hex |

**Tous les patches ajoutent un champ `setId: 'solaire_v1'`** aux nouvelles entries pour les rattacher au set.

## Étape 4 — Système de sets (nouveau)

Copier tel quel :
```
handoff-set-solaire/src/constants/cosmetics/sets.ts
 → src/constants/cosmetics/sets.ts
```

Puis appliquer `patches/registry.patch.ts` sur `src/constants/cosmetics/registry.ts` :
- Ajoute les imports `SET_REGISTRY`, `CosmeticSet`.
- Expose 3 nouveaux helpers : `listSets()`, `getSet(setId)`, `getSetProgress(userOwnedIds, setId)`.

## Étape 5 — UI (à faire par Claude Code)

Deux vues à implémenter côté front :

### 5.1 — Onglet "Collections" dans l'inventaire
- Nouveau tab à côté de l'actuel inventaire.
- Liste les sets via `listSets()`.
- Pour chaque set : carte avec `progression`, aperçu des pièces, bouton **Tout équiper**.
- **"Tout équiper"** : itère sur `set.pieces` et appelle `equipCosmetic(slot, pieceId)` pour chaque slot (`emblem`, `title`, `card_design`, `background`, `screen_animation`). Les badges ne s'équipent pas automatiquement (l'utilisateur choisit ses 3 badges affichés).

### 5.2 — Vitrine bundle en boutique
- Dans la page boutique, afficher les sets en haut (section "Bundles").
- Prix groupé (config dans `SET_REGISTRY.solaire_v1.shopBundle`).
- Achat du bundle → crédite les 6 `cosmetic_id` sur le compte utilisateur en une seule transaction.

## Étape 6 — Migration DB (boutique)

Si la table `shop_items` contient déjà les cosmétiques à la pièce, ajouter une ligne pour le bundle :

```sql
INSERT INTO shop_items (id, type, name, price_pulses, contents_json, tier, set_id)
VALUES (
  'bundle_solaire_v1',
  'bundle',
  'Set Solaire — Héliarque',
  6000,
  '[
    "emblem:heliarque",
    "title:heliarque",
    "card_design:or_en_fusion",
    "background:horizon_incandescent",
    "screen_animation:braises_ascendantes",
    "badge:heliarque_eruption",
    "badge:heliarque_couronne_solaire",
    "badge:heliarque_phenix"
  ]',
  'legendary',
  'solaire_v1'
);
```

Les 6 items individuels restent en vente, le bundle offre -20%.

## Points de vigilance

1. **Titre "Héliarque" + Card "Or en Fusion"** : le titre utilise un gradient `text-fill`. Si la card design applique déjà un gradient de fond, tester que la lisibilité reste bonne (contraste AA mini). Si insuffisant, fallback : `color: '#fef3c7'` plein.

2. **`HorizonIncandescentBg` + `BraisesAscendantesAnim`** : les deux utilisent des particules animées. **NE PAS** empiler plus de ~35 particules au total (perf mobile). Le registry les sépare donc en deux cosmétiques distincts — le joueur peut équiper l'un ou l'autre, ou les deux si le total reste raisonnable.

3. **Prefers-reduced-motion** : toutes les animations doivent être désactivables via le hook `usePrefersReducedMotion()` existant. Pour les particules, stopper l'animation ou réduire à 3-4 embers statiques.

4. **Tailwind JIT** : les classes `animate-ember-rise`, `bg-solar-500` etc. doivent apparaître quelque part en source (pas uniquement en string dynamique) sinon le purge les vire. Le fichier `solarSet.tsx` les référence explicitement → OK.

5. **`setId` optionnel** : le champ n'est pas typé comme requis dans les entries. Les cosmétiques existants passent sans modification.
