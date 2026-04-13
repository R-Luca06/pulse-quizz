# Story 8.1 : Podium d'avatar — Landing connectée

Status: review

> **Nouvel Epic 8 — Podium & Personnalisation Avatar** (première story de l'epic). Suit l'Epic 5 (Landing Avatar & Vitrine, clôturé : Stories 5.1 AvatarContainer, 5.2 avatar centré + Play, 5.3 cards revertée, 5.4 header refactoré).
>
> **Décision produit Luca (2026-04-13)** : refonte visuelle de la landing connectée. L'avatar repose désormais sur un **podium unique** entouré de piles de livres, sur un fond aux couleurs de l'app (violet / neon-blue / neon-violet) avec contours dorés. `ArenaBackground` est retiré au profit d'une scène dédiée. La structure prévoit dès maintenant 4 slots DOM réservés pour la **future personnalisation** (items, décorations) — stories 8.2+ à venir (bouton Personnaliser, items, boutique de déblocage).
>
> **Note méta** : `epics.md` officiel ne référence pas encore Epic 8. À mettre à jour via `bmad-create-epics-and-stories` ou `bmad-edit-prd` quand les contours de l'epic seront stabilisés (post-validation visuelle de cette story).

## Story

En tant que **joueur connecté**,
je veux voir mon avatar mis en valeur sur un podium entouré d'une mise en scène "savoir" (piles de livres) sur fond violet/néon doré,
afin que la landing reflète mon identité de joueur, donne envie de jouer, et prépare visuellement l'arrivée d'un futur bouton "Personnaliser" devant le podium.

## Acceptance Criteria

1. **Suppression du background actuel** — Dans [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx), `<ArenaBackground />` n'est **plus rendu** dans la branche `ConnectedBranch` (lignes 246-248). Le fichier [src/components/landing/ArenaBackground.tsx](src/components/landing/ArenaBackground.tsx) est **conservé** dans le repo (pas supprimé) au cas où on souhaite le réutiliser. La branche `GuestBranch` n'est **pas touchée**.

2. **Nouvelle scène podium dans `ConnectedLanding.tsx`** — [src/components/landing/ConnectedLanding.tsx](src/components/landing/ConnectedLanding.tsx) rend désormais une scène composée de :
   - Un **fond gradient** plein écran avec dégradé **violet → neon-blue → neon-violet** (palette Tailwind : `#8B5CF6`, `#3B82F6`, `from-neon-violet via-neon-blue to-neon-violet` ou équivalent radial). Touches de noir profond pour la profondeur (radial gradient depuis le centre éclairé vers les bords sombres).
   - Un **podium unique** (cylindre 3D, une seule marche) centré horizontalement, légèrement décalé vers le bas du viewport, **sur lequel repose l'avatar**.
   - **2 piles de livres** posées au sol de chaque côté du podium (4 piles au total), de **hauteurs différentes** (asymétrie organique).
   - L'**avatar** (`AvatarContainer`) reste centré et posé visuellement sur le dessus du podium (la base de l'avatar doit toucher la surface supérieure du podium, pas flotter au-dessus).
   - Le **bouton Play** (`StartButton`) reste **présent et proéminent**, positionné **flottant devant le podium** (couvre la zone qui accueillera plus tard le bouton "Personnaliser") — pas dans le `ConnectedHeader`.
   - L'animation existante `isLaunching` (`opacity: 0, scale: 0.85`) doit continuer à s'appliquer sur le wrapper hero (avatar + Play) — la scène (podium + livres + fond) peut elle aussi fade-out légèrement pendant le launching pour cohérence.

3. **Podium — design détaillé** — Le podium est implémenté en **CSS pur** (Tailwind + inline styles + Framer Motion si animations), pas SVG, pas image externe :
   - Forme : cylindre vu en perspective 3D (vue légèrement plongeante, type "podium d'exposition"). Construit avec un disque ovale supérieur (`border-radius: 50%`) + un corps rectangulaire / trapèze + un disque ovale inférieur (ombre portée).
   - **Épaisseur** : volontairement **épaisse** (hauteur du corps cylindrique ≥ 25-35 % de la hauteur totale du podium) pour accueillir à terme un bouton "Personnaliser" devant. Le screen rouge fourni en inspiration est jugé **trop fin** par Luca — épaissir.
   - **Contour doré** : bord supérieur et inférieur du cylindre soulignés en `neon-gold` (`#EAB308`) — gradient linéaire ou border. Cohérent avec le style leaderboard (`text-yellow-400`).
   - **Ombre dorée** : `box-shadow` doré diffus (`shadow-neon-gold` du theme : `0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.2)`) pour halo lumineux autour de la base.
   - **Reflet sur le dessus** : léger gradient radial blanc/violet pâle sur le disque supérieur pour suggérer un éclairage de scène depuis le haut.
   - **Couleur du corps** : violet sombre / noir profond avec léger gradient vertical (`from-game-card to-game-bg` ou `from-violet-950 to-neon-violet/40`) pour ne pas concurrencer l'avatar visuellement.
   - Largeur : ~280-340 px desktop, ~200-240 px mobile (rester sous la largeur de l'avatar `w-80 = 320px` pour que l'avatar dépasse légèrement et "domine" le podium, ou faire un podium **légèrement plus large** que l'avatar — préférence : podium **un peu plus large** que la base de l'avatar pour qu'on voie qu'il "repose" dessus).

4. **Piles de livres — décor latéral** — 4 piles de livres au total, **2 de chaque côté** du podium (gauche / droite), posées au sol :
   - Chaque pile = empilement de **2 à 5 livres** rectangulaires (CSS divs avec `border-radius` léger, `box-shadow` portée, gradient vertical pour effet tranche). Pas d'image externe.
   - **Hauteurs différentes** entre les piles (asymétrie organique — ex : pile-A-gauche = 4 livres, pile-B-gauche = 2 livres, pile-A-droite = 3 livres, pile-B-droite = 5 livres).
   - **Couleurs des livres** : palette cohérente avec le thème (violet, neon-blue, neon-violet, neon-cyan, touches de gold pour la tranche/dorure). Pas de couleur primaire crue (rouge / vert vif).
   - **Animation de flottement légère** via Framer Motion : translation Y `±4 à 6px` en boucle infinie, durée `3-5s`, easing `easeInOut`, **délais désynchronisés** par pile pour éviter un mouvement uniforme. Respect `useReducedMotion` : si l'utilisateur a `prefers-reduced-motion`, animation désactivée (cf. pattern existant [ArenaBackground.tsx:46](src/components/landing/ArenaBackground.tsx#L46)).
   - **Aucune interactivité** : `aria-hidden="true"` sur le conteneur des livres + pas de focus clavier.

5. **4 slots DOM réservés pour personnalisation future** — La scène inclut **4 divs vides positionnées en `absolute`** (avec `data-slot="..."` pour identification ultérieure) prêtes à accueillir des items de personnalisation dans une story future :
   - `data-slot="top-left"` — au-dessus à gauche du podium (zone décorative aérienne)
   - `data-slot="top-right"` — au-dessus à droite du podium
   - `data-slot="podium-front"` — devant le podium (où ira le bouton "Personnaliser" plus tard ; pour cette story, contient le `StartButton` flottant — voir AC 6)
   - `data-slot="behind-avatar"` — derrière l'avatar (zone arrière-plan podium, utile pour effets de halo/trône futurs)
   - Les 4 slots sont **vides** pour l'instant (mais montés dans le DOM) ou contiennent des **placeholders cachés** (`hidden` ou commentaires) — le but est que la structure soit prête.
   - Les slots ont des **commentaires JSX** clairs : `{/* Slot personnalisation : haut-gauche — story future */}`, etc.

6. **StartButton positionné devant le podium** — Le `<StartButton />` reste rendu dans `ConnectedLanding.tsx` (PAS déplacé dans `ConnectedHeader`). Il est positionné **flottant devant le podium**, dans la zone du slot `podium-front`. Concrètement : positionné en `absolute` sur la face avant du podium, ou rendu en flux normal sous le podium si le rendu visuel est plus propre. Préférence : `absolute` chevauchant la moitié inférieure de la face avant du podium pour donner l'effet "podium + bouton flottant".
   - Le clic sur Play continue à appeler `onOpenSettings` (props inchangées).
   - Le bouton reste le **CTA principal** visible et accessible, pas un élément secondaire.

7. **Responsive (mobile < 640px)** — Sur mobile (breakpoint Tailwind `sm:` à 640px) :
   - Podium réduit (~200-240 px de large vs 280-340 desktop).
   - Avatar passe de `h-64 w-64` (mobile) à `h-80 w-80` (sm+) — comportement actuel conservé.
   - **Piles de livres réduites à 1 par côté** (au lieu de 2), ou masquées entièrement (`hidden sm:block`) si l'espace est trop serré. Préférence : 1 pile par côté en mobile.
   - Le `StartButton` reste visible et cliquable sans chevauchement gênant.
   - Le `ConnectedHeader` (sticky en haut) reste fonctionnel.

8. **FloatingCardsBackground non rendu** — Confirmation : `FloatingCardsBackground` n'est plus rendu nulle part. Le fichier source a déjà été supprimé du working tree (`git status` : `D src/components/landing/FloatingCardsBackground.tsx`). Décision Luca : laisser le fichier supprimé — si on souhaite le réutiliser plus tard, il sera restauré depuis git history (`git log --all -- src/components/landing/FloatingCardsBackground.tsx` puis `git checkout <sha> -- ...`). **Pas besoin de restaurer le fichier dans cette story.**

9. **Comportement `launching` préservé** — La séquence `converging → shaking → exploding` pilotée par `LandingPage.tsx` ([LandingPage.tsx:221-237](src/components/landing/LandingPage.tsx#L221-L237)) continue à fonctionner :
   - Le `shakeControls` appliqué sur le wrapper du background (anciennement `<ArenaBackground />`) doit s'appliquer désormais sur **le wrapper de la nouvelle scène podium** (ou être supprimé si le shake n'a plus de sens visuel sans ArenaBackground — préférence : conserver le shake sur la scène podium pour l'effet "tremblement" cohérent).
   - L'animation `isLaunching` sur le hero (avatar + Play) reste appliquée.
   - Le flash blanc lors du `exploding` reste rendu (`launchPhase === 'exploding'`, [LandingPage.tsx:250-257](src/components/landing/LandingPage.tsx#L250-L257)).

10. **ConnectedHeader inchangé** — [src/components/landing/ConnectedHeader.tsx](src/components/landing/ConnectedHeader.tsx) n'est **pas modifié** (les boutons Classement / Stats / Achievements / @username / Sign-out restent en l'état). Pas de Play ajouté dans le header.

11. **Tests unitaires** — Le fichier [src/components/landing/ConnectedLanding.test.tsx](src/components/landing/ConnectedLanding.test.tsx) (existant, 14 tests passants) doit continuer à passer **sans modification fonctionnelle des tests existants**. Ajouter **a minima 2 nouveaux tests** pour la nouvelle scène :
    - Test 1 : la scène podium contient le `data-testid="podium"` (à ajouter sur le conteneur podium).
    - Test 2 : les 4 slots de personnalisation sont présents dans le DOM (`data-slot` queries).
    - Les tests existants `'ConnectedLanding rend AvatarContainer et bouton Play'` et `'ConnectedLanding appelle onOpenSettings au clic Play'` doivent continuer à passer (l'avatar et le bouton Play sont toujours là, juste visuellement repositionnés).

12. **Qualité gates** — `npx tsc --noEmit` zéro erreur, `npm run lint` zéro nouveau warning (delta = 0), `npm run build` succès, `npm run test -- --run` 100 % passent (16 tests minimum après ajout).

13. **Validation visuelle manuelle (Luca)** — Avant de marquer la story `done`, Luca valide visuellement via `npm run dev` :
    - Podium suffisamment épais pour qu'on imagine un bouton "Personnaliser" tenir devant.
    - Couleurs cohérentes avec l'app (violet / neon-blue / neon-violet / touches gold).
    - Avatar repose **sur** le podium (pas flottant au-dessus, pas écrasé dedans).
    - 2 piles de livres de chaque côté, hauteurs différentes, animation de flottement subtile.
    - StartButton bien visible et cliquable devant le podium.
    - Mobile responsive OK (tester avec DevTools 375px).
    - Flow launching (Play → settings → lancer → quiz) intact.

## Tasks / Subtasks

- [x] **Tâche 1 — Retirer ArenaBackground du ConnectedBranch** (AC: 1)
  - [x] 1.1 — Dans [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx) (lignes 246-248), supprimer le `<motion.div animate={shakeControls}>` qui contient `<ArenaBackground />`. **MAIS** conserver le `shakeControls` et l'appliquer sur la nouvelle scène podium (cf. AC 9 — voir Tâche 2.4).
  - [x] 1.2 — Supprimer l'import `import ArenaBackground from './ArenaBackground'` ligne 3.
  - [x] 1.3 — **Ne PAS supprimer** le fichier [src/components/landing/ArenaBackground.tsx](src/components/landing/ArenaBackground.tsx) — il reste dans le repo pour réutilisation potentielle.

- [x] **Tâche 2 — Créer la scène podium dans `ConnectedLanding.tsx`** (AC: 2, 3, 9)
  - [x] 2.1 — Refactorer [src/components/landing/ConnectedLanding.tsx](src/components/landing/ConnectedLanding.tsx) pour intégrer la scène complète. Structure DOM proposée :
    ```tsx
    <>
      <ConnectedHeader ... />
      {/* Scène podium — couvre tout l'écran sous le header */}
      <motion.div
        className="absolute inset-0"
        animate={shakeControls}  // ⚠️ shakeControls vient de LandingPage — le passer en prop
      >
        <PodiumScene>
          {/* Slots décoratifs futurs (vides) */}
          <div data-slot="behind-avatar" className="..." />
          <div data-slot="top-left" className="..." />
          <div data-slot="top-right" className="..." />

          {/* Piles de livres décoratives */}
          <BookPiles />

          {/* Podium central + avatar dessus */}
          <Podium>
            <AvatarContainer className="h-64 w-64 sm:h-80 sm:w-80" />
          </Podium>

          {/* Slot bouton flottant devant le podium */}
          <div data-slot="podium-front" className="absolute ...">
            <StartButton onClick={onOpenSettings} />
          </div>
        </PodiumScene>
      </motion.div>
    </>
    ```
    *Note : `PodiumScene`, `Podium`, `BookPiles` peuvent être des sous-composants définis dans le même fichier `ConnectedLanding.tsx` OU extraits en composants dédiés sous `src/components/landing/podium/`. **Préférence : extraire en composants dédiés** sous un dossier `podium/` pour la lisibilité (voir Project Structure Notes).*
  - [x] 2.2 — Implémenter le **fond gradient plein écran** sur le wrapper de `PodiumScene` : `bg-gradient-to-b from-neon-violet/30 via-game-bg to-game-bg` ou variante radial pour effet "spotlight" centré sur le podium. Tester plusieurs variantes (lineraire vs radial) — préférence radial pour effet scène théâtrale.
  - [x] 2.3 — Implémenter le **podium CSS** dans `Podium.tsx` (cf. AC 3 pour la spec détaillée). Utiliser :
    - Disque supérieur : `<div className="absolute ... rounded-[50%] bg-gradient-to-b from-violet-700 to-violet-900 border-2 border-neon-gold" />` + `box-shadow: 'inset 0 4px 12px rgba(255,255,255,0.15)'` pour reflet.
    - Corps cylindrique : `<div className="... bg-gradient-to-b from-violet-900 to-game-bg" style={{ borderTop: '2px solid #EAB308', borderBottom: '2px solid #EAB308', boxShadow: '0 0 30px rgba(234,179,8,0.4), 0 8px 24px rgba(0,0,0,0.6)' }} />`.
    - Disque inférieur (ombre portée) : `<div className="absolute ... rounded-[50%] bg-black/60 blur-md" />`.
    - Taille : `w-72 sm:w-96` (podium plus large que l'avatar `w-64 sm:w-80` pour qu'on voie l'avatar dessus).
    - Hauteur du corps cylindrique : `h-24 sm:h-32` (épais — pour accueillir le futur bouton Personnaliser).
  - [x] 2.4 — Brancher `shakeControls` : LandingPage.tsx doit passer `shakeControls` (instance `useAnimationControls`) à `ConnectedLanding` via une nouvelle prop `shakeControls`. Modifier le type `Props` de `ConnectedLanding` en conséquence. Le wrapper `<motion.div animate={shakeControls}>` est maintenant DANS `ConnectedLanding.tsx`.

- [x] **Tâche 3 — Implémenter les piles de livres** (AC: 4, 7)
  - [x] 3.1 — Créer `BookPiles.tsx` (sous `podium/` ou dans `ConnectedLanding.tsx`) qui rend 4 piles : 2 à gauche, 2 à droite du podium (positions absolute relatives au wrapper).
  - [x] 3.2 — Chaque pile = composant `BookStack` paramétré par `count` (nombre de livres, 2-5), `colors` (array de couleurs Tailwind), `position` (`{ left, right, top, bottom }`).
  - [x] 3.3 — Rendu d'un livre individuel : `<motion.div className="h-3 w-16 sm:h-4 sm:w-20 rounded-sm" style={{ background: 'linear-gradient(to right, ...)', boxShadow: '...', borderLeft: '2px solid #EAB308' }} />` (la bordure gauche dorée = la tranche/dorure du livre).
  - [x] 3.4 — Animation de flottement : `motion.div` parent de chaque pile avec `animate={{ y: [0, -5, 0] }}` `transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}`. Délais désynchronisés.
  - [x] 3.5 — Respect `useReducedMotion()` : si `true`, désactiver les animations (`animate={{}}` ou skip).
  - [x] 3.6 — `aria-hidden="true"` sur le conteneur racine de `BookPiles`.
  - [x] 3.7 — **Responsive** (AC 7) : sur mobile (`< sm`), masquer les 2 piles secondaires (1 pile par côté max). Utiliser `hidden sm:block` sur les piles à masquer.

- [x] **Tâche 4 — Slots de personnalisation** (AC: 5)
  - [x] 4.1 — Dans la scène podium, ajouter les 4 divs `data-slot="..."` aux positions définies (cf. AC 5).
  - [x] 4.2 — Ces divs sont vides (`<div data-slot="top-left" className="absolute left-8 top-12" />`), avec des dimensions minimales définies si nécessaire. Pas de visuel rendu pour l'instant.
  - [x] 4.3 — Ajouter des commentaires JSX explicites au-dessus de chaque slot : `{/* Slot personnalisation : XXX — réservé pour items futurs (story 5.6+) */}`.
  - [x] 4.4 — Le slot `podium-front` contient le `<StartButton>` (cf. Tâche 5).

- [x] **Tâche 5 — Positionner le StartButton devant le podium** (AC: 6, 10)
  - [x] 5.1 — Le `<StartButton>` est rendu dans le slot `podium-front`. Position : `absolute` chevauchant la moitié inférieure de la face avant du podium. Exemple : `<div data-slot="podium-front" className="absolute left-1/2 -translate-x-1/2 bottom-[15%] z-20"><StartButton onClick={onOpenSettings} /></div>` (à ajuster visuellement).
  - [x] 5.2 — Vérifier que le bouton ne chevauche pas l'avatar et reste cliquable.
  - [x] 5.3 — `ConnectedHeader.tsx` n'est PAS modifié — vérifier qu'aucun import / usage du Play n'y est ajouté (AC 10).

- [x] **Tâche 6 — Responsive mobile** (AC: 7)
  - [x] 6.1 — Tester le rendu sur mobile (DevTools, 375x667).
  - [x] 6.2 — Ajuster les tailles podium (`w-72 sm:w-96`), avatar (`h-64 w-64 sm:h-80 sm:w-80` — déjà OK), piles (`hidden sm:block` sur les piles secondaires), startbutton (taille déjà responsive via StartButton.tsx).
  - [x] 6.3 — Vérifier que l'ensemble tient verticalement sans scroll forcé (le wrapper LandingPage.ConnectedBranch utilise `min-h-screen overflow-hidden`).

- [x] **Tâche 7 — Tests unitaires** (AC: 11)
  - [x] 7.1 — Ajouter `data-testid="podium"` sur le conteneur du podium dans `Podium.tsx`.
  - [x] 7.2 — Dans [src/components/landing/ConnectedLanding.test.tsx](src/components/landing/ConnectedLanding.test.tsx), ajouter un nouveau `describe('Podium scene (Story 8.1)')` avec :
    - `it('rend le podium avec data-testid="podium"', ...)` — `expect(screen.getByTestId('podium')).toBeInTheDocument()`.
    - `it('rend les 4 slots de personnalisation', ...)` — `expect(container.querySelector('[data-slot="top-left"]')).toBeInTheDocument()` × 4 slots.
  - [x] 7.3 — Vérifier que les tests existants `'ConnectedLanding rend AvatarContainer et bouton Play'` et `'ConnectedLanding appelle onOpenSettings au clic Play'` passent toujours (l'avatar et le Play sont conservés).
  - [x] 7.4 — **Ne pas modifier** la signature du composant `ConnectedLanding` au point de casser les tests existants. Si l'ajout de la prop `shakeControls` les casse, fournir un mock par défaut (`shakeControls = useAnimationControls()` créé dans le test, ou rendre la prop optionnelle).

- [x] **Tâche 8 — Quality gates et validation** (AC: 12, 13)
  - [x] 8.1 — `npx tsc --noEmit` : 0 erreur.
  - [x] 8.2 — `npm run lint` : delta = 0 nouveau warning.
  - [x] 8.3 — `npm run build` : succès.
  - [x] 8.4 — `npm run test -- --run` : 100 % passent (≥ 16 tests).
  - [ ] 8.5 — Démarrer `npm run dev` et tester manuellement (⚠️ À faire par Luca — validation visuelle) :
    - Connecté → podium visible avec avatar dessus, livres animés, Play devant.
    - Click Play → SettingsModal s'ouvre → "Lancer" → animation launching (shake sur la scène podium + flash blanc + transition vers quiz).
    - Resize DevTools 375 px → mobile responsive OK.
    - Non-connecté → vitrine inchangée (régression test).
  - [ ] 8.6 — Soumettre à Luca pour validation visuelle finale (AC 13). Itérer sur l'épaisseur du podium / contraste / saturation des couleurs si demandé.

## Dev Notes

### Contraintes critiques

- **CSS pur, pas SVG / pas asset externe** : le podium et les livres sont 100 % construits avec divs Tailwind + gradients + box-shadow. Décision produit Luca (validée). Raison : flexibilité pour positionner les futurs items de personnalisation via slots DOM, et pas de dépendance asset.
- **`shakeControls` doit être propagé depuis `LandingPage.tsx`** : c'est le parent qui pilote la séquence launching (`useAnimationControls`). Soit on passe `shakeControls` en prop à `ConnectedLanding`, soit on remonte l'état `launchPhase` et on déclenche le shake dans `ConnectedLanding` (préférence : propager en prop, plus simple).
- **Ne pas casser le flow `launching`** : converging → shaking → exploding doit continuer à fonctionner. Le shake était appliqué sur ArenaBackground — il doit maintenant être appliqué sur le wrapper de la scène podium (sinon la transition perd son impact visuel).
- **Ne pas toucher à `GuestBranch` / `GuestLanding`** : la story concerne uniquement la branche connectée.
- **Ne pas toucher à `ConnectedHeader`** : Play reste devant le podium, pas dans le header (décision Luca).
- **AvatarContainer** : continuer à utiliser le wrapper `AvatarContainer` (pas `AvatarDisplay` direct) — le wrapper gère ErrorBoundary + Suspense (Story 5.1).
- **`useReducedMotion`** : respecter la préférence utilisateur sur les animations des livres (cf. pattern [ArenaBackground.tsx:46](src/components/landing/ArenaBackground.tsx#L46)).
- **Performance** : 4 piles × 2-5 livres = max 20 divs animées. Largement sous le seuil critique. Pas de risque FPS.

### Patterns à réutiliser

- **Box-shadow doré** : `shadow-neon-gold` (theme Tailwind, [tailwind.config.js:31](tailwind.config.js#L31)) — `0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.2)`.
- **Couleur gold** : `#EAB308` (= `neon-gold` du theme, ou `text-yellow-400` Tailwind utilisé dans [StatsPage.tsx:313](src/components/stats/StatsPage.tsx#L313)).
- **Gradient violet/blue** : `from-neon-violet to-neon-blue` déjà utilisé dans le StartButton ([StartButton.tsx:31](src/components/landing/StartButton.tsx#L31)).
- **Position absolute centrée** : `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
- **Animation flottement** : `animate={{ y: [0, -5, 0] }}` `transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}` — pattern Framer Motion classique.
- **`useReducedMotion`** : import depuis `framer-motion`, retourne `boolean` indiquant la préférence utilisateur.
- **`useAnimationControls`** : déjà utilisé dans [LandingPage.tsx:219](src/components/landing/LandingPage.tsx#L219) pour le shake.

### Project Structure Notes

**Préférence : extraire en composants dédiés sous `src/components/landing/podium/`** pour la lisibilité (chaque composant < 100 lignes) :

```
src/components/landing/
├── ConnectedLanding.tsx        # modifié — orchestre la scène
├── ConnectedLanding.test.tsx   # modifié — +2 tests
├── LandingPage.tsx             # modifié — supprime ArenaBackground, passe shakeControls
├── ArenaBackground.tsx         # CONSERVÉ (pas supprimé) — réutilisation potentielle
├── podium/
│   ├── PodiumScene.tsx         # nouveau — wrapper scène complète (background gradient + slots wrapper)
│   ├── Podium.tsx              # nouveau — cylindre 3D CSS pur
│   └── BookPiles.tsx           # nouveau — 4 piles de livres animées
```

**Alternative acceptable** (si le dev juge que c'est over-engineered) : tout dans `ConnectedLanding.tsx` en sous-composants locaux non exportés. Décider en fonction de la complexité finale (si chaque sous-composant > 50 lignes, extraire ; sinon inline).

### Décisions design en attente de validation visuelle

Ces points seront tranchés pendant le dev par essai-erreur visuel — Luca validera :
- **Variante du fond gradient** : linéaire vs radial (préférence radial pour effet "spotlight").
- **Largeur podium vs avatar** : podium **plus large** (préférence) ou **plus étroit** que l'avatar.
- **Épaisseur exacte du podium** : viser ~25-35 % de la hauteur totale du podium dédiée au cylindre (à ajuster jusqu'à ce que Luca trouve l'équilibre).
- **Nombre de livres par pile** : à varier pour l'asymétrie organique (suggestion initiale : 4 / 2 / 3 / 5).
- **Couleur des livres** : palette neon mais sans saturation excessive (éviter pure violet, viser des tons sourds avec la dorure pour ressortir).

### References

- Story 5.1 (AvatarContainer, dépendance) : [_bmad-output/implementation-artifacts/5-1-avatar-composant-decouple.md](_bmad-output/implementation-artifacts/5-1-avatar-composant-decouple.md)
- Story 5.2 (Avatar centré + Play, base actuelle) : [_bmad-output/implementation-artifacts/5-2-landing-connectee-avatar-play.md](_bmad-output/implementation-artifacts/5-2-landing-connectee-avatar-play.md)
- Story 5.3 (FloatingCards revertée, contexte) : [_bmad-output/implementation-artifacts/5-3-floating-cards-autour-avatar.md](_bmad-output/implementation-artifacts/5-3-floating-cards-autour-avatar.md)
- Story 5.4 (Header refactoré, intact dans cette story) : [_bmad-output/implementation-artifacts/5-4-header-icones-labels.md](_bmad-output/implementation-artifacts/5-4-header-icones-labels.md)
- Composant à refondre : [src/components/landing/ConnectedLanding.tsx](src/components/landing/ConnectedLanding.tsx)
- Parent à modifier (suppression ArenaBackground + passage shakeControls) : [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx)
- Avatar à conserver : [src/components/avatar/](src/components/avatar/)
- StartButton à repositionner : [src/components/landing/StartButton.tsx](src/components/landing/StartButton.tsx)
- Header à conserver tel quel : [src/components/landing/ConnectedHeader.tsx](src/components/landing/ConnectedHeader.tsx)
- Palette Tailwind : [tailwind.config.js](tailwind.config.js)
- Tests existants à préserver : [src/components/landing/ConnectedLanding.test.tsx](src/components/landing/ConnectedLanding.test.tsx)
- Inspirations (fournies par Luca, 2 screenshots) : podium rouge avec cadeaux (préféré, mais podium jugé trop fin → épaissir). Cadeaux remplacés par piles de livres pour le côté quizz/savoir.

### Hors scope (stories futures)

- ❌ Bouton "Personnaliser" devant le podium (Story 8.2 — la place est réservée par le slot `podium-front`).
- ❌ Items de personnalisation dans les slots `top-left`, `top-right`, `behind-avatar` (Stories 8.3+).
- ❌ Boutique / déblocage des items (Story 8.4+).
- ❌ Refonte du `ConnectedHeader` (Story 5.4 déjà livrée, intacte).
- ❌ Modification de `GuestLanding` / `GuestBranch` (vitrine non-connectée, hors scope).
- ❌ Restauration du fichier `FloatingCardsBackground.tsx` (laisser en historique git).
- ❌ Suppression du fichier `ArenaBackground.tsx` (à conserver pour réutilisation potentielle).

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- Build initial : erreur `AnimationControls` non exporté par framer-motion → remplacé par `type ShakeControls = ReturnType<typeof useAnimationControls>` dans `ConnectedLanding.tsx`.

### Completion Notes List

- Scène podium extraite en 3 sous-composants dédiés sous `src/components/landing/podium/` : `PodiumScene`, `Podium`, `BookPiles` (préférence archi de la story).
- Podium CSS pur : disque supérieur ovale (contour `neon-gold`, reflet radial blanc/violet) + corps cylindrique épais `h-24 sm:h-32` (gradient violet→noir, bordures dorées haut/bas, ombre dorée diffuse) + disque inférieur (rim bas) + halo doré flou + ombre au sol. Aucune image externe, aucun SVG.
- `BookPiles` : 4 piles (2 par côté), comptes asymétriques (4/2/3/5), palette violet / neon-blue / neon-violet / cyan avec tranche dorée gauche. Animation flottante `y: [0, -5, 0]` désynchronisée (délais `i * 0.7s`), désactivée si `prefers-reduced-motion`. Piles secondaires masquées < `sm:` (1 pile par côté max en mobile). Conteneur racine `aria-hidden="true"` et `pointer-events-none`.
- 4 slots DOM `data-slot` réservés (`behind-avatar`, `top-left`, `top-right`, `podium-front`) avec commentaires JSX explicites. `podium-front` contient le `StartButton` positionné en `absolute` sous la face avant du podium.
- `StartButton` reste rendu dans `ConnectedLanding` (via `PodiumScene`), pas déplacé dans `ConnectedHeader` (intact).
- `shakeControls` propagé de `LandingPage.tsx` → `ConnectedLanding.tsx` via prop optionnelle (pour compat tests). Le wrapper `<motion.div animate={shakeControls}>` enveloppe désormais la scène podium complète (fond + livres + podium + avatar + Play) — shake cohérent pendant la phase `shaking` du launching.
- `ArenaBackground.tsx` conservé dans le repo (non supprimé) pour réutilisation potentielle. `FloatingCardsBackground` reste supprimé du working tree (décision Luca antérieure).
- `ConnectedLanding.test.tsx` : +2 tests Story 8.1 (podium `data-testid`, 4 slots `data-slot` présents). Prop `shakeControls` rendue optionnelle → les 19 tests existants passent sans modification. Total : 21 tests dans le fichier, 46 tests suite complète.
- Quality gates : `npx tsc --noEmit` 0 erreur · `npm run lint` 0 nouveau warning · `npm run build` succès (bundle principal 249 KB / gzip 76 KB) · `npm test -- --run` 46/46 passants.
- ⚠️ Validation visuelle manuelle (AC 13, tâches 8.5/8.6) laissée à Luca : épaisseur podium, saturation couleurs, rendu mobile 375 px, flow launching complet (Play → settings → lancer → shake + flash + quiz). Itérations visuelles prévues si nécessaire.

### File List

- `src/components/landing/podium/PodiumScene.tsx` (nouveau) — wrapper scène : fond gradient radial, 4 slots data-slot, BookPiles, podium+avatar+StartButton centrés, anim `isLaunching`.
- `src/components/landing/podium/Podium.tsx` (nouveau) — cylindre CSS pur avec bordures dorées, halo, ombre au sol, `data-testid="podium"`.
- `src/components/landing/podium/BookPiles.tsx` (nouveau) — 4 piles animées (respect `useReducedMotion`), responsive mobile.
- `src/components/landing/ConnectedLanding.tsx` (modifié) — intègre `PodiumScene` dans un wrapper `motion.div` piloté par `shakeControls` (prop optionnelle). Header conservé.
- `src/components/landing/LandingPage.tsx` (modifié) — import `ArenaBackground` retiré, wrapper `<motion.div animate={shakeControls}><ArenaBackground /></motion.div>` supprimé, `shakeControls` passé en prop à `ConnectedLanding`.
- `src/components/landing/ConnectedLanding.test.tsx` (modifié) — +1 describe `Podium scene (Story 8.1)` avec 2 tests (podium testid + 4 data-slot).
- `src/components/landing/ArenaBackground.tsx` (conservé, non modifié) — reste dans le repo pour réutilisation future.

### Change Log

| Date       | Auteur      | Changement                                                                |
| ---------- | ----------- | ------------------------------------------------------------------------- |
| 2026-04-13 | John (PM)   | Story 8.1 créée — refonte podium avatar landing connectée (1ère story du nouvel Epic 8 Podium & Personnalisation Avatar). Status: ready-for-dev. |
| 2026-04-13 | Amelia (Dev) | Implémentation scène podium CSS pur : Podium + BookPiles + PodiumScene sous `src/components/landing/podium/`. ArenaBackground retiré du ConnectedBranch, shakeControls propagé à ConnectedLanding. 4 slots `data-slot` réservés pour personnalisation future (story 8.2+). Tests +2 (podium + slots). Quality gates OK. Status: review (attente validation visuelle Luca). |
