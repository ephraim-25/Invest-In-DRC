# Invest In DRC — Game Design Document (GDD)

## 1. Vision
Invest In DRC est une simulation économique ancrée dans la réalité de la RDC. Le joueur incarne un jeune entrepreneur qui démarre avec 50 USD et cherche à bâtir un conglomérat (« Dark Empire Group ») dans divers secteurs, tout en gérant l’instabilité économique, les risques politiques et la pression sociale.

Objectifs principaux:
- Offrir une expérience d’apprentissage sur l’entrepreneuriat en RDC
- Équilibrer réalisme et fun, profondeur et accessibilité
- Proposer un gameplay systémique avec des événements dynamiques

## 2. Plateformes et technologies
- Phase 1 (prototype): CLI Node.js (sans dépendances, multiplateforme)
- Phase 2: Desktop (Electron) ou Web (React + Canvas/WebGL), 3D isométrique ou pixel art
- Back-end ultérieur pour Battle Mode: Node.js + WebSocket

## 3. Boucle de gameplay (core loop)
1. Choisir un secteur initial (agriculture, élevage, commerce, tech, énergie)
2. Allouer capital (achat d’intrants, équipements, licences)
3. Tour de simulation (semaine/mois): production, ventes, coûts, événements
4. Décisions: investir, recruter, corrompre, nouer des partenariats, se diversifier
5. Progression: réputation, déblocage de villes, accès au crédit et aux marchés

## 4. Économie et monnaies
- Monnaies: USD et CDF; taux de change dynamique (CDF/USD)
- Inflation: choc aléatoire par tour, modulé par événements macro
- Taxes et logistique: TVA, douanes, coût carburant, fret routier
- Coûts fixes/variables: salaires, maintenance, électricité, sécurité

Formules clés (simplifiées):
- Revenu = quantité_vendue × prix_unitaire
- Marge brute = Revenu − coûts_variables
- Résultat net = Marge brute − coûts_fixes − taxes − pénalités
- Conversion CDF<->USD selon taux_t (stochastique, borné)

## 5. Secteurs (initials) et spécificités
- Agriculture: saisonnalité, intrants (semences, engrais), sensibilité carburant/logistique
- Élevage: cycle de reproduction, alimentation, risque sanitaire
- Commerce: rotation rapide, marge faible à moyenne, dépendance change
- Tech: R&D, effet réseau, besoin faible en logistique mais haut en talent
- Énergie: capex élevés, interruptions réseau (SNEL), licences

Chaque secteur a: capex_min, marge_attendue, risque_spécifique, délai_retour.

## 6. Événements (aléatoires et conditionnels)
- Coupure d’électricité: baisse production/vente, hausse coût générateur
- Fluctuation change: USD/CDF +/- x% (bornes)
- Corruption/contrôle: payer un pot-de-vin (gain court terme, -réputation)
- Pénurie carburant: hausse coûts logistiques, ralentissement
- Opportunité: partenariat (transport, mine, coopérative agricole, startup)

Probabilités modulées par: ville, secteur, réputation, politique anti-corruption.

## 7. Réputation et relations
- Échelle: 0–100
- Actions immorales: pot-de-vin, fraude → +cash court terme, -réputation
- Actions éthiques: payer impôts, RSE, salaires à temps → +réputation
- Effets: accès à meilleurs partenaires, crédits, subventions; coûts de corruption plus élevés si mauvaise réputation

## 8. Progression géographique
- Déblocage de villes selon palier d’actifs / réputation: Kinshasa → Lubumbashi → Goma → Matadi → Mbandaka → …
- Effets villes: marchés, coûts, risques spécifiques (p. ex., Matadi logistique, Goma import frontière)

## 9. Modes
- Éducation: objectifs guidés, tutoriels, explications des concepts
- Battle: marché commun en ligne, compétitions saisonnières, leaderboard

## 10. IA et recommandations
- Conseiller IA: messages contextuels (« réduisez exposition USD », « diversifiez carburant »)
- Scénarios dynamiques: events conditionnés par trajectoire du joueur

## 11. UI/UX et style graphique (phase ultérieure)
- Style: 3D isométrique semi-réaliste ou pixel art moderne
- Palette: terre/vert Congo/doré/bleu ciel
- Audio: musiques urbaines et traditionnelles

## 12. Données et équilibrage (prototype)
- Tour = 1 semaine
- Inflation base: 0.2%–1.5%/semaine; chocs event jusqu’à 5%
- Change initial: 1 USD = 2800 CDF; variation hebdo ±0–4%
- Coût électricité/générateur: 10–25 USD/sem selon events
- Corruption ponctuelle: 10–200 USD; réputation −5 à −20
- Revenu de base par secteur (ordre de grandeur):
  - Agriculture: 20–80 USD/sem (capex 20–40)
  - Élevage: 10–60 USD/sem (capex 25–50)
  - Commerce: 15–70 USD/sem (capex 10–30)
  - Tech: 5–120 USD/sem (capex 10–50, volatil)
  - Énergie: 0–150 USD/sem (capex 40–80, aléatoire)

## 13. Conditions de victoire/défaite
- Victoire: valeur nette ≥ 1,000,000 USD; réputation ≥ 60
- Défaite: faillite (cash < 0 deux tours) ou réputation < 10

## 14. Roadmap
- v0.1 CLI: core systems, événements, sauvegarde JSON
- v0.2 UI Web: rendu cartes, tableaux, graphiques
- v0.3 Battle: serveur, matchmaking

## 15. Pitch (FR)
Invest In DRC est une simulation de business inspirée de la réalité congolaise. Commence avec 50 dollars et bâtis ton empire à travers l’agriculture, la tech, l’énergie ou le commerce. Gère la corruption, les taxes, la concurrence et les crises économiques. Découvre la route vers la richesse à la congolaise — stratégique, risquée, mais passionnante.

## 16. Mentions
Créé par Dark Business Hi-Tech.
