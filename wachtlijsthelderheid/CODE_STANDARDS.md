# Code Standards - WachtlijstHelderheid

## PR Checklist

Gebruik deze checklist bij elke Pull Request:

### Verplicht
- [ ] TypeScript strict mode: geen `any` types
- [ ] Alle nieuwe strings die in UI verschijnen zijn in het Nederlands
- [ ] Componenten < 200 regels (split indien nodig)
- [ ] Async operaties hebben try/catch met user-facing error feedback
- [ ] Geen hardcoded URLs of secrets
- [ ] `use client` alleen waar nodig (event handlers, hooks, browser APIs)
- [ ] Formulieren hebben validatie en error states
- [ ] Prettier formatting is correct (`npm run format:check`)
- [ ] ESLint heeft geen errors (`npm run lint`)

### Aanbevolen
- [ ] Nieuwe types toegevoegd aan `types/index.ts`
- [ ] API functies toegevoegd aan `utils/api.ts`
- [ ] Herbruikbare UI elementen als los component
- [ ] Loading states voor async operaties
- [ ] Empty states voor lege lijsten

---

## TypeScript Regels

### Geen `any` - gebruik specifieke types

```typescript
// FOUT
function handleData(data: any) { ... }

// GOED
interface EntryData {
  child_name: string;
  parent_name: string;
  preferred_days: Day[];
}
function handleData(data: EntryData) { ... }
```

### Gebruik `unknown` voor externe data

```typescript
// FOUT - vertrouw externe data niet
const data = await response.json(); // is 'any'

// GOED - valideer externe data
const data: unknown = await response.json();
if (isValidEntry(data)) {
  // nu is data getypt
}
```

### Import types met `type` keyword

```typescript
// FOUT
import { WaitlistEntry } from '../types';

// GOED - maakt duidelijk dat het een type is, niet een runtime value
import type { WaitlistEntry } from '../types';
```

---

## Component Structuur

### Maximum grootte: 200 regels

Als een component groter wordt dan 200 regels, split het op:

```
ParentPortal.tsx (1012 regels)  →  ParentPortal/
                                    ├── index.tsx           (hoofd-component, < 100 regels)
                                    ├── PositionCard.tsx    (positie weergave)
                                    ├── PreferencesForm.tsx (voorkeuren bewerken)
                                    ├── MatchProposal.tsx   (voorstel accepteren/afwijzen)
                                    ├── Simulator.tsx       (impact simulator)
                                    ├── ConfirmModal.tsx    (interesse bevestigen)
                                    └── Timeline.tsx        (gebeurtenissen)
```

### Component Template

```typescript
// src/components/ExampleComponent.tsx
import { useState } from 'react';
import type { WaitlistEntry } from '../types';

// --- Types ---
interface ExampleComponentProps {
  entry: WaitlistEntry;
  onSave: (entry: WaitlistEntry) => Promise<void>;
}

// --- Constants ---
const MAX_RETRIES = 3;

// --- Component ---
export default function ExampleComponent({ entry, onSave }: ExampleComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      await onSave(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {error && <ErrorMessage message={error} />}
      {/* Component content */}
    </div>
  );
}

// --- Sub-components (als ze klein genoeg zijn) ---
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {message}
    </div>
  );
}
```

---

## Error Handling

### Frontend: Altijd try/catch met user feedback

```typescript
// FOUT - error verdwijnt in console
async function loadData() {
  try {
    const data = await api.get();
    setData(data);
  } catch (error) {
    console.error('Error:', error);  // gebruiker ziet niets
  }
}

// GOED - error wordt aan gebruiker getoond
async function loadData() {
  setLoading(true);
  setError(null);

  try {
    const data = await api.get();
    setData(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Laden mislukt';
    setError(message);
  } finally {
    setLoading(false);
  }
}
```

### Backend: Consistente error responses

```javascript
// Altijd dit format:
res.status(400).json({ error: 'Beschrijving van het probleem' });
res.status(404).json({ error: 'Resource niet gevonden' });
res.status(500).json({ error: 'Server error' });
```

---

## Naming Conventions

| Element | Conventie | Voorbeeld |
|---------|-----------|-----------|
| Components | PascalCase | `WaitlistEntry.tsx` |
| Hooks | camelCase met `use` prefix | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `WaitlistEntry` |
| Constants | UPPER_SNAKE_CASE | `MAX_ENTRIES` |
| CSS classes | kebab-case (Tailwind) | `bg-primary-500` |
| API endpoints | kebab-case | `/api/entries/bulk-reset` |
| Database kolommen | snake_case | `child_name` |
| Bestandsnamen (pages) | PascalCase | `ParentPortal.tsx` |
| Bestandsnamen (utils) | camelCase | `api.ts` |

---

## Git Commit Messages

Gebruik conventionele commits in het Engels:

```
feat: add interest confirmation feature
fix: correct matching algorithm for edge case
refactor: split ParentPortal into sub-components
docs: add architecture documentation
chore: configure prettier and eslint
```

---

## Tailwind CSS Regels

### Gebruik design tokens uit tailwind.config.js

```typescript
// FOUT - hardcoded kleuren
<div className="bg-[#2563eb] text-[#fff]">

// GOED - gebruik theme tokens
<div className="bg-primary-600 text-white">
```

### Responsive design: mobile-first

```typescript
// FOUT - desktop-first
<div className="grid grid-cols-3 sm:grid-cols-1">

// GOED - mobile-first
<div className="grid grid-cols-1 md:grid-cols-3">
```

---

## API Client Regels

### Alle API calls via `utils/api.ts`

```typescript
// FOUT - directe fetch in component
const response = await fetch('/api/entries');

// GOED - via API client
import { entriesApi } from '../utils/api';
const { entries } = await entriesApi.getAll();
```

### Return types altijd expliciet

```typescript
// FOUT - impliciet type
getAll: () => fetchApi('/entries'),

// GOED - expliciet return type
getAll: () =>
  fetchApi<{ entries: WaitlistEntry[] }>('/entries'),
```

---

## Security Regels

1. **Nooit secrets in code** - gebruik environment variables
2. **Valideer alle input** - server-side, niet alleen client-side
3. **Gebruik parameterized queries** - geen string concatenatie in SQL
4. **Sanitize output** - React doet dit automatisch, maar let op `dangerouslySetInnerHTML`
5. **CORS configureren** - niet `app.use(cors())` zonder restricties in productie
