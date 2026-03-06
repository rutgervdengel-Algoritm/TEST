# WachtlijstHelderheid - Landingspagina

## Wat is dit project?
Dit is de **marketing landingspagina** voor WachtlijstHelderheid — een SaaS-platform dat kinderopvangorganisaties (KDV/BSO) helpt met transparant wachtlijstbeheer. De app geeft ouders real-time inzicht in hun wachtlijstpositie en automatiseert communicatie.

De landingspagina en de hoofdapplicatie (in `/wachtlijsthelderheid` binnen de TEST repo) zijn **aparte projecten**.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Taal**: TypeScript
- **Styling**: Tailwind CSS met custom design tokens
- **Animaties**: Framer Motion (`motion`, `whileInView`)
- **Icons**: Lucide React
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Deploy**: Vercel

## Design Systeem

### Kleurenpalet (gedefinieerd in `tailwind.config.ts`)
- **Primary (teal)**: `#0d9488` (primary-600) — hoofdkleur, CTA's, accenten
- **Secondary (rood/koraal)**: `#ef4f44` (secondary-500) — ouder-gerelateerde elementen
- **Navy**: `#0f172a` (navy-900) — tekst, donkere achtergronden
- **Success**: `#10b981` — positieve states
- **Error**: `#ef4444` — fouten
- **Warning**: `#f59e0b` — waarschuwingen

### Stijlconventies
- Lichte achtergrond (wit/primary-50 gradiënten), geen dark mode
- Glasmorfisme op navigatie (backdrop-blur)
- Kaarten met `border border-navy-200 rounded-xl` en hover effecten
- Scroll-animaties via Framer Motion `whileInView`
- Responsive: mobile-first, breakpoints via Tailwind (`sm`, `md`, `lg`)
- Alle teksten in het **Nederlands**

### Custom CSS classes (in `globals.css`)
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-lg` — knoppen
- `.card` — kaart component
- `.badge`, `.badge-green`, `.badge-blue`, `.badge-amber` — labels
- `.section-title`, `.section-subtitle` — sectie koppen

## Pagina Structuur & Componenten

Alle componenten staan in `components/`. De pagina (`app/page.tsx`) rendert ze in deze volgorde:

| Component | Sectie ID | Beschrijving |
|---|---|---|
| `Navigation.tsx` | - | Sticky nav met blur, mobile hamburger menu |
| `Hero.tsx` | - | Hoofdbanner met CTA, trust bullets, dashboard mockup |
| `Problem.tsx` | `#opvang` | Probleemstelling voor opvangorganisaties |
| `Solution.tsx` | - | Hoe WachtlijstHelderheid het oplost |
| `Features.tsx` | `#features` | Tabbed features (Opvang vs Ouders), 6 features per tab |
| `ParentsSection.tsx` | `#ouders` | Specifieke sectie voor ouders |
| `ROICalculator.tsx` | - | Interactieve calculator (besparing in uren/geld) |
| `Testimonials.tsx` | - | Klantreviews |
| `Pricing.tsx` | `#pricing` | 3 plannen: Ouder (€0), Basis (€79/mnd), Pro (€149/mnd) |
| `FAQ.tsx` | `#faq` | Veelgestelde vragen |
| `FinalCTA.tsx` | - | Laatste call-to-action |
| `Footer.tsx` | - | Footer met links |

## Doelgroepen
1. **Kinderopvangorganisaties** (betalende klant) — bespaar 12 uur/week, automatische matching, audit trail
2. **Ouders** (gratis gebruiker) — real-time positie zien, geautomatiseerde emails, notificaties

## Development
```bash
cd wachtlijst-landing
npm install
npm run dev    # http://localhost:3000
npm run build  # productie build
npm run lint   # linting
```

## Openstaande taken
- [ ] Formulieren koppelen aan backend (bijv. Formspree of eigen API route)
- [ ] Analytics toevoegen (Vercel Analytics / Google Analytics)
- [ ] Echte screenshots/mockups ter vervanging van grijze placeholders
- [ ] SEO optimalisatie (Open Graph meta tags, sitemap)
- [ ] Cookie consent banner
- [ ] A/B testing voor CTA teksten
- [ ] Logo placeholders in Hero vervangen door echte logo's
- [ ] Login knop koppelen aan echte authenticatie

## Belangrijke notities
- Geen environment variables nodig voor huidige versie
- Alle componenten zijn `'use client'` (client-side rendering voor animaties)
- `package-lock.json` en `node_modules` zijn aanwezig, dependencies zijn geïnstalleerd
- Remote `landingspagina` wijst naar `rutgervdengel-Algoritm/landingspagina` (aparte repo)
