# ARCHITECTURE.md — Lumino

## Schéma de base de données (Drizzle + Turso)

```sql
-- Utilisateurs
users
  id            TEXT PRIMARY KEY
  email         TEXT UNIQUE NOT NULL
  passwordHash  TEXT NOT NULL
  apiKey        TEXT                  -- clé Anthropic personnelle chiffrée (optionnel)
  createdAt     INTEGER NOT NULL

-- Sessions (Better Auth)
sessions
  id            TEXT PRIMARY KEY
  userId        TEXT NOT NULL → users.id
  token         TEXT UNIQUE NOT NULL
  expiresAt     INTEGER NOT NULL

-- Decks
decks
  id            TEXT PRIMARY KEY
  userId        TEXT NOT NULL → users.id
  name          TEXT NOT NULL
  description   TEXT
  color         TEXT NOT NULL DEFAULT '#6366F1'  -- couleur accent du deck
  createdAt     INTEGER NOT NULL
  updatedAt     INTEGER NOT NULL

-- Cartes
cards
  id            TEXT PRIMARY KEY
  deckId        TEXT NOT NULL → decks.id (CASCADE DELETE)
  front         TEXT NOT NULL          -- question
  back          TEXT NOT NULL          -- réponse
  context       TEXT                   -- phrase source (générée par IA)
  sourceType    TEXT NOT NULL          -- 'ai_text' | 'ai_pdf' | 'manual'
  createdAt     INTEGER NOT NULL

-- État SM-2 par carte par utilisateur
card_reviews
  id            TEXT PRIMARY KEY
  cardId        TEXT NOT NULL → cards.id (CASCADE DELETE)
  userId        TEXT NOT NULL → users.id
  interval      INTEGER NOT NULL DEFAULT 1     -- jours avant prochaine révision
  repetition    INTEGER NOT NULL DEFAULT 0     -- nb de fois revue avec succès
  easeFactor    REAL NOT NULL DEFAULT 2.5      -- facteur de facilité SM-2
  nextReview    INTEGER NOT NULL               -- timestamp Unix prochain révision
  lastReview    INTEGER                        -- timestamp Unix dernière révision

  UNIQUE(cardId, userId)
```

---

## Routes API

### Auth
```
POST /api/auth/register     { email, password }
POST /api/auth/login        { email, password }
POST /api/auth/logout
GET  /api/auth/session
```

### Decks
```
GET    /api/decks              → liste des decks + stats basiques
POST   /api/decks              { name, description?, color? }
GET    /api/decks/:id          → deck + stats (total cartes, dues aujourd'hui)
PATCH  /api/decks/:id          { name?, description?, color? }
DELETE /api/decks/:id
```

### Cards
```
GET    /api/cards?deckId=:id          → toutes les cartes d'un deck
POST   /api/cards                     { deckId, front, back, context? }
PATCH  /api/cards/:id                 { front?, back?, context? }
DELETE /api/cards/:id
POST   /api/cards/:id/review          { grade: 0|1|2|3|4|5 }  → SM-2
GET    /api/cards/due?deckId=:id      → cartes dues aujourd'hui
```

### Génération IA
```
POST /api/generate
  Body:
    { deckId, sourceType: "text"|"pdf", content?, pdfBase64?, cardCount, language }
  Response:
    { cards: [{ id, front, back, context }], count: number }
```

### Export
```
GET /api/export?deckId=:id&format=json
GET /api/export?deckId=:id&format=csv
```

---

## Flux de données — Génération IA

```
Client (GenerateModal)
  │
  ├── sourceType = "pdf" → FileReader → base64 → POST /api/generate
  └── sourceType = "text" → POST /api/generate
          │
          ▼
    API Route (serveur)
          │
          ├── PDF : pdf-parse → texte brut
          ├── Appel Anthropic API (claude-sonnet-4-5)
          │     └── Prompt structuré → JSON cards[]
          ├── Validation zod du JSON retourné
          ├── INSERT en DB (cards + card_reviews initiaux)
          └── Retour des cartes créées
```

## Flux de données — Session d'étude (SM-2)

```
Client (Study Page)
  │
  ├── GET /api/cards/due?deckId=:id
  │     └── Filtre : nextReview <= now()
  │
  ├── Affichage séquentiel des cartes
  │     └── Flip animation → notation utilisateur
  │
  └── POST /api/cards/:id/review { grade }
        └── calculateNextReview(card_review, grade)
        └── UPDATE card_reviews
```

---

## Middleware de protection

```typescript
// middleware.ts
export const config = {
  matcher: ["/dashboard/:path*", "/decks/:path*", "/settings/:path*"]
}

// Vérifie la session Better Auth
// Redirect vers /login si non authentifié
```

---

## Variables d'environnement

```env
TURSO_DATABASE_URL=libsql://[db-name]-[org].turso.io
TURSO_AUTH_TOKEN=...
ANTHROPIC_API_KEY=...
BETTER_AUTH_SECRET=...              # secret 32 chars minimum
BETTER_AUTH_URL=https://lumino.vercel.app
ENCRYPTION_KEY=...                  # pour chiffrer les clés API utilisateurs
```