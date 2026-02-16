# Architecture - WachtlijstHelderheid

## Tech Stack

| Layer | Technology | Version | Waarom gekozen |
|-------|-----------|---------|----------------|
| **Frontend** | React | 18.2 | Componentgebaseerd, grote community, goede TypeScript support |
| **Build tool** | Vite | 5.0 | Snel, moderne bundler met HMR |
| **Taal** | TypeScript | 5.3 | Type safety, betere DX, minder runtime bugs |
| **Styling** | Tailwind CSS | 3.4 | Utility-first, consistent design, snel prototypen |
| **Routing** | React Router | 6.21 | Standaard voor React SPA routing |
| **Icons** | Lucide React | 0.564 | Lichtgewicht, tree-shakeable icon library |
| **Backend** | Express.js | 4.18 | Minimaal, flexibel, breed gedragen |
| **Database** | SQLite (better-sqlite3) | 9.4 | Zero-config, file-based, sync API |
| **Auth** | JWT (jsonwebtoken) | 9.0 | Stateless authentication |
| **Hashing** | bcryptjs | 2.4 | Veilige wachtwoord hashing |
| **Deployment** | Vercel (FE) + Railway (BE) | - | Gratis tier, makkelijk te deployen |

## Architectuur Overzicht

```
wachtlijsthelderheid/
├── frontend/           # React SPA (Vite)
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Routes + Auth context
│   │   ├── components/        # Herbruikbare UI componenten
│   │   ├── pages/             # Route-specifieke pagina's
│   │   ├── types/             # TypeScript type definities
│   │   └── utils/             # API client, helpers
│   └── tests/
└── backend/            # Express API
    ├── src/
    │   ├── index.js           # Express server + routes
    │   ├── db.js              # Database connectie
    │   ├── initDb.js          # Schema definitie
    │   ├── matching.js        # Matching algoritme
    │   ├── parentRoutes.js    # Ouder standalone routes
    │   └── seed.js            # Test data
    └── tests/
```

## Data Flow

```
Browser → Vite Dev Server → React App → API Client (utils/api.ts)
                                              ↓
                                        fetch() calls
                                              ↓
                                   Express API (backend/)
                                              ↓
                                     SQLite Database
```

### Authenticatie Flow

1. Gebruiker logt in via `/api/auth/login`
2. Backend valideert credentials, retourneert JWT token
3. Frontend slaat token op in geheugen (niet localStorage)
4. Elke API call stuurt token mee via `Authorization: Bearer <token>`
5. Backend middleware valideert token en extraheert `orgId`

### Matching Algoritme

Het matching algoritme berekent een score (0-100) uit drie componenten:

| Component | Max Score | Weging | Beschrijving |
|-----------|-----------|--------|--------------|
| Dagen overlap | 40 | 40% | Hoeveel gevraagde dagen beschikbaar zijn |
| Prioriteit | 40 | 40% | Gebaseerd op organisatieregels (inschrijfdatum, broertje/zusje, etc.) |
| Startdatum | 20 | 20% | Hoe dicht de beschikbare datum bij de gewenste datum ligt |

## Belangrijke Beslissingen

### Waarom SPA i.p.v. Next.js SSR?

De applicatie is primair een dashboard/portaal. SEO is niet kritiek (achter login).
Een SPA met Vite is eenvoudiger te deployen en heeft minder complexiteit.

### Waarom SQLite i.p.v. PostgreSQL?

- Zero-config: geen aparte database server nodig
- Synchrone API via better-sqlite3: eenvoudigere code
- Voldoende voor verwacht gebruikersvolume (< 1000 organisaties)
- Migratie naar PostgreSQL is mogelijk als schaling nodig is

### Waarom JWT in geheugen i.p.v. localStorage?

- Veiliger: niet toegankelijk via XSS
- Trade-off: sessie gaat verloren bij page refresh
- Acceptabel voor huidige use case

## Feature Overzicht

| # | Feature | Status | Locatie |
|---|---------|--------|---------|
| 1 | Positie range | Done | matching.js → calculateWaitlistPosition |
| 2 | Breakdown per regel | Done | matching.js → aheadByRule |
| 3 | Score uitleg bij match | Done | ParentPortal.tsx → ScoreBreakdownCard |
| 4 | Impact simulator | Done | matching.js → simulatePreferenceChange |
| 5 | Uitgebreid beslissingslog | Done | index.js → logDecision |
| 7 | CSV import/export | Done | index.js → import/export routes |
| 8 | Fairness check | Done | matching.js → checkRulesFairness |
| 9 | Interesse bevestiging | Done | index.js → confirmation routes |
| 10 | Ouder standalone mode | Done | parentRoutes.js |

## Omgevingsvariabelen

| Variabele | Standaard | Beschrijving |
|-----------|-----------|--------------|
| `PORT` | 3001 | Backend poort |
| `JWT_SECRET` | hardcoded fallback | **MOET worden overschreven in productie** |
| `API_URL` | http://localhost:3001 | Voor tests |

## Bekende Beperkingen

1. **Geen echte email verzending** - emails worden alleen als preview getoond
2. **SQLite single-writer** - niet geschikt voor hoge concurrency
3. **Geen file upload** - CSV import werkt via JSON body, niet multipart
4. **Geen rate limiting** - API is vatbaar voor brute force
5. **Frontend API_BASE is hardcoded** - moet via environment variable
