# WachtlijstHelderheid - Landing Page

## Project Context
Dit is de **marketing landingspagina** voor WachtlijstHelderheid — een app die kinderopvangorganisaties helpt met wachtlijstbeheer. De landingspagina staat los van de hoofdapplicatie (die in `/wachtlijsthelderheid` staat).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animaties**: Framer Motion
- **Icons**: Lucide React
- **Taal**: TypeScript

## Projectstructuur
- `app/` — Next.js App Router (layout, page, globals.css)
- `components/` — Alle pagina-secties als losse componenten:
  - Navigation, Hero, Problem, Solution, Features, ROICalculator, Testimonials, Pricing, FAQ, FinalCTA, Footer

## Development
```bash
cd wachtlijst-landing
npm install
npm run dev    # http://localhost:3000
```

## Openstaande taken / Volgende stappen
- Formulieren koppelen aan backend (bijv. Formspree of eigen API)
- Analytics toevoegen (Vercel Analytics / Google Analytics)
- Echte screenshots/mockups toevoegen ter vervanging van placeholders
- SEO optimalisatie (meta tags, Open Graph)
- Cookie consent banner
- A/B testing voor CTA teksten

## Belangrijke notities
- De landingspagina en de app (`/wachtlijsthelderheid`) zijn **aparte projecten** binnen dezelfde repo
- Deploy via Vercel (framework wordt automatisch gedetecteerd)
- Geen environment variables nodig voor huidige versie
