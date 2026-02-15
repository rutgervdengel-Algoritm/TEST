# WachtlijstHelderheid - Landing Page

Marketing landing page voor WachtlijstHelderheid, gebouwd met Next.js 14 en Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Taal**: TypeScript

## Lokaal draaien

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Build voor productie

```bash
npm run build
npm start
```

## Deployen naar Vercel

1. Push naar GitHub
2. Ga naar [vercel.com](https://vercel.com)
3. Importeer de repository
4. Framework wordt automatisch gedetecteerd als Next.js
5. Klik op Deploy

Of via CLI:

```bash
npx vercel
```

## Environment Variables

Geen environment variables nodig voor de huidige versie.

## Structuur

```
wachtlijst-landing/
├── app/
│   ├── layout.tsx        # Root layout met fonts
│   ├── page.tsx           # Main landing page
│   └── globals.css        # Tailwind imports
├── components/
│   ├── Navigation.tsx     # Sticky navbar met hamburger menu
│   ├── Hero.tsx           # Hero section met CTA
│   ├── Problem.tsx        # Probleemstelling met stats
│   ├── Solution.tsx       # 3-stappen uitleg
│   ├── Features.tsx       # Feature tabs (opvang/ouders)
│   ├── ROICalculator.tsx  # Interactieve besparingscalculator
│   ├── Testimonials.tsx   # Klantbeoordelingen
│   ├── Pricing.tsx        # Prijsplannen
│   ├── FAQ.tsx            # Accordion FAQ
│   ├── FinalCTA.tsx       # Afsluitende call-to-action
│   └── Footer.tsx         # Footer met links
└── public/
    └── images/            # Afbeeldingen (placeholders)
```

## Volgende stappen

- [ ] Formulieren koppelen aan backend (e.g. Formspree, eigen API)
- [ ] Analytics toevoegen (Vercel Analytics, Google Analytics)
- [ ] Echte screenshots/mockups toevoegen
- [ ] SEO optimalisatie (meta tags, Open Graph)
- [ ] Cookie consent banner
- [ ] A/B testing voor CTA teksten
