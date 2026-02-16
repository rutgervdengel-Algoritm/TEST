# AUDIT REPORT: WachtlijstHelderheid

**Datum:** 2026-02-16
**Auditor:** Claude Code
**Codebase:** React 18 + Vite + Express + SQLite

---

## Current State

### Project Structuur

```
wachtlijsthelderheid/
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── main.tsx              (14 regels)
│   │   ├── App.tsx               (193 regels) - Routes + Auth context
│   │   ├── components/
│   │   │   └── Layout.tsx        (152 regels)
│   │   ├── pages/                (17 bestanden, 6.400+ regels totaal)
│   │   │   ├── ParentPortal.tsx  (1012 regels) !! TE GROOT
│   │   │   ├── Waitlist.tsx      (676 regels)  !! TE GROOT
│   │   │   ├── ImportExport.tsx  (486 regels)  !! TE GROOT
│   │   │   ├── Rules.tsx         (460 regels)  !! TE GROOT
│   │   │   ├── ...               (13 andere pages)
│   │   ├── types/
│   │   │   └── index.ts          (320 regels) - Alle types in 1 bestand
│   │   └── utils/
│   │       └── api.ts            (460 regels) - Alle API calls
│   └── tests/
├── backend/
│   ├── src/
│   │   ├── index.js              (1555 regels) !! MONOLIET
│   │   ├── matching.js           (694 regels)
│   │   ├── parentRoutes.js       (700 regels)
│   │   ├── initDb.js             (227 regels)
│   │   ├── seed.js               (296 regels)
│   │   └── db.js                 (10 regels)
│   └── tests/
└── .github/workflows/ci.yml
```

**Totaal:** ~10.339 regels broncode (frontend: 6.857, backend: 3.482)

---

## Issues Found

### Critical (rode vlag)

#### 1. JWT Secret hardcoded in broncode
**Bestand:** `backend/src/index.js:18`
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'wachtlijst-helderheid-secret-key-change-in-production';
```
**Risico:** Als `JWT_SECRET` niet is ingesteld, gebruikt iedereen dezelfde key. Aanvallers kunnen JWT tokens forgen.
**Fix:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
```

#### 2. API base URL hardcoded naar productie
**Bestand:** `frontend/src/utils/api.ts:1`
```typescript
const API_BASE = 'https://test-production-621f.up.railway.app/api';
```
**Risico:** Lokale development praat altijd met productie-API. Data corruptie mogelijk.
**Fix:**
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
```

#### 3. Geen rate limiting op authenticatie endpoints
**Bestand:** `backend/src/index.js:144-226`
**Risico:** Login en registratie endpoints zijn vatbaar voor brute force aanvallen.
**Fix:** Voeg express-rate-limit toe:
```javascript
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 10, // max 10 pogingen per window
  message: { error: 'Te veel pogingen, probeer later opnieuw' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### 4. CORS is volledig open
**Bestand:** `backend/src/index.js:21`
```javascript
app.use(cors());
```
**Risico:** Elke website kan API requests maken naar je backend.
**Fix:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

#### 5. Portal endpoints hebben geen authenticatie
**Bestand:** `backend/src/index.js:746, 832, 894, 927, 953, 1000`
**Risico:** Iedereen die een access code raadt (6 alfanumerieke karakters = ~800M combinaties) kan persoonsgegevens inzien. Brute-forceable.
**Fix:** Voeg rate limiting toe op portal routes en overweeg langere access codes.

---

### High Priority (oranje vlag)

#### 6. Geen Prettier of ESLint configuratie
**Status:** Ontbreekt volledig (nu aangemaakt in deze audit)
**Impact:** Inconsistente code formatting, potentiele bugs worden niet gevangen.
**Actie:** ESLint en Prettier configs zijn aangemaakt. Installeer de dependencies:
```bash
cd frontend && npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-react-refresh prettier prettier-plugin-tailwindcss
```

#### 7. Geen .env.example bestand
**Status:** Ontbrak (nu aangemaakt in deze audit)
**Impact:** Nieuwe developers weten niet welke env vars nodig zijn.

#### 8. Backend is 1 monoliet bestand (1555 regels)
**Bestand:** `backend/src/index.js`
**Impact:** Moeilijk te navigeren, testen en onderhouden. Alle routes, middleware, helpers zitten in 1 bestand.
**Target structuur:**
```
backend/src/
├── index.js              (< 50 regels - alleen app setup)
├── config.js             (environment variables)
├── middleware/
│   ├── auth.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── routes/
│   ├── auth.js
│   ├── entries.js
│   ├── rules.js
│   ├── spots.js
│   ├── matches.js
│   ├── portal.js
│   ├── analytics.js
│   ├── importExport.js
│   └── seed.js
├── services/
│   ├── matching.js
│   └── confirmation.js
├── db.js
└── initDb.js
```

#### 9. Frontend componenten te groot
**Over 200 regels:**

| Bestand | Regels | Aanbevolen actie |
|---------|--------|------------------|
| ParentPortal.tsx | 1012 | Split in 7 sub-componenten |
| Waitlist.tsx | 676 | Split in 4 sub-componenten |
| ImportExport.tsx | 486 | Split in 3 sub-componenten |
| Rules.tsx | 460 | Split in 3 sub-componenten |
| ParentRegistrationDetail.tsx | 455 | Split in 3 sub-componenten |
| NewSpot.tsx | 444 | Split in 3 sub-componenten |
| ParentRegistrationForm.tsx | 437 | Split in 2 sub-componenten |
| EntryForm.tsx | 401 | Split in 2 sub-componenten |
| DecisionLog.tsx | 401 | Split in 2 sub-componenten |

#### 10. SVG icons inline in componenten
**Bestanden:** ParentPortal.tsx:15-46, Waitlist.tsx:12-33
**Impact:** Dezelfde icons zijn gekopieerd in meerdere bestanden. lucide-react is al een dependency maar wordt niet consistent gebruikt.
**Fix:** Gebruik overal lucide-react:
```typescript
// VERVANG inline SVGs:
import { Info, CheckCircle, AlertTriangle, Calculator, ChevronUp, ChevronDown } from 'lucide-react';
```

#### 11. Geen input validatie met schema library
**Impact:** Formulier validatie is handmatig en inconsistent. Backend vertrouwt op simpele null checks.
**Fix:** Voeg Zod toe voor runtime validatie:
```bash
npm install zod
```
```typescript
import { z } from 'zod';

const entrySchema = z.object({
  parent_name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn'),
  child_name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn'),
  preferred_days: z.array(z.enum(['MA', 'DI', 'WO', 'DO', 'VR'])).min(1, 'Selecteer minimaal 1 dag'),
  desired_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ongeldig datumformat'),
  parent_email: z.string().email('Ongeldig emailadres').optional(),
});
```

#### 12. Backend is plain JavaScript, niet TypeScript
**Impact:** Geen type safety op backend. Typefouten worden pas runtime gevonden.
**Prioriteit:** Medium-high voor nieuwe features. Migratie van bestaande code kan later.

---

### Medium Priority (gele vlag)

#### 13. Auth context in App.tsx i.p.v. eigen bestand
**Bestand:** `frontend/src/App.tsx:28-42`
**Impact:** Auth logica is vermengd met routing. Niet herbruikbaar.
**Fix:** Verplaats naar `src/hooks/useAuth.ts` en `src/contexts/AuthContext.tsx`.

#### 14. Token wordt alleen in geheugen opgeslagen
**Bestand:** `frontend/src/utils/api.ts:4`
**Impact:** Sessie gaat verloren bij page refresh. Gebruiker moet steeds opnieuw inloggen.
**Fix:** Sla token op in `sessionStorage` (veiliger dan localStorage, maar overleeft refresh):
```typescript
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    sessionStorage.setItem('auth_token', token);
  } else {
    sessionStorage.removeItem('auth_token');
  }
}

// Bij app startup:
const storedToken = sessionStorage.getItem('auth_token');
if (storedToken) setAuthToken(storedToken);
```

#### 15. Dubbele type definities
**Bestanden:** `frontend/src/types/index.ts` en `frontend/src/utils/api.ts:314-372`
**Impact:** ParentUser, StandaloneRegistration, ConfirmationEmail etc. zijn gedefinieerd in api.ts i.p.v. in types/index.ts.
**Fix:** Verplaats alle types naar `types/index.ts`.

#### 16. Hardcoded DAYS array op meerdere plekken
**Bestanden:** ParentPortal.tsx:6, Waitlist.tsx:10, en andere
**Fix:** Maak een gedeelde constants file:
```typescript
// src/constants/index.ts
import type { Day } from '../types';

export const DAYS: { value: Day; label: string }[] = [
  { value: 'MA', label: 'Maandag' },
  { value: 'DI', label: 'Dinsdag' },
  { value: 'WO', label: 'Woensdag' },
  { value: 'DO', label: 'Donderdag' },
  { value: 'VR', label: 'Vrijdag' },
];

export const DAY_VALUES: Day[] = ['MA', 'DI', 'WO', 'DO', 'VR'];
```

#### 17. Geen global error boundary
**Impact:** Een onverwachte error in een component crasht de hele applicatie.
**Fix:**
```typescript
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Er ging iets mis
            </h1>
            <p className="text-gray-600 mb-4">
              Probeer de pagina te herladen.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Pagina herladen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### 18. Inconsistente error handling in frontend
**Voorbeeld:** `ParentPortal.tsx:148` - error wordt alleen naar console gelogd, gebruiker ziet niets.
```typescript
// HUIDIGE SITUATIE (meerdere plekken)
} catch (err) {
  console.error('Error saving preferences:', err);
}

// MOET WORDEN
} catch (err) {
  setError(err instanceof Error ? err.message : 'Opslaan mislukt');
}
```

#### 19. Database.sqlite in git (ondanks .gitignore)
**Bestand:** `backend/database.sqlite`
**Status:** `.gitignore` bevat `*.sqlite` maar het bestand zou in eerdere commits kunnen staan.
**Fix:** Verifieer dat het niet in git history zit. Zo wel: `git rm --cached backend/database.sqlite`

---

### Nice to Have (groene vlag)

#### 20. Geen test suite (unit tests)
**Status:** Alleen build test en API integration test. Geen unit tests voor matching algoritme of componenten.

#### 21. Geen loading skeletons
**Status:** Alleen een spinner bij laden. Skeleton loaders geven betere UX.

#### 22. Geen optimistic updates
**Status:** Na elke mutatie wordt de hele lijst opnieuw geladen.

#### 23. Backend logging met console.error
**Status:** Geen structured logging (bijv. pino of winston).

#### 24. Geen database migratie systeem
**Status:** Schema wordt bij elke start opnieuw aangemaakt via `initDb.js`. Geen versioning.

---

## Positieve Punten

De audit is niet alleen negatief. De codebase heeft sterke kanten:

1. **TypeScript strict mode is AAN** - `strict: true` in tsconfig.json
2. **Geen `any` types gevonden** - goede TypeScript discipline
3. **Comprehensive type definities** - 320 regels types in `types/index.ts`
4. **Centralized API client** - alle calls via `utils/api.ts`
5. **Goede auth patroon** - JWT in geheugen, niet localStorage
6. **Matching algoritme is goed gedocumenteerd** - JSDoc comments
7. **CI/CD pipeline bestaat** - GitHub Actions voor frontend en backend tests
8. **Consistente error responses** - backend gebruikt standaard format
9. **Nederlandse UI** - consistente taal
10. **Git ignore is correct** - node_modules, dist, .env uitgesloten

---

## Refactoring Roadmap

### Phase 1: Security Fixes (Critical)

- [ ] Fix JWT_SECRET - crash als env var ontbreekt
- [ ] Fix API_BASE - gebruik environment variable
- [ ] Voeg rate limiting toe op auth en portal endpoints
- [ ] Configureer CORS met specifieke origin
- [ ] Verifieer dat database.sqlite niet in git zit

### Phase 2: Tooling & Foundation

- [ ] Installeer ESLint dependencies en run eerste lint
- [ ] Installeer Prettier dependencies en format codebase
- [ ] Voeg `npm run lint` en `npm run format` scripts toe aan package.json
- [ ] Maak `src/constants/index.ts` met gedeelde constants (DAYS etc.)
- [ ] Verplaats types uit api.ts naar types/index.ts
- [ ] Voeg ErrorBoundary component toe
- [ ] Fix token persistence (sessionStorage)

### Phase 3: Backend Restructuring

- [ ] Maak `routes/` directory en split index.js per domein
- [ ] Maak `middleware/` directory (auth, rateLimiter, errorHandler)
- [ ] Maak `config.js` voor environment variables
- [ ] Verplaats confirmation logic naar `services/confirmation.js`
- [ ] Voeg input validatie toe met een schema library

### Phase 4: Frontend Component Splits

- [ ] Split ParentPortal.tsx (1012 regels) in sub-componenten
- [ ] Split Waitlist.tsx (676 regels) in sub-componenten
- [ ] Split ImportExport.tsx (486 regels)
- [ ] Split Rules.tsx (460 regels)
- [ ] Vervang inline SVGs door lucide-react icons
- [ ] Verplaats Auth context naar eigen hook/context bestanden
- [ ] Voeg Zod validatie toe aan formulieren

### Phase 5: Quality & Testing

- [ ] Voeg unit tests toe voor matching algoritme
- [ ] Voeg component tests toe met Vitest + Testing Library
- [ ] Voeg loading skeletons toe
- [ ] Implementeer optimistic updates
- [ ] Voeg structured logging toe aan backend (pino)

---

## Target Folder Structure

### Frontend (na refactoring)

```
frontend/src/
├── main.tsx
├── App.tsx                    (alleen routes, < 50 regels)
├── components/
│   ├── ui/                    (herbruikbare UI primitives)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── layout/
│   │   ├── Layout.tsx
│   │   └── ErrorBoundary.tsx
│   └── shared/
│       ├── DaySelector.tsx
│       ├── StatusBadge.tsx
│       └── SortableHeader.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── waitlist/
│   │   ├── WaitlistPage.tsx
│   │   ├── WaitlistTable.tsx
│   │   ├── WaitlistFilters.tsx
│   │   └── WaitlistStats.tsx
│   ├── parent-portal/
│   │   ├── ParentPortalPage.tsx
│   │   ├── PositionCard.tsx
│   │   ├── PreferencesForm.tsx
│   │   ├── MatchProposal.tsx
│   │   ├── Simulator.tsx
│   │   ├── ConfirmInterestModal.tsx
│   │   └── Timeline.tsx
│   └── ... (andere pages)
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── contexts/
│   └── AuthContext.tsx
├── constants/
│   └── index.ts
├── types/
│   └── index.ts
└── utils/
    ├── api.ts
    └── format.ts
```

### Backend (na refactoring)

```
backend/src/
├── index.js                   (< 30 regels - alleen app.listen)
├── app.js                     (Express setup + middleware)
├── config.js                  (env vars met validatie)
├── db.js
├── initDb.js
├── middleware/
│   ├── auth.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── routes/
│   ├── auth.js
│   ├── entries.js
│   ├── rules.js
│   ├── spots.js
│   ├── matches.js
│   ├── portal.js
│   ├── analytics.js
│   ├── importExport.js
│   ├── log.js
│   └── seed.js
├── services/
│   ├── matching.js
│   └── confirmation.js
└── seed.js
```

---

## Quick Wins (Doe Deze Eerst)

| # | Actie | Impact | Effort |
|---|-------|--------|--------|
| 1 | Fix `API_BASE` hardcoded URL | Voorkom productie data corruptie | 5 min |
| 2 | Fix `JWT_SECRET` fallback verwijderen | Voorkom security breach | 5 min |
| 3 | Maak `constants/index.ts` met DAYS | Elimineer 5+ duplicaties | 15 min |
| 4 | Installeer Prettier + format codebase | Consistente formatting | 15 min |
| 5 | Voeg `express-rate-limit` toe | Bescherm tegen brute force | 20 min |
| 6 | Vervang inline SVGs door lucide-react | Minder duplicatie, kleiner bundle | 30 min |
| 7 | Verplaats types uit api.ts naar types/ | Betere organisatie | 15 min |
| 8 | Voeg ErrorBoundary toe | Voorkom witte schermen bij errors | 15 min |

---

## Next Feature Template

Wanneer je een nieuwe feature bouwt, volg dit patroon:

### 1. Types definiëren
```typescript
// types/index.ts - voeg toe
export interface NieuweFeature {
  id: number;
  // ...
}
```

### 2. API functies toevoegen
```typescript
// utils/api.ts - voeg toe
export const nieuweFeatureApi = {
  getAll: () => fetchApi<{ items: NieuweFeature[] }>('/nieuwe-feature'),
  create: (data: Partial<NieuweFeature>) =>
    fetchApi<{ item: NieuweFeature }>('/nieuwe-feature', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### 3. Component bouwen (max 200 regels)
```typescript
// pages/NieuweFeature.tsx
import { useState, useEffect } from 'react';
import type { NieuweFeature } from '../types';
import { nieuweFeatureApi } from '../utils/api';
import Layout from '../components/Layout';

export default function NieuweFeaturePage() {
  const [items, setItems] = useState<NieuweFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const { items } = await nieuweFeatureApi.getAll();
      setItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Nieuwe Feature">
      {error && <ErrorBanner message={error} />}
      {loading ? <LoadingSpinner /> : <ItemList items={items} />}
    </Layout>
  );
}
```

### 4. Route toevoegen
```typescript
// App.tsx
<Route path="/nieuwe-feature" element={
  <ProtectedRoute><NieuweFeaturePage /></ProtectedRoute>
} />
```

### 5. Navigatie toevoegen
```typescript
// components/Layout.tsx - voeg toe aan navItems
{ path: '/nieuwe-feature', label: 'Nieuwe Feature', icon: SomeIcon }
```

---

## Files Created in This Audit

| Bestand | Doel |
|---------|------|
| `ARCHITECTURE.md` | Tech stack, architectuur beslissingen, data flow |
| `CODE_STANDARDS.md` | PR checklist, coding conventions, patterns |
| `AUDIT_REPORT.md` | Dit rapport |
| `.env.example` | Template voor environment variables |
| `frontend/.prettierrc` | Prettier configuratie |
| `frontend/.eslintrc.cjs` | ESLint configuratie |
| `backend/.prettierrc` | Prettier configuratie (backend) |
| `frontend/src/components/_TEMPLATE.tsx` | Component template |
