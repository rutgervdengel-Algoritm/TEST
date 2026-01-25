# WachtlijstHelderheid

Een transparant wachtlijstbeheer platform voor kinderopvang (BSO/KDV).

![WachtlijstHelderheid](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overzicht

WachtlijstHelderheid biedt een transparante oplossing voor het beheren van wachtlijsten bij kinderopvangorganisaties. Het platform maakt het mogelijk om:

- **Voor opvanglocaties**: Wachtlijsten beheren, prioriteitsregels instellen, beschikbare plekken matchen met wachtenden
- **Voor ouders**: Real-time inzicht in wachtlijstpositie, match-kans indicator, en voorstellen accepteren/afwijzen

## Features

### Beheerders Interface
- Registratie en login met JWT authenticatie
- Volledig CRUD voor wachtlijstinschrijvingen
- Configureerbare prioriteitsregels met wegingsfactoren
- Automatische matching bij nieuwe beschikbare plekken
- Transparante score-berekening
- Beslissingslog (audit trail) met CSV export
- Analytics dashboard

### Ouder Portal
- Toegang via unieke toegangscode (geen login nodig)
- Real-time wachtlijstpositie
- Match-kans indicator (Hoog/Gemiddeld/Laag)
- Transparantie over prioriteitsregels
- Voorkeuren aanpassen
- Match-voorstellen accepteren/afwijzen
- Tijdlijn van gebeurtenissen

### Matching Algoritme

De match-score (0-100%) wordt berekend op basis van drie factoren:

1. **Dagen Match (40 punten)**: Overlap tussen beschikbare dagen en gewenste dagen
2. **Prioriteitsscore (40 punten)**: Op basis van ingestelde regels (inschrijfdatum, broertje/zusje, alleenstaand ouder, etc.)
3. **Startdatum (20 punten)**: Nabijheid van beschikbare startdatum tot gewenste startdatum

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Authenticatie**: JWT tokens

## Installatie

### Vereisten

- Node.js 18+
- npm of yarn

### Stappen

1. **Clone de repository**
```bash
git clone <repository-url>
cd wachtlijsthelderheid
```

2. **Installeer backend dependencies**
```bash
cd backend
npm install
```

3. **Initialiseer de database**
```bash
npm run init-db
```

4. **Seed de database met testdata**
```bash
npm run seed
```

5. **Start de backend server**
```bash
npm run dev
```
De API draait nu op `http://localhost:3001`

6. **Open een nieuwe terminal voor de frontend**
```bash
cd frontend
npm install
npm run dev
```
De frontend draait nu op `http://localhost:3000`

## Test Accounts

### Beheerders
| Organisatie | Email | Wachtwoord |
|-------------|-------|------------|
| Kinderdagverblijf De Zonnestraal | admin@zonnestraal.nl | demo123 |
| BSO Het Speelparadijs | beheer@speelparadijs.nl | test456 |

### Ouder Portal Toegangscodes
Na het runnen van `npm run seed` worden toegangscodes getoond in de console. Voorbeelden:
- Sophie van den Berg: WL-XXXXXX
- Lucas de Vries: WL-XXXXXX

(Exacte codes worden getoond bij seed)

## API Endpoints

### Authenticatie
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| POST | /api/auth/register | Nieuwe organisatie registreren |
| POST | /api/auth/login | Inloggen |
| GET | /api/auth/me | Huidige gebruiker info |

### Wachtlijst Inschrijvingen
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/entries | Alle inschrijvingen ophalen |
| GET | /api/entries/:id | Enkele inschrijving ophalen |
| POST | /api/entries | Nieuwe inschrijving |
| PUT | /api/entries/:id | Inschrijving bijwerken |
| DELETE | /api/entries/:id | Inschrijving verwijderen |

### Prioriteitsregels
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/rules | Regels ophalen |
| PUT | /api/rules | Regels bijwerken |

### Beschikbare Plekken
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/spots | Alle plekken ophalen |
| POST | /api/spots | Nieuwe plek + automatische matching |
| GET | /api/spots/:id/candidates | Kandidaten voor plek |

### Matches
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/matches | Alle matches ophalen |
| POST | /api/matches | Voorstel versturen |

### Ouder Portal (geen auth)
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/portal/:accessCode | Portal data ophalen |
| PUT | /api/portal/:accessCode/preferences | Voorkeuren aanpassen |
| POST | /api/portal/:accessCode/match/:matchId/respond | Op voorstel reageren |

### Analytics & Log
| Methode | Endpoint | Beschrijving |
|---------|----------|--------------|
| GET | /api/analytics | Analytics data |
| GET | /api/log | Beslissingslog |
| GET | /api/log/export | CSV export |

## Database Schema

```sql
-- Organisaties
organizations (id, name, email, password_hash, created_at)

-- Wachtlijst inschrijvingen
waitlist_entries (id, org_id, parent_name, parent_email, child_name,
                  child_birthdate, preferred_days, desired_start_date,
                  notes, status, access_code, priority_factors,
                  created_at, updated_at)

-- Prioriteitsregels
priority_rules (id, org_id, rule_name, rule_type, weight_percentage, description)

-- Beschikbare plekken
available_spots (id, org_id, days, start_date, num_spots, status, created_at)

-- Matches
matches (id, spot_id, entry_id, match_score, score_breakdown,
         status, proposed_at, response_date, rejection_reason)

-- Beslissingslog
decision_log (id, org_id, action_type, description,
              related_entry_id, related_spot_id, related_match_id,
              metadata, created_at)
```

## Project Structuur

```
wachtlijsthelderheid/
├── backend/
│   ├── src/
│   │   ├── index.js      # Express server & routes
│   │   ├── db.js         # Database connectie
│   │   ├── initDb.js     # Database schema
│   │   ├── seed.js       # Test data
│   │   └── matching.js   # Matching algoritme
│   ├── database.sqlite   # SQLite database
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Waitlist.tsx
    │   │   ├── EntryForm.tsx
    │   │   ├── Rules.tsx
    │   │   ├── NewSpot.tsx
    │   │   ├── Matches.tsx
    │   │   ├── DecisionLog.tsx
    │   │   ├── Analytics.tsx
    │   │   └── ParentPortal.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── utils/
    │   │   └── api.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    └── package.json
```

## Gebruik

### 1. Nieuwe inschrijving toevoegen
1. Log in als beheerder
2. Ga naar "Wachtlijst" > "Nieuwe inschrijving"
3. Vul de gegevens in en klik op "Toevoegen"
4. De ouder ontvangt een toegangscode (in productie via email)

### 2. Nieuwe plek beschikbaar
1. Ga naar "Nieuwe Plek"
2. Selecteer de beschikbare dagen en startdatum
3. Klik op "Vind beste matches"
4. Bekijk de top 5 kandidaten met transparante score-uitleg
5. Klik op "Stuur voorstel" om een ouder te benaderen

### 3. Ouder bekijkt positie
1. Ga naar de ouder portal (/portal)
2. Voer de toegangscode in
3. Bekijk positie, match-kans, en eventuele voorstellen

## Deployment

### Environment Variables
```
PORT=3001
JWT_SECRET=your-secret-key-here
```

### Build voor productie
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## Licentie

MIT License

## Support

Voor vragen of problemen, neem contact op via het issue systeem op GitHub.
