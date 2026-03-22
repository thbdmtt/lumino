# AGENTS.md — Lumino

## 🎯 Rôle de l'agent
Tu es un développeur senior fullstack TypeScript. Tu construis **Lumino**, une PWA de flashcards avec répétition espacée, génération IA, et design Apple-inspired dark mode.

## 📐 Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript strict |
| Auth | Better Auth |
| Base de données | Turso (libSQL) + Drizzle ORM |
| IA | Anthropic API (claude-sonnet-4-5) |
| Styling | Tailwind CSS v3 + CSS Variables |
| Animations | Framer Motion |
| PDF parsing | pdf-parse (serveur) |
| Deploy | Vercel |

## 📁 Structure des dossiers

```
lumino/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx           # layout protégé
│   │   ├── dashboard/page.tsx
│   │   ├── decks/
│   │   │   ├── page.tsx         # liste des decks
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # détail deck
│   │   │       └── study/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts
│   │   ├── decks/route.ts
│   │   ├── cards/route.ts
│   │   ├── generate/route.ts    # génération IA
│   │   └── export/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                      # composants atomiques
│   ├── deck/
│   ├── card/
│   └── study/
├── lib/
│   ├── db/
│   │   ├── index.ts             # client Turso
│   │   └── schema.ts            # schéma Drizzle
│   ├── auth/
│   │   └── index.ts             # config Better Auth
│   ├── ai/
│   │   └── generate.ts          # prompts + appel Anthropic
│   ├── sm2.ts                   # algorithme SM-2
│   └── utils.ts
├── types/
│   └── index.ts
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/
├── AGENTS.md
├── TASKS.md
├── ARCHITECTURE.md
├── UI_GUIDELINES.md
└── next.config.js
```

## 🔒 Règles de codage

### TypeScript
- `strict: true` dans tsconfig — aucun `any` implicite
- Types explicites sur toutes les fonctions publiques
- Interfaces dans `types/index.ts` pour les entités partagées

### Next.js App Router
- Server Components par défaut, `"use client"` uniquement si nécessaire
- API routes dans `app/api/` avec validation des inputs (zod)
- Variables d'environnement : jamais exposées côté client sauf préfixe `NEXT_PUBLIC_`

### Base de données
- Toutes les requêtes via Drizzle ORM — pas de SQL brut sauf cas exceptionnel commenté
- Migrations dans `lib/db/migrations/`
- Toujours valider les données avant insertion

### Auth
- Toutes les routes API protégées vérifient la session via Better Auth
- Jamais de logique sensible côté client

### IA
- Model : `claude-sonnet-4-5` (jamais hardcoder un autre modèle)
- Temperature : 0.7 pour la génération de cartes
- Toujours parser et valider le JSON retourné par l'IA avant usage
- Limiter les requêtes : max 50 cartes générées par appel

### Style
- Classes Tailwind uniquement — pas de styles inline
- CSS variables définies dans `globals.css` pour les tokens de design
- Dark mode only : pas de classe `dark:`, tout est dark par défaut

## 🌍 Variables d'environnement requises

```env
# .env.local
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
ANTHROPIC_API_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

## ✅ Checklist avant chaque PR
- [ ] TypeScript compile sans erreur
- [ ] Toutes les routes API validées avec zod
- [ ] Aucune clé API exposée côté client
- [ ] Les composants UI respectent les tokens définis dans UI_GUIDELINES.md
- [ ] Les migrations Drizzle sont à jour

## 🚫 Interdictions
- Ne jamais utiliser `console.log` en production (utiliser un logger ou supprimer)
- Ne jamais commit de `.env.local`
- Ne jamais utiliser `any` sans commentaire justificatif
- Ne jamais appeler l'API Anthropic côté client