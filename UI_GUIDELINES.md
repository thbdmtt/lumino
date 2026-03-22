# UI_GUIDELINES.md — Lumino

## Philosophie

**"Clarity through darkness."**  
Lumino emprunte au langage visuel Apple : matériaux translucides, typographie précise, micro-animations physiques. Rien ne distrait. Tout guide.

---

## Palette de couleurs

```css
:root {
  /* Backgrounds */
  --bg-base:          #080808;   /* fond global */
  --bg-elevated:      #111111;   /* cards, modals */
  --bg-overlay:       #1A1A1A;   /* hover states, inputs */
  --bg-glass:         rgba(255, 255, 255, 0.04);  /* glassmorphism subtil */

  /* Borders */
  --border-subtle:    rgba(255, 255, 255, 0.06);
  --border-default:   rgba(255, 255, 255, 0.10);
  --border-strong:    rgba(255, 255, 255, 0.18);

  /* Textes */
  --text-primary:     #F5F5F5;
  --text-secondary:   #8A8A8A;
  --text-tertiary:    #4A4A4A;
  --text-inverse:     #080808;

  /* Accent (lumineux, signature Lumino) */
  --accent:           #E8D5A3;   /* or doux — chaleur de la connaissance */
  --accent-dim:       rgba(232, 213, 163, 0.12);
  --accent-glow:      rgba(232, 213, 163, 0.06);

  /* États */
  --success:          #4ADE80;
  --warning:          #FBBF24;
  --danger:           #F87171;
  --info:             #60A5FA;

  /* Grades SM-2 */
  --grade-hard:       #F87171;   /* Difficile */
  --grade-ok:         #FBBF24;   /* Correct */
  --grade-good:       #4ADE80;   /* Bien */
  --grade-perfect:    #60A5FA;   /* Parfait */

  /* Deck colors (palette de 8 couleurs pour les decks) */
  --deck-1: #6366F1;  /* indigo */
  --deck-2: #EC4899;  /* rose */
  --deck-3: #14B8A6;  /* teal */
  --deck-4: #F59E0B;  /* amber */
  --deck-5: #8B5CF6;  /* violet */
  --deck-6: #10B981;  /* emerald */
  --deck-7: #EF4444;  /* red */
  --deck-8: #3B82F6;  /* blue */

  /* Spacing */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   40px;
  --space-2xl:  64px;

  /* Radius */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.6);
  --shadow-accent: 0 0 24px rgba(232, 213, 163, 0.15);

  /* Transitions */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
}
```

---

## Typographie

```css
/* Police : Geist (Vercel) — propre, technique, Apple-adjacent */
/* Fallback : -apple-system, BlinkMacSystemFont */

font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;

/* Échelle typographique */
--text-xs:   11px / 1.4  / 500
--text-sm:   13px / 1.5  / 400
--text-base: 15px / 1.6  / 400
--text-lg:   17px / 1.5  / 500
--text-xl:   20px / 1.4  / 600
--text-2xl:  24px / 1.3  / 600
--text-3xl:  32px / 1.2  / 700
--text-4xl:  40px / 1.1  / 700

/* Tracking (letter-spacing) */
Titres      : -0.03em  (serré, Apple-style)
Corps       : -0.01em
Labels/caps : +0.05em (espacé pour les petits labels)
```

---

## Composants — Specs visuelles

### Button
```
primary:
  background: var(--accent)
  color: var(--text-inverse)
  border-radius: var(--radius-full)
  padding: 10px 20px
  font-size: 15px font-weight: 600
  hover: brightness(1.05) + shadow-accent
  active: scale(0.97)
  transition: var(--ease-spring) 200ms

secondary:
  background: var(--bg-overlay)
  border: 1px solid var(--border-default)
  color: var(--text-primary)

ghost:
  background: transparent
  color: var(--text-secondary)
  hover: color var(--text-primary) + bg var(--bg-glass)

danger:
  background: rgba(248, 113, 113, 0.12)
  border: 1px solid rgba(248, 113, 113, 0.3)
  color: var(--danger)
```

### Card (conteneur)
```
background: var(--bg-elevated)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-lg)
padding: var(--space-lg)
backdrop-filter: blur(12px)
transition: border-color 200ms ease, box-shadow 200ms ease

hover:
  border-color: var(--border-default)
  box-shadow: var(--shadow-md)
```

### Input
```
background: var(--bg-overlay)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-md)
padding: 12px 16px
color: var(--text-primary)
font-size: 15px

focus:
  border-color: var(--accent)
  box-shadow: 0 0 0 3px var(--accent-dim)
  outline: none

error:
  border-color: var(--danger)
  box-shadow: 0 0 0 3px rgba(248,113,113,0.12)
```

### Deck Card
```
background: var(--bg-elevated)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-xl)
overflow: hidden
position: relative

::before (bande colorée en haut, 3px) :
  background: [deck.color]
  width: 100%

hover: translateY(-2px) + shadow-md
active: translateY(0)
```

### Flashcard (Study Mode)
```
Dimensions : 100% width, min-height 260px (mobile)
background: var(--bg-elevated)
border: 1px solid var(--border-subtle)
border-radius: var(--radius-xl)
padding: var(--space-xl)

Animation flip (Framer Motion) :
  Front → Back : rotateY 0° → 180° 
  Back  → Front: rotateY 180° → 0°
  Duration: 400ms
  ease: [0.4, 0, 0.2, 1]  (smooth, pas de spring sur le flip)
  perspective: 1000px sur le conteneur parent

Front : texte centré, text-xl, text-primary
Back  :
  texte réponse centré, text-lg, text-primary
  contexte source en dessous : text-sm, text-tertiary, italic, séparé par un hr subtle

Gradient de fond subtil sur le recto :
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-overlay))
```

### Boutons de notation (après flip)
```
4 boutons en ligne, border-radius: var(--radius-full)
Taille égale, flex-1

Difficile : var(--grade-hard)   fond dim + border
Correct   : var(--grade-ok)     fond dim + border
Bien      : var(--grade-good)   fond dim + border
Parfait   : var(--grade-perfect) fond dim + border

Animation entrée : slideUp + fadeIn, stagger 50ms entre chaque bouton
```

### Navigation (mobile bottom bar)
```
position: fixed, bottom: 0
background: rgba(8, 8, 8, 0.85)
backdrop-filter: blur(20px) saturate(180%)
border-top: 1px solid var(--border-subtle)
padding-bottom: env(safe-area-inset-bottom)

Icônes : SF Symbols via lucide-react, 22px
Label : 10px, tracking 0.03em
Active item : color var(--accent), icon légèrement plus grand (24px)
Transition active : var(--ease-spring) 200ms
```

---

## Animations globales

### Page transitions
```
Entrée page : fadeIn + translateY(8px → 0) — 300ms ease-out
```

### Liste de cartes / decks (stagger)
```javascript
// Framer Motion variants
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4,0,0.2,1] } }
}
```

### Loading states
```
Skeleton : bg-overlay avec shimmer (gradient animé, 1.5s infini)
Spinner  : cercle avec stroke-dasharray animé, couleur var(--accent)
```

### Modal / Sheet
```
Desktop dialog : fadeIn + scaleFrom(0.96) — 200ms spring
Mobile sheet   : slideUp depuis le bas — 350ms spring (0.34, 1.56, 0.64, 1)
Backdrop       : fadeIn rgba(0,0,0,0.6) + blur(4px)
```

---

## Règles d'espacement

- Marges de page mobile : `px-5` (20px)
- Marges de page desktop : `px-8` (32px) max-width 1200px centré
- Gap entre cards en grille : `gap-4` (16px)
- Espacement interne des sections : `py-6` (24px)
- Bottom bar height : 64px + safe-area

---

## Icônes

Utiliser **lucide-react** exclusivement. Taille par défaut : 20px. Stroke-width : 1.5.

```
Dashboard  → LayoutDashboard
Decks      → Layers
Study      → BookOpen
Settings   → Settings
Add        → Plus
Delete     → Trash2
Edit       → Pencil
Export     → Download
Import     → Upload
AI Generate→ Sparkles
Flip card  → RotateCcw
Back       → ChevronLeft
```

---

## Manifest PWA

```json
{
  "name": "Lumino",
  "short_name": "Lumino",
  "description": "Flashcards intelligentes avec répétition espacée",
  "theme_color": "#080808",
  "background_color": "#080808",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/dashboard",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```