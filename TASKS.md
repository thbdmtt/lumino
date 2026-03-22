# TASKS.md — Lumino

## Méthode
Chaque tâche est autonome et ordonnée par dépendances. Codex doit compléter les tâches dans l'ordre des sprints. Une tâche = un commit logique.

---

## Sprint 0 — Setup & Infrastructure

### T-001 · Init projet Next.js
**Priorité** : critique  
**Dépendances** : aucune

```
- Créer le projet : npx create-next-app@latest lumino --typescript --tailwind --app
- Configurer tsconfig.json avec strict: true
- Installer les dépendances principales :
  better-auth
  drizzle-orm @libsql/client
  @anthropic-ai/sdk
  framer-motion
  zod
  pdf-parse
  @types/pdf-parse
- Créer .env.local.example avec toutes les variables requises
- Créer .gitignore incluant .env.local
```

### T-002 · Configuration Turso + Drizzle
**Priorité** : critique  
**Dépendances** : T-001

```
- Créer lib/db/index.ts : client Turso via createClient()
- Créer lib/db/schema.ts avec les tables :

  users          : id, email, passwordHash, createdAt
  sessions       : id, userId, expiresAt, token
  decks          : id, userId, name, description, color, createdAt, updatedAt
  cards          : id, deckId, front, back, context, sourceType, createdAt
  card_reviews   : id, cardId, userId, interval, repetition, easeFactor,
                   nextReview, lastReview

- Générer la migration initiale : drizzle-kit generate
- Appliquer la migration : drizzle-kit push
- Créer lib/db/queries.ts avec les fonctions CRUD de base
```

### T-003 · Configuration Better Auth
**Priorité** : critique  
**Dépendances** : T-002

```
- Créer lib/auth/index.ts avec Better Auth configuré sur Turso
- Créer app/api/auth/[...all]/route.ts
- Implémenter : email/password uniquement pour la v1
- Créer middleware.ts pour protéger les routes (app)
- Tester : register + login + session
```

### T-004 · PWA Manifest & Config
**Priorité** : haute  
**Dépendances** : T-001

```
- Créer public/manifest.json :
  name: "Lumino"
  short_name: "Lumino"
  theme_color: "#0A0A0A"
  background_color: "#0A0A0A"
  display: "standalone"
  orientation: "portrait"
  icons: 192x192, 512x512
- Configurer next.config.js avec les headers PWA
- Générer les icônes dans public/icons/
```

---

## Sprint 1 — Design System

### T-005 · Tokens CSS & Globals
**Priorité** : critique  
**Dépendances** : T-001

```
- Implémenter globals.css avec toutes les CSS variables définies dans UI_GUIDELINES.md
- Configurer tailwind.config.ts pour étendre avec les tokens custom
- Installer la font choisie (SF Pro via system-font ou Geist)
- Vérifier le rendu dark mode sur mobile
```

### T-006 · Composants UI atomiques
**Priorité** : haute  
**Dépendances** : T-005

```
Créer dans components/ui/ :

- Button.tsx       : variantes primary, secondary, ghost, danger
- Input.tsx        : avec label, error state, focus ring Apple-style
- Card.tsx         : conteneur avec glassmorphism subtil
- Badge.tsx        : pour les tags et statuts
- Modal.tsx        : sheet bottom sur mobile, dialog centré desktop
- Spinner.tsx      : loading indicator
- Toast.tsx        : notifications légères

Chaque composant :
- Accepte className prop
- Typescript strict
- Animations Framer Motion subtiles
```

### T-007 · Layout principal de l'app
**Priorité** : haute  
**Dépendances** : T-006

```
- Créer app/(app)/layout.tsx avec :
  - Navigation bottom bar mobile (Dashboard, Decks, Study, Settings)
  - Sidebar desktop (collapsible)
  - Header avec titre de page et actions contextuelles
- Créer app/(auth)/layout.tsx : layout centré minimal pour login/register
```

---

## Sprint 2 — Auth UI

### T-008 · Page Login
**Priorité** : critique  
**Dépendances** : T-003, T-007

```
- Créer app/(auth)/login/page.tsx
- Formulaire : email + password
- Validation zod côté client
- Gestion erreurs (identifiants incorrects, etc.)
- Lien vers register
- Animation d'entrée Framer Motion
```

### T-009 · Page Register
**Priorité** : critique  
**Dépendances** : T-003, T-007

```
- Créer app/(auth)/register/page.tsx
- Formulaire : email + password + confirm password
- Validation zod
- Redirect vers dashboard après inscription
```

---

## Sprint 3 — Decks

### T-010 · API Routes Decks
**Priorité** : critique  
**Dépendances** : T-002, T-003

```
- Créer app/api/decks/route.ts :
  GET    → liste des decks de l'utilisateur connecté
  POST   → créer un nouveau deck (name, description, color)

- Créer app/api/decks/[id]/route.ts :
  GET    → détail deck + stats (nb cartes, cartes à réviser aujourd'hui)
  PATCH  → modifier nom/description/couleur
  DELETE → supprimer deck + ses cartes

- Validation zod sur tous les inputs
- Vérification ownership (un user ne peut pas accéder au deck d'un autre)
```

### T-011 · Page liste des Decks
**Priorité** : haute  
**Dépendances** : T-010, T-007

```
- Créer app/(app)/decks/page.tsx
- Grille de DeckCard avec : nom, couleur, nb cartes, nb à réviser
- Bouton "Nouveau Deck" → Modal de création
- Animation de liste (stagger Framer Motion)
- État vide élégant avec call-to-action
```

### T-012 · Page détail d'un Deck
**Priorité** : haute  
**Dépendances** : T-011

```
- Créer app/(app)/decks/[id]/page.tsx
- Header : nom du deck, stats, boutons (Étudier, Ajouter, Exporter)
- Liste des cartes avec front/back preview
- Possibilité d'éditer/supprimer chaque carte inline
- Bouton "Générer des cartes" → flow IA
```

---

## Sprint 4 — Génération IA

### T-013 · Algorithme SM-2
**Priorité** : critique  
**Dépendances** : T-002

```
- Créer lib/sm2.ts :

  function calculateNextReview(card: CardReview, grade: 0|1|2|3|4|5): CardReview
  
  Grades : 0-1 (échec), 2 (difficile), 3 (correct), 4 (bien), 5 (parfait)
  
  Implémenter la formule SM-2 standard :
  - EF (ease factor) initial : 2.5
  - Interval initial : 1 jour puis 6 jours
  - nextInterval = lastInterval * EF
  - EF = EF + (0.1 - (5-grade)*(0.08+(5-grade)*0.02))
  - EF minimum : 1.3
  - Si grade < 3 : reset à interval 1

- Créer lib/db/reviews.ts :
  getCardsDueToday(userId, deckId?) → cards[]
  saveReview(cardId, userId, grade) → met à jour card_reviews
```

### T-014 · API Route Génération IA
**Priorité** : critique  
**Dépendances** : T-002, T-003

```
- Créer app/api/generate/route.ts (POST)

  Input (zod) :
  {
    deckId: string
    sourceType: "text" | "pdf"
    content: string        // texte brut (pour "text")
    pdfBase64?: string     // pour "pdf"
    cardCount: number      // 5-50
    language: "fr" | "en"
  }

- Pour PDF : parser avec pdf-parse côté serveur avant envoi à l'IA
- Prompt système pour Claude :
  Tu es un expert en pédagogie et en création de flashcards.
  Génère {cardCount} flashcards en {language} depuis le texte fourni.
  Réponds UNIQUEMENT en JSON valide avec ce format :
  { "cards": [{ "front": "...", "back": "...", "context": "..." }] }
  
  Règles :
  - Front : question précise et claire
  - Back : réponse concise (max 3 phrases)
  - Context : phrase du texte source dont la carte est tirée
  - Éviter la redondance entre les cartes
  - Couvrir les concepts les plus importants

- Valider le JSON retourné par l'IA
- Insérer les cartes en DB
- Retourner les cartes créées
```

### T-015 · UI Génération IA
**Priorité** : haute  
**Dépendances** : T-014, T-012

```
- Créer components/card/GenerateModal.tsx :
  
  Étape 1 — Source :
    Tabs : "Texte" | "PDF"
    - Texte : textarea avec compteur de caractères (max 15 000)
    - PDF : drag & drop zone, max 10MB, preview du nom de fichier
  
  Étape 2 — Paramètres :
    - Nombre de cartes : slider 5–50 (défaut 20)
    - Langue : FR / EN toggle
  
  Étape 3 — Génération :
    - Loading state avec animation subtile
    - Preview des cartes générées (scrollable)
    - Possibilité de décocher des cartes avant import
  
  Étape 4 — Confirmation :
    - "X cartes ajoutées au deck [nom]"
    - Bouton "Étudier maintenant"

- Intégrer dans app/(app)/decks/[id]/page.tsx
```

---

## Sprint 5 — Study Mode

### T-016 · Page Study
**Priorité** : critique  
**Dépendances** : T-013

```
- Créer app/(app)/decks/[id]/study/page.tsx

  Flow :
  1. Charger les cartes dues (SM-2 getCardsDueToday)
  2. Si aucune carte due → écran "Rien à réviser" avec prochaine date
  3. Afficher les cartes une par une

  Composant CardFlip :
  - Recto : question
  - Animation flip 3D au tap/click (style Apple, physique réaliste)
  - Verso : réponse + contexte source (grisé, petite taille)
  - Boutons de notation après flip : Difficile / Correct / Facile / Parfait
    (mappés sur grades SM-2 : 2, 3, 4, 5)
  
  Header de session :
  - Progress bar (X / total)
  - Bouton pause/quitter

  Écran de fin :
  - Stats de session : nb vues, répartition des notes
  - Prochaine session : date de la prochaine carte due
```

### T-017 · Dashboard
**Priorité** : haute  
**Dépendances** : T-016

```
- Créer app/(app)/dashboard/page.tsx

  Sections :
  - "À réviser aujourd'hui" : cartes dues toutes decks confondus
  - Streak de jours consécutifs d'étude
  - Decks récents (3 derniers)
  - Stats globales : total cartes, total révisions
```

---

## Sprint 6 — Export & Settings

### T-018 · Export CSV et JSON
**Priorité** : moyenne  
**Dépendances** : T-010

```
- Créer app/api/export/route.ts (GET)
  Query params : deckId, format (csv | json)
  
  JSON : { deck: {...}, cards: [{front, back, context}] }
  CSV  : colonnes front, back, context (UTF-8 BOM pour Excel)
  
  Headers de réponse : Content-Disposition attachment
  
- Ajouter bouton Export dans app/(app)/decks/[id]/page.tsx
  Dropdown : "Exporter en JSON" | "Exporter en CSV"
```

### T-019 · Page Settings
**Priorité** : basse  
**Dépendances** : T-003

```
- Créer app/(app)/settings/page.tsx

  Sections :
  - Compte : email affiché, bouton "Changer le mot de passe", bouton "Se déconnecter"
  - API Key Anthropic : champ pour entrer sa propre clé (stockée chiffrée en DB)
    afin de ne pas dépendre de la clé serveur
  - Danger zone : "Supprimer mon compte"
```

---

## Sprint 7 — Polish & Deploy

### T-020 · Optimisations PWA
**Priorité** : haute  
**Dépendances** : tous les sprints

```
- Vérifier le Lighthouse PWA score (objectif > 90)
- Configurer les meta tags viewport et apple-mobile-web-app
- Tester l'installation sur iOS Safari et Android Chrome
- Vérifier les transitions de pages (Framer Motion layout animations)
```

### T-021 · Deploy Vercel
**Priorité** : critique  
**Dépendances** : T-020

```
- Configurer les variables d'environnement sur Vercel
- Vérifier que les routes API fonctionnent en Edge/Node runtime
- Tester le build de production : next build
- Configurer le domaine custom si disponible
```

---

## Ordre d'exécution recommandé

```
T-001 → T-002 → T-003 → T-004
      → T-005 → T-006 → T-007
      → T-008 → T-009
      → T-010 → T-011 → T-012
      → T-013 → T-014 → T-015
      → T-016 → T-017
      → T-018 → T-019
      → T-020 → T-021
```