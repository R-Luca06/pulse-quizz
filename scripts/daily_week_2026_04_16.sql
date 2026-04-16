-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Défis journaliers : semaine du 16 au 23 avril 2026
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- 8 thèmes + 80 questions (10 par jour : 2 easy · 4 medium · 4 hard)
--
-- Coller dans Supabase Dashboard → SQL Editor → New query → Run
--
-- Fonctionnement : get_daily_questions(p_date) filtre automatiquement les
-- questions par q.category = ANY(daily_themes.category_tags).
-- Les catégories "daily_*" n'apparaissent pas dans le quiz normal
-- (les settings UI exposent uniquement les 7 catégories standard).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. Thèmes ────────────────────────────────────────────────────────────────

INSERT INTO daily_themes (date, title, emoji, description, category_tags) VALUES
  ('2026-04-16', 'Le nerf de la guerre',           '⚔️',  'Des conflits qui ont façonné l''Histoire',                    ARRAY['daily_conflits']),
  ('2026-04-17', 'Toujours plus loin',              '🏆',  'Des records qui défient les limites du possible',              ARRAY['daily_records']),
  ('2026-04-18', 'Vers l''infini et l''au-delà !',  '🚀',  'Cap sur les étoiles et les mystères de l''univers',            ARRAY['daily_espace']),
  ('2026-04-19', 'Le 7e art',                       '🎬',  'Lumières, caméra, action — le cinéma dans tous ses états',     ARRAY['daily_cinema']),
  ('2026-04-20', 'Les dieux et les héros',          '🏛️', 'Plongez dans les mythes et les civilisations antiques',        ARRAY['daily_mythes']),
  ('2026-04-21', 'Électrons libres',                '⚡',  'Des découvertes qui ont changé le monde',                     ARRAY['daily_sciences']),
  ('2026-04-22', 'La plume et le papier',           '📚',  'Des mots et des œuvres qui traversent les siècles',            ARRAY['daily_litterature']),
  ('2026-04-23', 'Le monde en chiffres',            '🌍',  'Continents, capitales et curiosités géographiques',            ARRAY['daily_geographie'])
ON CONFLICT (date) DO UPDATE
  SET title         = EXCLUDED.title,
      emoji         = EXCLUDED.emoji,
      description   = EXCLUDED.description,
      category_tags = EXCLUDED.category_tags;


-- ─── 2. Questions ─────────────────────────────────────────────────────────────
-- Colonnes : language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source

-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 16 — "Le nerf de la guerre" ⚔️
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_conflits', 'easy',
 'Quel pays a déclaré la guerre à la Serbie le 28 juillet 1914, déclenchant la Première Guerre mondiale ?',
 'L''Autriche-Hongrie',
 ARRAY['L''Allemagne', 'La Russie', 'La France'],
 'Bien que l''Allemagne soit souvent perçue comme le principal responsable, c''est l''Autriche-Hongrie qui déclara la guerre en premier, un mois après l''assassinat de l''archiduc François-Ferdinand à Sarajevo. L''Allemagne n''entra en guerre que le 1er août.',
 'curated'),

('fr', 'daily_conflits', 'easy',
 'Quel était le surnom de la bombe atomique larguée sur Hiroshima le 6 août 1945 ?',
 'Little Boy',
 ARRAY['Fat Man', 'Big Mike', 'Iron Fist'],
 '"Little Boy" était une bombe à uranium enrichi d''une puissance de 15 kilotonnes. "Fat Man", larguée sur Nagasaki trois jours plus tard, utilisait du plutonium. Ces deux bombes causèrent entre 130 000 et 226 000 morts selon les estimations.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_conflits', 'medium',
 'Lors de quelle bataille Napoléon Bonaparte subit-il sa défaite définitive le 18 juin 1815 ?',
 'La bataille de Waterloo',
 ARRAY['La bataille de Leipzig', 'La bataille d''Austerlitz', 'La bataille de Borodino'],
 'La bataille de Waterloo ne dura qu''une seule journée. L''expression "avoir son Waterloo" est entrée dans le langage courant pour désigner une défaite décisive. Napoléon y perdit environ 25 000 hommes. Il fut ensuite exilé sur l''île de Sainte-Hélène, où il mourut en 1821.',
 'curated'),

('fr', 'daily_conflits', 'medium',
 'Quel traité mit officiellement fin à la Première Guerre mondiale, signé le 28 juin 1919 dans la galerie des Glaces ?',
 'Le traité de Versailles',
 ARRAY['Le traité de Paris', 'Le traité de Brest-Litovsk', 'Le traité de Saint-Germain'],
 'Signé exactement 5 ans après l''assassinat de François-Ferdinand. L''Allemagne le surnomma le "Diktat" car ses conditions lui furent imposées sans négociation. Elle dut céder 13 % de son territoire, 10 % de sa population et payer d''énormes réparations.',
 'curated'),

('fr', 'daily_conflits', 'medium',
 'Quel est le nom de code de l''invasion nazie de l''Union soviétique, lancée le 22 juin 1941 ?',
 'Opération Barbarossa',
 ARRAY['Opération Sea Lion', 'Opération Citadelle', 'Opération Mercure'],
 'Baptisée d''après Frédéric Barberousse, empereur médiéval du Saint-Empire. Cette opération impliqua 3,8 millions de soldats de l''Axe — la plus grande invasion terrestre de l''histoire. Hitler espérait une victoire en quelques semaines ; la campagne dura 4 ans.',
 'curated'),

('fr', 'daily_conflits', 'medium',
 'Combien de soldats français furent mobilisés durant la Première Guerre mondiale ?',
 'Environ 8 millions',
 ARRAY['Environ 2 millions', 'Environ 4 millions', 'Environ 12 millions'],
 'Sur les 8 millions de Français mobilisés, environ 1 393 000 furent tués (17 % des soldats engagés). Ce bilan dévastateur alimenta le pacifisme des années 1930 et la politique de "non-guerre" face aux ambitions d''Hitler.',
 'curated'),

-- [HARD]
('fr', 'daily_conflits', 'hard',
 'Quel amiral japonais planifica l''attaque sur Pearl Harbor le 7 décembre 1941 ?',
 'Isoroku Yamamoto',
 ARRAY['Hideki Tojo', 'Tomoyuki Yamashita', 'Osami Nagano'],
 'Yamamoto avait étudié aux États-Unis (Harvard) et connaissait leur puissance industrielle. On lui attribue : "Je crains que nous ayons réveillé un géant endormi." Ironie de l''histoire, il mourut en 1943 dans une embuscade aérienne organisée par les Américains, qui avaient déchiffré son code radio.',
 'curated'),

('fr', 'daily_conflits', 'hard',
 'Quel maréchal allemand capitula avec sa 6e armée encerclée à Stalingrad en février 1943 ?',
 'Friedrich Paulus',
 ARRAY['Erwin Rommel', 'Gerd von Rundstedt', 'Erich von Manstein'],
 'Hitler venait de nommer Paulus maréchal la veille de sa reddition — aucun maréchal allemand ne s''était jamais rendu. Encerclée depuis novembre 1942, la 6e armée perdit 300 000 hommes. Paulus devint ensuite un critique virulent du nazisme depuis sa captivité soviétique.',
 'curated'),

('fr', 'daily_conflits', 'hard',
 'En quelle année fut signé le traité de Westphalie, mettant fin à la guerre de Trente Ans et fondant le système des États-nations modernes ?',
 '1648',
 ARRAY['1618', '1689', '1715'],
 'Les traités de Westphalie instaurèrent le principe de souveraineté nationale et de non-ingérence dans les affaires intérieures — fondement du droit international moderne. La guerre de Trente Ans (1618-1648) avait ravagé l''Europe centrale et tué environ 8 millions de personnes.',
 'curated'),

('fr', 'daily_conflits', 'hard',
 'Quelle bataille de 302 jours en 1916 est associée à la devise "Ils ne passeront pas !" ?',
 'La bataille de Verdun',
 ARRAY['La bataille de la Somme', 'La bataille de la Marne', 'La bataille des Flandres'],
 'La bataille de Verdun (21 février - 18 décembre 1916) est la plus longue de la Première Guerre mondiale. On estime entre 300 000 et 400 000 morts des deux côtés. La devise est associée au général Pétain. Verdun reste le symbole le plus puissant de la résistance française et de l''horreur des tranchées.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 17 — "Toujours plus loin" 🏆
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_records', 'easy',
 'Qui détient le record du monde du 100 mètres masculin avec 9"58, établi à Berlin en 2009 ?',
 'Usain Bolt',
 ARRAY['Marcell Jacobs', 'Asafa Powell', 'Justin Gatlin'],
 'À son pic de vitesse (vers 60-80 m), Bolt atteignait environ 44,7 km/h. Sa foulée exceptionnellement longue (2,44 m en moyenne) compensait un départ moins explosif que ses rivaux. Il détient également les records du 200 m (19"19) et du relais 4 × 100 m.',
 'curated'),

('fr', 'daily_records', 'easy',
 'Quel pays a remporté le plus de Coupes du monde de football masculin ?',
 'Le Brésil (5 titres : 1958, 1962, 1970, 1994, 2002)',
 ARRAY['L''Allemagne (4 titres)', 'L''Italie (4 titres)', 'La France (2 titres)'],
 'Le Brésil est le seul pays à avoir participé à toutes les phases finales de la Coupe du Monde depuis 1930. Ses 5 titres lui valurent la garde définitive du trophée Jules Rimet en 1970. L''Allemagne et l''Italie en comptent 4 chacune.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_records', 'medium',
 'Quelle vitesse record atteignit le véhicule terrestre habité ThrustSSC dans le désert du Nevada en 1997 ?',
 '1 228 km/h (Mach 1,016) piloté par Andy Green',
 ARRAY['850 km/h', '1 100 km/h', '1 450 km/h'],
 'Le ThrustSSC brisa le mur du son le 15 octobre 1997, propulsé par deux réacteurs de chasse Rolls-Royce Spey. Il reste le seul véhicule terrestre à avoir officiellement dépassé la vitesse du son. Andy Green est également pilote de chasse dans la Royal Air Force.',
 'curated'),

('fr', 'daily_records', 'medium',
 'Quel est le plus grand organisme vivant connu sur Terre ?',
 'Un champignon armillaire géant en Oregon (USA) s''étendant sur ~9,6 km²',
 ARRAY['Une baleine bleue', 'Un séquoia géant en Californie', 'La grande barrière de corail'],
 'L''Armillaria ostoyae de la forêt nationale de Malheur en Oregon s''étend sur 9,6 km², pèse ~600 tonnes et pourrait avoir entre 2 000 et 8 650 ans. Seul son réseau souterrain (mycélium) révèle son immensité ; en surface, il ressemble à des milliers de champignons ordinaires.',
 'curated'),

('fr', 'daily_records', 'medium',
 'À quelle altitude Felix Baumgartner effectua-t-il son saut record lors de la mission Red Bull Stratos en 2012 ?',
 'Environ 39 000 mètres (38 969 m officiellement)',
 ARRAY['25 000 mètres', '50 000 mètres', '32 000 mètres'],
 'Le 14 octobre 2012, Baumgartner atteignit ~39 km à bord d''une capsule suspendue à un ballon-hélium. Lors de sa chute libre de 4 min 20 s, il dépassa Mach 1,25 (~1 357 km/h) — premier humain à briser le mur du son en chute libre sans véhicule.',
 'curated'),

('fr', 'daily_records', 'medium',
 'Quelle est la plus longue migration animale annuelle documentée ?',
 'La sterne arctique (~90 000 km par an entre l''Arctique et l''Antarctique)',
 ARRAY['La baleine à bosse', 'Le papillon monarque', 'Le saumon sockeye'],
 'La sterne arctique parcourt jusqu''à 90 000 km par an, profitant de deux étés consécutifs. Sur une vie de 30 ans, elle peut voyager l''équivalent de 3 fois la distance Terre-Lune. Des balises GPS ont confirmé ce record en 2010 lors d''une expédition britannique.',
 'curated'),

-- [HARD]
('fr', 'daily_records', 'hard',
 'Quel cosmonaute détient le record de durée d''un séjour continu dans l''espace avec 437 jours à bord de la station Mir ?',
 'Valeri Polyakov (janvier 1994 – mars 1995)',
 ARRAY['Scott Kelly', 'Gennady Padalka', 'Anatoly Solovyev'],
 'Polyakov, médecin de formation, séjourna sur Mir pour étudier les effets d''un long vol spatial avant un hypothétique voyage vers Mars. À son retour, il marcha seul hors de la capsule pour prouver sa condition physique. Son record tient encore trente ans après.',
 'curated'),

('fr', 'daily_records', 'hard',
 'Quel plongeur détient le record de plongée en apnée "No Limit" avec 214 mètres en 2007 ?',
 'Herbert Nitsch',
 ARRAY['William Trubridge', 'Umberto Pelizzari', 'Alexey Molchanov'],
 'Nitsch, surnommé "le plus grand homme des profondeurs", descendit à 214 m avec un luge lesté. Lors d''une tentative à 253 m en 2012, il souffrit d''une décompression grave affectant son cerveau. Après deux ans de rééducation, il récupéra partiellement ses capacités.',
 'curated'),

('fr', 'daily_records', 'hard',
 'Quelle idée reçue persistante affirme, à tort, qu''une structure humaine est visible à l''œil nu depuis la Station spatiale internationale ?',
 'La Grande Muraille de Chine — en réalité trop étroite (6-9 m) pour être vue à 400 km d''altitude',
 ARRAY['Le barrage des Trois-Gorges', 'Les pyramides de Gizeh', 'L''aéroport de Dubai'],
 'L''astronaute chinois Yang Liwei confirma en 2003 ne pas avoir vu la Grande Muraille. Depuis l''ISS, les villes illuminées la nuit sont en revanche visibles. La confusion vient probablement d''un manuel scolaire américain de 1932 qui avança l''affirmation sans la vérifier.',
 'curated'),

('fr', 'daily_records', 'hard',
 'Quelle est la durée de la plus longue partie d''échecs professionnelle de l''histoire (Nikolic vs Arsovic, Belgrade, 1989) ?',
 '269 coups — soit environ 20 heures et 15 minutes, partie nulle',
 ARRAY['120 coups, 8 heures', '400 coups, 32 heures', '180 coups, 12 heures'],
 'Ivan Nikolic et Goran Arsovic s''affrontèrent pendant plus de 20 heures. La partie se termina par une nulle. Ce record mena à un renforcement de la règle des 50 coups sans prise ni mouvement de pion, visant à éviter les parties interminables.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 18 — "Vers l'infini et l'au-delà !" 🚀
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_espace', 'easy',
 'Quelle est la planète la plus grande du système solaire ?',
 'Jupiter',
 ARRAY['Saturne', 'Uranus', 'Neptune'],
 'Jupiter fait plus de 11 fois le diamètre terrestre. Sa Grande Tache Rouge — une tempête géante — existe depuis au moins 350 ans et est plus grande que la Terre. Jupiter possède au moins 95 lunes connues, dont Europe qui pourrait abriter de l''eau liquide sous sa croûte glacée.',
 'curated'),

('fr', 'daily_espace', 'easy',
 'En quelle année le premier être humain a-t-il marché sur la Lune ?',
 '1969 (Neil Armstrong, mission Apollo 11, 21 juillet)',
 ARRAY['1967', '1971', '1965'],
 'Neil Armstrong posa le pied sur la Lune le 21 juillet 1969 à 02h56 UTC. Sa phrase "That''s one small step for man, one giant leap for mankind" fut légèrement tronquée par rapport au texte prévu. Au total, 12 astronautes ont marché sur la Lune entre 1969 et 1972.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_espace', 'medium',
 'Combien de temps met en moyenne un signal radio pour atteindre Mars depuis la Terre ?',
 'Environ 12 minutes (de 3 à 22 min selon la position orbitale)',
 ARRAY['Environ 3 secondes', 'Environ 1 heure', 'Environ 5 minutes'],
 'Ce délai rend toute communication en temps réel impossible avec Mars. Lors de l''atterrissage du rover Perseverance en 2021, les ingénieurs de la NASA durent attendre 11 minutes pour confirmer le succès — la manœuvre d''atterrissage était entièrement autonome.',
 'curated'),

('fr', 'daily_espace', 'medium',
 'Quelle sonde spatiale lancée en 1977 est actuellement la plus éloignée de la Terre ?',
 'Voyager 1',
 ARRAY['Voyager 2', 'Pioneer 10', 'New Horizons'],
 'Voyager 1 a quitté l''héliosphère en 2012 pour entrer dans l''espace interstellaire. En 2024, elle se trouve à plus de 23 milliards de km de la Terre. Le signal radio met environ 22 heures pour nous parvenir. Elle est propulsée par des générateurs à radio-isotopes — aucun panneau solaire.',
 'curated'),

('fr', 'daily_espace', 'medium',
 'Quel objet céleste est le plus brillant dans le ciel nocturne, après la Lune ?',
 'Vénus',
 ARRAY['Mars', 'Jupiter', 'Sirius'],
 'Vénus peut atteindre une magnitude de -4,9, la rendant parfois visible en plein jour. Les Anciens croyaient avoir affaire à deux astres différents : "l''étoile du matin" et "l''étoile du soir". C''est la planète la plus chaude (465 °C en moyenne), plus que Mercure malgré son plus grand éloignement.',
 'curated'),

('fr', 'daily_espace', 'medium',
 'Combien de temps dure environ une "année galactique" — le temps pour le Soleil de faire le tour de la Voie Lactée ?',
 'Environ 225 millions d''années terrestres',
 ARRAY['Environ 10 millions d''années', 'Environ 1 milliard d''années', 'Environ 50 millions d''années'],
 'Notre système solaire a effectué environ 20 "années galactiques" depuis sa formation. La dernière fois que la Terre se trouvait à cette position dans la galaxie, les dinosaures dominaient la planète. Le Soleil se déplace à environ 220 km/s autour du centre galactique.',
 'curated'),

-- [HARD]
('fr', 'daily_espace', 'hard',
 'Quel événement cosmique permit de confirmer expérimentalement les ondes gravitationnelles en 2015, validant Einstein après 100 ans ?',
 'La fusion de deux trous noirs détectée par l''interféromètre LIGO',
 ARRAY['La collision de deux étoiles à neutrons', 'Une explosion de supernova proche', 'Un pulsar milliseconde'],
 'Le 14 septembre 2015, LIGO détecta des ondes gravitationnelles provenant de deux trous noirs fusionnant à 1,3 milliard d''années-lumière. Cette découverte confirma une prédiction d''Einstein de 1916 et valut le Prix Nobel de physique 2017 à Weiss, Barish et Thorne.',
 'curated'),

('fr', 'daily_espace', 'hard',
 'Qu''est-ce que la "singularité" au cœur d''un trou noir selon la relativité générale ?',
 'Un point de densité et de courbure infinies où les lois physiques connues s''effondrent',
 ARRAY['L''horizon des événements du trou noir', 'Le centre de rotation du trou noir', 'La zone de gravité maximale visible'],
 'Les équations d''Einstein prédisent une singularité mais la physique quantique suggère que notre compréhension est incomplète. Une théorie quantique de la gravité (encore inexistante) serait nécessaire pour décrire ce qui s''y passe. C''est l''une des grandes frontières non résolues de la physique.',
 'curated'),

('fr', 'daily_espace', 'hard',
 'Combien de temps met la lumière du Soleil pour atteindre la Terre ?',
 'Environ 8 minutes et 20 secondes',
 ARRAY['Environ 1 seconde', 'Environ 3 minutes', 'Environ 30 minutes'],
 'La lumière parcourt 149,6 millions de km (1 Unité Astronomique). Si le Soleil disparaissait, nous ne le saurions qu''après 8 min 20 s. Nous voyons donc toujours le Soleil tel qu''il était dans le passé. Pour Proxima Centauri, l''étoile la plus proche, le délai est de 4,24 ans.',
 'curated'),

('fr', 'daily_espace', 'hard',
 'Comment s''appelle l''écho thermique du Big Bang détecté accidentellement en 1964, preuve observationnelle de l''origine de l''univers ?',
 'Le rayonnement fossile (Cosmic Microwave Background, CMB)',
 ARRAY['Le rayonnement de Hawking', 'L''énergie sombre', 'Les ondes gravitationnelles primordiales'],
 'Penzias et Wilson, ingénieurs chez Bell Labs, captèrent un "bruit" radio inexplicable avec leur antenne. Ce rayonnement à -270 °C est l''écho du Big Bang vieux de 13,8 milliards d''années. Ils reçurent le Prix Nobel de physique 1978 pour cette découverte entièrement accidentelle.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 19 — "Le 7e art" 🎬
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_cinema', 'easy',
 'Quel film de James Cameron sorti en 1997 devint à l''époque le plus grand succès commercial de l''histoire du cinéma ?',
 'Titanic',
 ARRAY['Avatar', 'Jurassic Park', 'Star Wars'],
 'Titanic fut le premier film à dépasser le milliard de dollars au box-office mondial. Il resta numéro un pendant 12 ans, jusqu''à Avatar (également de Cameron, 2009). Cameron avait vendu ce projet à la Fox comme un moyen de "visiter l''épave" — la direction douta fortement du retour sur investissement.',
 'curated'),

('fr', 'daily_cinema', 'easy',
 'Dans quelle ville française se tient chaque année le festival de cinéma remettant la Palme d''Or ?',
 'Cannes',
 ARRAY['Venise', 'Paris', 'Nice'],
 'Le Festival de Cannes est fondé en 1946. La Palme d''Or actuelle, conçue par Chopard, est en or blanc 18 carats ornée de diamants. Elle fut remise sous cette forme pour la première fois en 1955. Venise (Lion d''Or) et Berlin (Ours d''Or) sont les autres grands festivals européens.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_cinema', 'medium',
 'Qui a réalisé "2001 : L''Odyssée de l''espace" (1968), souvent cité parmi les plus grands films de l''histoire ?',
 'Stanley Kubrick',
 ARRAY['Steven Spielberg', 'Ridley Scott', 'François Truffaut'],
 'Kubrick développa ce projet avec l''auteur de SF Arthur C. Clarke avant les premiers pas sur la Lune. La NASA l''étudia pour sa représentation technique des voyages spatiaux. HAL 9000 reste l''une des IA les plus iconiques du cinéma. Le film fut tourné quasi-intégralement en studio à Borehamwood, en Angleterre.',
 'curated'),

('fr', 'daily_cinema', 'medium',
 'Quel acteur français est le premier à avoir remporté l''Oscar du meilleur acteur, en 2012 ?',
 'Jean Dujardin (pour The Artist)',
 ARRAY['Vincent Cassel', 'Omar Sy', 'Mathieu Amalric'],
 '"The Artist" de Michel Hazanavicius, film muet en noir et blanc, remporta 5 Oscars dont Meilleur film. Jean Dujardin reçut la statuette des mains de Natalie Portman. Aucun acteur français n''avait jamais remporté cette récompense avant lui.',
 'curated'),

('fr', 'daily_cinema', 'medium',
 'Quel personnage fictif détient le record du plus grand nombre d''adaptations cinématographiques selon le Livre Guinness des Records ?',
 'Sherlock Holmes (plus de 250 adaptations filmiques)',
 ARRAY['James Bond', 'Dracula', 'Zorro'],
 'Sherlock Holmes a été incarné par plus de 70 acteurs différents depuis sa création en 1887 par Arthur Conan Doyle. Parmi les plus célèbres : Basil Rathbone, Peter Cushing, Jeremy Brett, Robert Downey Jr. et Benedict Cumberbatch.',
 'curated'),

('fr', 'daily_cinema', 'medium',
 'Dans quel film est prononcée la réplique "Frankly, my dear, I don''t give a damn" classée n°1 des plus grandes répliques du cinéma américain ?',
 'Autant en emporte le vent (1939)',
 ARRAY['Casablanca', 'Le Parrain', 'Citizen Kane'],
 'Cette réplique de Clark Gable à Vivien Leigh causa une controverse car "damn" violait le Code Hays (censure hollywoodienne). Le producteur David O. Selznick paya une amende pour la conserver. L''AFI la classa 1re des 100 meilleures répliques du cinéma américain en 2005.',
 'curated'),

-- [HARD]
('fr', 'daily_cinema', 'hard',
 'Quel cinéaste japonais, réalisateur des "Sept Samouraïs" (1954), est considéré comme le père du jidaigeki moderne ?',
 'Akira Kurosawa',
 ARRAY['Yasujiro Ozu', 'Kenji Mizoguchi', 'Nagisa Oshima'],
 '"Les Sept Samouraïs" inspira directement "Les Sept Mercenaires" (1960). Sergio Leone s''inspira de "Yojimbo" (1961) pour "Pour une poignée de dollars". George Lucas reconnut l''influence de Kurosawa sur Star Wars. Il est considéré comme l''un des cinéastes les plus influents de toute l''histoire du cinéma.',
 'curated'),

('fr', 'daily_cinema', 'hard',
 'Quel documentaire de Werner Herzog retrace la vie de Timothy Treadwell, militant écologiste tué par un grizzly en Alaska en 2003 ?',
 'Grizzly Man (2005)',
 ARRAY['Into the Wild', 'Bears (Disneynature)', 'The Edge'],
 'Treadwell vécut 13 étés parmi les grizzlys d''Alaska. En octobre 2003, lui et sa compagne furent attaqués et tués par un ours. Herzog utilisa des séquences filmées par Treadwell lui-même — y compris l''audio (mais pas la vidéo) de l''attaque fatale. Le film interroge la frontière entre l''homme et la nature sauvage.',
 'curated'),

('fr', 'daily_cinema', 'hard',
 'Quel court-métrage surréaliste de 16 minutes, réalisé par Luis Buñuel et Salvador Dalí en 1929, s''ouvre sur un œil tranché par un rasoir ?',
 'Un chien andalou',
 ARRAY['L''Âge d''or', 'Metropolis', 'Le Cabinet du Dr Caligari'],
 'Buñuel et Dalí voulaient délibérément "choquer le bourgeois". Paradoxalement, le film fut un succès mondain à Paris. La scène de l''œil fut réalisée en coupant réellement l''œil d''un veau mort. Elle reste l''une des images les plus troublantes et les plus citées de l''histoire du cinéma.',
 'curated'),

('fr', 'daily_cinema', 'hard',
 'Quel film fut le premier à décrocher 11 Oscars lors de la même cérémonie, un record depuis égalé deux fois ?',
 'Ben-Hur (1959, remis lors de la 32e cérémonie en 1960)',
 ARRAY['Titanic (1997)', 'All About Eve (1950)', 'La La Land (2016)'],
 'Ben-Hur remporta 11 Oscars dont Meilleur film, Réalisateur (William Wyler) et Acteur (Charlton Heston). Titanic (1997) et Le Retour du roi (2003) égalèrent ce record. La La Land fut nominé pour 14 Oscars (record absolu) mais n''en remporta "que" 6.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 20 — "Les dieux et les héros" 🏛️
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_mythes', 'easy',
 'Quel héros de la mythologie grecque accomplit douze travaux imposés par le roi Eurysthée ?',
 'Héraclès (Hercule dans la mythologie romaine)',
 ARRAY['Thésée', 'Achille', 'Persée'],
 'Les Douze Travaux comprennent la capture du lion de Némée, le nettoyage des écuries d''Augias (en détournant deux rivières) et la capture de Cerbère, le chien à trois têtes. Son père était Zeus, ce qui lui valut la haine perpétuelle d''Héra, jalouse des infidélités de son époux.',
 'curated'),

('fr', 'daily_mythes', 'easy',
 'Quel pharaon est associé à la construction de la Grande Pyramide de Gizeh, unique merveille du monde antique encore debout ?',
 'Khéops (Khufu)',
 ARRAY['Ramsès II', 'Toutânkhamon', 'Amenhotep III'],
 'Construite vers 2560 av. J.-C., la Grande Pyramide resta le plus haut édifice humain pendant 3 800 ans (jusqu''à la cathédrale de Lincoln vers 1311). On estime qu''elle fut bâtie par environ 20 000 ouvriers libres — et non des esclaves comme le mythe populaire le prétend.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_mythes', 'medium',
 'Quelle civilisation précolombienne construisit Tenochtitlán sur le lac Texcoco, aujourd''hui Mexico City ?',
 'Les Aztèques (Mexicas)',
 ARRAY['Les Mayas', 'Les Incas', 'Les Olmèques'],
 'Tenochtitlán était construite sur une île artificielle reliée au continent par des chaussées. À l''arrivée d''Hernán Cortés en 1519, c''était l''une des plus grandes villes du monde avec 200 000 à 300 000 habitants — plus grande que toute ville européenne contemporaine.',
 'curated'),

('fr', 'daily_mythes', 'medium',
 'Quel philosophe grec fut condamné à mort en 399 av. J.-C. pour "impiété" et "corruption de la jeunesse", et but la ciguë ?',
 'Socrate',
 ARRAY['Platon', 'Aristote', 'Diogène'],
 'Socrate aurait pu s''exiler mais choisit d''accepter le verdict, estimant que s''y soustraire contreviendrait aux lois de sa cité. Il n''écrivit rien lui-même — nous le connaissons uniquement à travers les dialogues de Platon. Sa méthode (la maïeutique) reste fondatrice de la philosophie occidentale.',
 'curated'),

('fr', 'daily_mythes', 'medium',
 'Quel empire antique avait pour capitale Carthage et fut la grande rivale de Rome lors des guerres puniques ?',
 'L''empire carthaginois (fondé par des colons phéniciens)',
 ARRAY['L''empire perse', 'L''empire macédonien', 'L''empire ptolémaïque'],
 '"Carthago delenda est" (Carthage doit être détruite), répété par le sénateur Caton à la fin de chaque discours, résume la rivalité acharnée. Rome rasa Carthage en 146 av. J.-C. après la troisième guerre punique. Hannibal franchit les Alpes avec des éléphants lors de la deuxième.',
 'curated'),

('fr', 'daily_mythes', 'medium',
 'Quelle divinité romaine, roi des dieux et maître de la foudre, donne son nom à la plus grande planète du système solaire ?',
 'Jupiter (équivalent du Zeus grec)',
 ARRAY['Mars', 'Neptune', 'Saturne'],
 'Le Capitole (la colline capitoline) abritait son principal sanctuaire à Rome. Saturne est en réalité le père de Jupiter dans la mythologie — et c''est la planète aux anneaux, 2e plus grande du système solaire. Mars (dieu de la guerre) donne son nom à la planète rouge.',
 'curated'),

-- [HARD]
('fr', 'daily_mythes', 'hard',
 'Quelle cité-État grecque fut gouvernée par les lois de Dracon (vers 620 av. J.-C.), dont la sévérité donna naissance à l''adjectif "draconien" ?',
 'Athènes',
 ARRAY['Sparte', 'Corinthe', 'Thèbes'],
 'Dracon rédigea le premier code de lois écrites d''Athènes. La quasi-totalité des infractions — même le vol de légumes — était punissable de mort. Selon Démade, "Dracon n''écrit pas ses lois avec de l''encre, mais avec du sang." Solon remplaça ces lois par des réformes plus modérées en 594 av. J.-C.',
 'curated'),

('fr', 'daily_mythes', 'hard',
 'Quelle est la signification littérale de "per-aâ" en égyptien ancien, dont dérive le mot "pharaon" ?',
 '"La grande maison" — le palais royal, pas le souverain lui-même à l''origine',
 ARRAY['"Le fils du Soleil"', '"Le dieu incarné"', '"Le maître des deux terres"'],
 'Ce n''est qu''à partir du Nouvel Empire (vers 1400 av. J.-C.) que "per-aâ" commença à désigner le roi. Les Grecs transposèrent "per-aâ" en "Pharaon". "Maître des deux terres" (Nebet-tawy) et "Fils de Rê" étaient en fait des titres royaux distincts et indépendants.',
 'curated'),

('fr', 'daily_mythes', 'hard',
 'Quel don fatal le dieu Dionysos accorda-t-il au roi Midas dans la mythologie grecque ?',
 'Transformer en or tout ce qu''il touchait',
 ARRAY['L''immortalité', 'L''invisibilité', 'Comprendre le langage des animaux'],
 'Après que sa nourriture et sa fille se transformèrent en or, Midas implora Dionysos de le délivrer. Il dut se baigner dans le fleuve Pactole pour rompre le sortilège. On dit que c''est pourquoi les sables du Pactole (Turquie actuelle) renfermaient de l''or. L''expression "toucher de Midas" désigne la faculté de réussir tout ce qu''on entreprend.',
 'curated'),

('fr', 'daily_mythes', 'hard',
 'Quel être ailé naquit du sang de Méduse lorsque Persée lui trancha la tête, et devint la monture du héros Bellérophon ?',
 'Pégase, le cheval ailé',
 ARRAY['Arion', 'Le Sphinx', 'La Chimère'],
 'Pégase naquit du sang de Méduse mêlé à l''eau de mer (Poséidon étant son père). Bellérophon tenta de s''envoler jusqu''à l''Olympe — hubris qui lui valut d''être précipité à terre par Zeus. Pégase devint alors la monture de Zeus lui-même, portant le tonnerre et les éclairs.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 21 — "Électrons libres" ⚡
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_sciences', 'easy',
 'Qui a découvert la pénicilline en 1928 en observant une moisissure tuer des bactéries dans une boîte de Petri ?',
 'Alexander Fleming',
 ARRAY['Louis Pasteur', 'Marie Curie', 'Robert Koch'],
 'Fleming remarqua par hasard qu''une moisissure (Penicillium notatum) avait contaminé sa culture. Cette découverte "accidentelle" allait sauver des millions de vies. La pénicilline fut produite en masse durant la Seconde Guerre mondiale, réduisant considérablement la mortalité par infection.',
 'curated'),

('fr', 'daily_sciences', 'easy',
 'Quel est le symbole chimique de l''or dans le tableau périodique des éléments ?',
 'Au (du latin Aurum)',
 ARRAY['Or', 'Go', 'Gd'],
 '"Au" vient du latin "Aurum". L''or est l''un des rares éléments connus depuis l''Antiquité, d''où l''utilisation du nom latin (comme Fe = Ferrum pour le fer, Cu = Cuprum pour le cuivre). Sa résistance à la corrosion en fait le métal de référence pour les connexions électroniques de haute précision.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_sciences', 'medium',
 'Quelle scientifique est la seule personne à avoir reçu des Prix Nobel dans deux disciplines scientifiques différentes ?',
 'Marie Curie (Physique 1903, Chimie 1911)',
 ARRAY['Lise Meitner', 'Rosalind Franklin', 'Dorothy Hodgkin'],
 'Marie Curie reste à ce jour la seule dans ce cas. Ses carnets de laboratoire sont encore trop radioactifs pour être consultés sans protection. Ils sont conservés à la Bibliothèque nationale de France dans des boîtes en plomb. Sa fille Irène reçut également le Prix Nobel de chimie en 1935.',
 'curated'),

('fr', 'daily_sciences', 'medium',
 'Quelle expérience de 1887 démontra que la vitesse de la lumière est indépendante du mouvement de la source, préparant le terrain pour Einstein ?',
 'L''expérience de Michelson-Morley',
 ARRAY['L''expérience de la double fente de Young', 'L''expérience de Cavendish', 'L''expérience de Millikan'],
 'Michelson et Morley cherchaient à mesurer la vitesse de la Terre à travers l''"éther". Le résultat nul — aucune variation de vitesse détectée — fut qualifié de "la plus belle expérience ratée de l''histoire". Elle prépara directement la relativité restreinte d''Einstein publiée en 1905.',
 'curated'),

('fr', 'daily_sciences', 'medium',
 'Quel mathématicien grec du IIIe siècle av. J.-C. est à l''origine du principe énonçant que tout corps plongé dans un fluide reçoit une poussée verticale vers le haut ?',
 'Archimède',
 ARRAY['Pythagore', 'Euclide', 'Thalès'],
 'Selon la légende, Archimède découvrit son principe dans son bain et courut nu dans les rues de Syracuse en criant "Eurêka !" Il cherchait à vérifier la pureté de la couronne du roi Hiéron sans la fondre. Il inventa aussi des catapultes et des "griffes" mécaniques pour défendre la ville contre les Romains.',
 'curated'),

('fr', 'daily_sciences', 'medium',
 'Quel phénomène quantique permet aux protons de fusionner dans le Soleil malgré leur répulsion électrostatique, générant l''énergie solaire ?',
 'L''effet tunnel quantique',
 ARRAY['La fission nucléaire', 'L''intrication quantique', 'La force électromagnétique renforcée'],
 'Sans l''effet tunnel, la fusion des protons serait impossible aux températures du cœur solaire (15 millions de degrés). L''effet tunnel est aussi à la base des transistors modernes, des processeurs d''ordinateur et du microscope à effet tunnel (STM).',
 'curated'),

-- [HARD]
('fr', 'daily_sciences', 'hard',
 'Quel est le nom du phénomène par lequel certains matériaux perdent toute résistance électrique en dessous d''une température critique ?',
 'La supraconductivité',
 ARRAY['La thermorésistance', 'La piézoélectricité', 'La superfluidité'],
 'Découverte en 1911 par Heike Kamerlingh Onnes, la supraconductivité permet à un courant de circuler indéfiniment sans perte d''énergie. Elle est utilisée dans les IRM médicaux et les aimants du LHC du CERN. La recherche d''un supraconducteur à température ambiante est l''un des grands Grails de la physique moderne.',
 'curated'),

('fr', 'daily_sciences', 'hard',
 'Grâce à quelles expériences, menées dans le jardin d''un monastère entre 1856 et 1863, Gregor Mendel fonda-t-il la génétique moderne ?',
 'Des croisements systématiques de plants de pois (plus de 29 000 plants étudiés)',
 ARRAY['Des observations microscopiques de bactéries', 'Des croisements de mouches drosophiles', 'Des études sur des souris albinos'],
 'Mendel, moine augustinien en Moravie, publia ses résultats en 1866 mais ils furent ignorés pendant 35 ans. Ce n''est qu''après sa mort qu''ils furent redécouverts simultanément par trois scientifiques en 1900, fondant ainsi la génétique. Les drosophiles ne furent utilisées en génétique qu''à partir de 1908 par Thomas Morgan.',
 'curated'),

('fr', 'daily_sciences', 'hard',
 'Quelle théorie, confirmée par la découverte du rayonnement fossile en 1964, explique l''origine de l''univers il y a 13,8 milliards d''années ?',
 'Le Big Bang',
 ARRAY['La théorie de l''état stationnaire', 'La théorie des cordes', 'L''hypothèse de l''univers cyclique'],
 'Ironiquement, le terme "Big Bang" fut inventé en dérision par Fred Hoyle, partisan de la théorie rivale de l''état stationnaire, lors d''une émission radio en 1949. Le terme est resté. Penzias et Wilson découvrirent le rayonnement fossile accidentellement en cherchant à éliminer un "bruit parasite" de leur antenne.',
 'curated'),

('fr', 'daily_sciences', 'hard',
 'Quelle structure moléculaire est commune à tous les acides aminés, briques de base des protéines du vivant ?',
 'Un groupe amine (-NH₂) et un groupe carboxyle (-COOH) attachés au même carbone alpha',
 ARRAY['Un anneau benzénique et un atome de soufre', 'Deux groupes hydroxyle (-OH)', 'Un atome d''azote et un anneau aromatique'],
 'Les 20 acides aminés "standards" partagent ce squelette mais diffèrent par leur chaîne latérale. Ce code universel — du bactérie à l''humain — est l''une des preuves de l''origine commune de toute vie sur Terre. L''ADN code ces 20 acides aminés avec seulement 4 bases et 64 codons possibles.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 22 — "La plume et le papier" 📚
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_litterature', 'easy',
 'Qui a écrit "Les Misérables", roman de 1 500 pages publié en 1862 et adapté dans le monde entier ?',
 'Victor Hugo',
 ARRAY['Émile Zola', 'Gustave Flaubert', 'Alexandre Dumas'],
 'Victor Hugo, exilé à Guernesey sous Napoléon III, passa 12 ans à rédiger ce roman. Il décrit la France du XIXe siècle à travers Jean Valjean, ancien forçat. C''est l''un des romans les plus adaptés de l''histoire (films, comédies musicales dont celle de Broadway qui tint l''affiche 16 ans).',
 'curated'),

('fr', 'daily_litterature', 'easy',
 'Quel personnage shakespearien prononce la réplique "Être ou ne pas être, telle est la question" ?',
 'Hamlet, prince du Danemark',
 ARRAY['Macbeth', 'Othello', 'Roméo'],
 'Ce monologue de l''Acte III (vers 1601) est le plus cité de Shakespeare. Il a été traduit en français de plus de 20 façons différentes, chaque traducteur cherchant à rendre l''ambiguïté de "to be or not to be". La traduction la plus utilisée reste celle de François-Victor Hugo, fils de Victor Hugo.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_litterature', 'medium',
 'Quel cycle romanesque d''Émile Zola, composé de 20 romans publiés entre 1871 et 1893, décrit une famille sur cinq générations sous le Second Empire ?',
 'Les Rougon-Macquart',
 ARRAY['La Comédie humaine (Balzac)', 'À la recherche du temps perdu (Proust)', 'La Saga des Forsyte (Galsworthy)'],
 'Zola voulait appliquer la méthode expérimentale à la littérature : étudier l''hérédité et le milieu social. Parmi les volumes célèbres : "Germinal" (mine), "L''Assommoir" (alcoolisme), "Nana" (prostitution), "Au Bonheur des Dames" (grand commerce). La Comédie humaine de Balzac compte 90 œuvres.',
 'curated'),

('fr', 'daily_litterature', 'medium',
 'Quel auteur britannique est le créateur de Sherlock Holmes, le célèbre détective du 221B Baker Street ?',
 'Arthur Conan Doyle',
 ARRAY['Agatha Christie', 'G.K. Chesterton', 'Wilkie Collins'],
 'Conan Doyle voulut tuer Holmes dans "Le Dernier Problème" (1893) pour écrire autre chose. Le tollé public fut tel qu''il dut le "ressusciter" en 1903. Il est dit qu''il devint lui-même lassé de son personnage, préférant ses romans historiques — ironiquement oubliés aujourd''hui.',
 'curated'),

('fr', 'daily_litterature', 'medium',
 'Quel roman de Marcel Proust, en 7 tomes publiés de 1913 à 1927, compte environ 1,5 million de mots et est l''un des plus longs de la littérature mondiale ?',
 'À la recherche du temps perdu',
 ARRAY['Guerre et Paix (Tolstoï)', 'La Comédie humaine (Balzac)', 'Les Rougon-Macquart (Zola)'],
 'L''épisode de la madeleine — où une saveur déclenche un flot de souvenirs involontaires — est l''une des scènes les plus commentées de la littérature. La phrase la plus longue du roman compterait environ 958 mots. "À la recherche" représente environ 3 fois la longueur de "Guerre et Paix".',
 'curated'),

('fr', 'daily_litterature', 'medium',
 'Quel roman de George Orwell (1949) imagina une dystopie totalitaire avec "Big Brother", la "Novlangue" et la "doublepensée" ?',
 '1984',
 ARRAY['Le Meilleur des mondes (Huxley)', 'Fahrenheit 451 (Bradbury)', 'La Ferme des animaux (Orwell)'],
 'Orwell écrivit "1984" sur une île écossaise isolée alors qu''il mourait de tuberculose — il inversa les deux derniers chiffres de l''année 1948 pour le titre. Les concepts qu''il inventa sont entrés dans le langage courant. "La Ferme des animaux" (1945) était sa satire de la Révolution russe.',
 'curated'),

-- [HARD]
('fr', 'daily_litterature', 'hard',
 'Quel écrivain algérien d''expression française, auteur de "L''Étranger" et "La Peste", reçut le Prix Nobel de littérature en 1957 ?',
 'Albert Camus',
 ARRAY['Jean-Paul Sartre', 'Simone de Beauvoir', 'Jean Genet'],
 '"L''Étranger" (1942) s''ouvre par "Aujourd''hui, maman est morte." Camus reçut le Nobel à 44 ans, l''un des plus jeunes récipiendaires. Il mourut deux ans plus tard dans un accident de voiture à Villeblevin. Dans la poche de son manteau : un billet de train inutilisé — il devait rentrer autrement.',
 'curated'),

('fr', 'daily_litterature', 'hard',
 'Quel poète florentin du XIVe siècle écrivit la "Divine Comédie", voyage allégorique à travers l''Enfer, le Purgatoire et le Paradis en 14 233 vers ?',
 'Dante Alighieri',
 ARRAY['Pétrarque', 'Boccace', 'Virgile'],
 'Dante écrivit la Divine Comédie en toscan (et non en latin), contribuant à fonder la langue italienne littéraire. Virgile guide Dante dans l''Enfer et le Purgatoire, Béatrice dans le Paradis. L''œuvre est composée en tercets enchaînés (terza rima), une structure inventée par Dante lui-même.',
 'curated'),

('fr', 'daily_litterature', 'hard',
 'Quel auteur espagnol écrivit "Don Quichotte de la Manche" (1605-1615), souvent cité comme le premier roman moderne ?',
 'Miguel de Cervantes',
 ARRAY['Lope de Vega', 'Francisco de Quevedo', 'Calderón de la Barca'],
 'Cervantes commença à écrire Don Quichotte en prison. Son héros, gentilhomme espagnol ayant trop lu de romans de chevalerie, se prend pour un chevalier errant. Curiosité de l''histoire : Cervantes et Shakespeare moururent le même jour, le 23 avril 1616.',
 'curated'),

('fr', 'daily_litterature', 'hard',
 'Quel mouvement littéraire du XIXe siècle, chef de file Émile Zola, cherchait à décrire la réalité sociale avec une précision "scientifique" inspirée de Claude Bernard ?',
 'Le naturalisme',
 ARRAY['Le réalisme', 'Le symbolisme', 'Le romantisme'],
 'Zola théorisa le naturalisme dans "Le Roman expérimental" (1880), voulant appliquer la méthode expérimentale à la fiction. Le symbolisme, mouvement contemporain et opposé, réagit contre ce matérialisme en privilégiant la suggestion et le mystère. Verlaine, Rimbaud et Mallarmé en sont les figures majeures.',
 'curated');


-- ══════════════════════════════════════════════════════════════════════════════
-- AVRIL 23 — "Le monde en chiffres" 🌍
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO questions (language, category, difficulty, question, correct_answer, incorrect_answers, anecdote, source) VALUES

-- [EASY]
('fr', 'daily_geographie', 'easy',
 'Quel est le plus grand océan du monde ?',
 'L''océan Pacifique (~165 millions de km²)',
 ARRAY['L''océan Atlantique', 'L''océan Indien', 'L''océan Arctique'],
 'Le Pacifique couvre environ 46 % de la surface totale des océans — plus que tous les continents réunis. La fosse des Mariannes, le point le plus profond de la planète (~11 km), s''y trouve. Son nom (du latin "pacificus", paisible) fut donné par Magellan en 1520 lors de sa traversée.',
 'curated'),

('fr', 'daily_geographie', 'easy',
 'Quelle est la capitale de l''Australie ?',
 'Canberra',
 ARRAY['Sydney', 'Melbourne', 'Brisbane'],
 'Canberra fut construite de toutes pièces pour être la capitale — résultat d''un compromis entre Sydney et Melbourne qui se disputaient ce titre. Inaugurée en 1913, elle fut conçue par l''architecte américain Walter Burley Griffin, lauréat d''un concours international. Sydney reste la ville la plus peuplée d''Australie.',
 'curated'),

-- [MEDIUM]
('fr', 'daily_geographie', 'medium',
 'Quel est le plus grand pays du monde par superficie ?',
 'La Russie (~17,1 millions de km²)',
 ARRAY['Le Canada (~9,98 millions de km²)', 'La Chine (~9,6 millions de km²)', 'Les États-Unis (~9,4 millions de km²)'],
 'La Russie s''étend sur 11 fuseaux horaires — quand il est minuit à Kaliningrad (enclave en Europe), il est 10h du matin au Kamtchatka. Elle représente 11 % de la superficie terrestre du globe et est presque deux fois plus grande que le Canada, le second.',
 'curated'),

('fr', 'daily_geographie', 'medium',
 'Quel est le seul continent à ne posséder aucun gouvernement souverain ni aucun pays indépendant ?',
 'L''Antarctique',
 ARRAY['L''Arctique', 'L''Océanie', 'L''Amérique centrale'],
 'L''Antarctique est régi par le Traité sur l''Antarctique (1959), signé par 54 pays, qui en fait une zone de paix et de science internationale. Plusieurs pays ont des revendications territoriales, mais aucun gouvernement souverain n''y existe. On y trouve uniquement des stations scientifiques (1 000 à 5 000 chercheurs selon la saison).',
 'curated'),

('fr', 'daily_geographie', 'medium',
 'Quel pays possède le littoral (côtes) le plus long du monde, avec environ 202 000 km ?',
 'Le Canada',
 ARRAY['La Russie', 'La Norvège', 'L''Australie'],
 'Le Canada possède 202 080 km de côtes, incluant les nombreuses îles et archipels de l''Arctique — soit 25 % du total mondial. La Norvège arrive 2e (~58 000 km) grâce à ses fjords très découpés. La longueur d''un littoral varie selon l''échelle de mesure (c''est le "paradoxe de la côte" de Mandelbrot).',
 'curated'),

('fr', 'daily_geographie', 'medium',
 'Quelle est l''agglomération urbaine la plus peuplée du monde en 2024 ?',
 'Tokyo (~37-38 millions d''habitants dans l''agglomération)',
 ARRAY['Delhi', 'Shanghai', 'Mexico City'],
 'L''agglomération de Tokyo-Yokohama concentre environ 30 % de la population japonaise. En 2030, Delhi devrait dépasser Tokyo selon les projections de l''ONU. Tokyo se situe dans une zone à risque sismique majeur et subit régulièrement des tremblements de terre.',
 'curated'),

-- [HARD]
('fr', 'daily_geographie', 'hard',
 'Sur combien de plaques tectoniques majeures repose principalement la croûte terrestre ?',
 '7 à 8 plaques majeures (et environ 12 à 15 plaques mineures)',
 ARRAY['3 plaques', '20 plaques', '50 plaques'],
 'Les 7 grandes plaques sont : Pacifique, Amérique du Nord, Amérique du Sud, Eurasie, Afrique, Indo-Australie et Antarctique. Leur mouvement (quelques cm/an) cause séismes, volcans et formation des chaînes de montagnes. La ceinture de feu du Pacifique, frontière de plusieurs plaques, est responsable de 90 % de la sismicité mondiale.',
 'curated'),

('fr', 'daily_geographie', 'hard',
 'Quel est le point le plus bas de la surface émergée terrestre ?',
 'La mer Morte (~430 mètres sous le niveau de la mer)',
 ARRAY['Le lac Assal en Djibouti (-155 m)', 'La dépression de Qattara en Égypte (-133 m)', 'La mer Caspienne (-28 m)'],
 'La surface de la mer Morte descend d''environ 1 mètre par an à cause du détournement du Jourdain pour l''irrigation. Son taux de sel (34 %) est 10 fois supérieur à la mer ordinaire, rendant impossible d''y couler. Elle est partagée entre Israël, la Jordanie et les Territoires palestiniens.',
 'curated'),

('fr', 'daily_geographie', 'hard',
 'Quel pays sud-américain possède le plus grand nombre de langues officielles au monde avec 36 langues reconnues par sa Constitution de 2009 ?',
 'La Bolivie',
 ARRAY['L''Inde (22 langues officielles)', 'L''Afrique du Sud (11 langues)', 'Le Pérou (3 langues)'],
 'La Constitution bolivienne reconnaît l''espagnol et 35 langues indigènes dont l''aymara, le quechua et le guaraní. L''Afrique du Sud en reconnaît 11, la Suisse 4. Malgré cela, l''espagnol reste la langue dominante dans tous les contextes officiels et commerciaux.',
 'curated'),

('fr', 'daily_geographie', 'hard',
 'Quelle île est considérée comme le lieu habité en permanence le plus isolé du monde, à 2 816 km de son voisin le plus proche ?',
 'Tristan da Cunha (territoire britannique dans l''Atlantique Sud)',
 ARRAY['Alert (Nunavut, Canada)', 'Oymyakon (Sibérie, Russie)', 'Longyearbyen (Svalbard, Norvège)'],
 'Tristan da Cunha est habitée par environ 250 personnes. L''île la plus proche est Sainte-Hélène (où mourut Napoléon) à 2 816 km. Elle n''est accessible que par bateau, la mer n''étant praticable que quelques semaines par an. Presque tous les habitants portent l''un des huit noms de famille des pionniers fondateurs.',
 'curated');
