# Huisdierenverzekering Vergelijker

Een moderne, gebruiksvriendelijke webapp voor het vergelijken van huisdierenverzekeringen, geïnspireerd door de UX-principes van grote Nederlandse vergelijkers zoals Independer.

## 🎯 Kenmerken

- **Intuïtieve invoerflow**: Helder formulier met validatie voor alle relevante huisdier- en verzekeringsgegevens
- **Realtime prijsberekening**: Dynamische premieberekening op basis van diertype, ras, leeftijd, locatie en dekking
- **Geavanceerde filters**: Sorteer en filter op prijs, eigen risico, vergoedingspercentage, jaarlimiet en extra opties
- **Gedetailleerde resultaten**: Uitgebreide vergelijking van 3 verzekeraars (OHRA, Figo Pet, Univé)
- **Transparante informatie**: Duidelijke prijsopbouw, voorbeeldkosten, voorwaarden en uitsluitingen
- **Responsive design**: Optimaal voor desktop, tablet en mobiel
- **Toegankelijk**: WCAG-compliant met toetsenbordnavigatie en ARIA-labels

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Taal**: TypeScript
- **Styling**: Tailwind CSS met custom design system
- **Components**: Radix UI primitives (via shadcn/ui patterns)
- **Icons**: Lucide React
- **State Management**: React hooks + URL query parameters

## 📁 Project Structuur

```
├── app/
│   ├── globals.css           # Globale styling
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage (redirect naar /pet/quote)
│   └── pet/
│       ├── quote/
│       │   └── page.tsx      # Invoerpagina
│       └── results/
│           └── page.tsx      # Resultatenpagina
├── components/
│   ├── ui/                   # Herbruikbare UI componenten
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── radio-group.tsx
│   │   ├── slider.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   └── tooltip.tsx
│   └── pet/                  # Huisdierenverzekering componenten
│       ├── QuoteForm.tsx     # Invoerformulier
│       ├── Filters.tsx       # Filterpaneel
│       ├── ResultCard.tsx    # Resultatenkaart
│       └── ProviderDetail.tsx # Detail dialog
├── lib/
│   ├── utils.ts              # Utility functies
│   ├── types.ts              # TypeScript types
│   ├── petProviders.ts       # Mock verzekeraar data
│   └── petPricing.ts         # Prijsberekeningslogica
└── tailwind.config.ts        # Tailwind configuratie

```

## 🚀 Aan de slag

### Installatie

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### Productie build

```bash
# Bouw de applicatie
npm run build

# Start productie server
npm start
```

## 🎨 Design System

### Kleuren

- **Primary**: Deep blue (#0B3A67) - Voor headers en belangrijke elementen
- **Accent**: Groen (#1AAE6F) - Voor CTA's en positieve acties
- **Background**: Wit (#FFFFFF) met licht grijs (#F6F8FB) voor secundaire achtergronden
- **Borders**: Licht grijs (#E6EAF0)
- **Text**: Bijna zwart (#0B1320) voor primaire tekst, grijs (#5A6472) voor secundaire tekst

### Typografie

- Font: System font stack (Inter-achtig)
- Headings: Semi-bold (600)
- Body: Regular (400)

### Componenten

- Rounded corners: 0.5rem - 1rem (rounded-lg tot rounded-2xl)
- Shadow: Subtiele schaduwen voor cards
- Spacing: Consistent met Tailwind spacing scale
- Icons: Lucide React (16px en 20px)

## 📋 Features

### Invoerpagina (/pet/quote)

- Keuze tussen hond of kat
- Ras selectie (met conditionele lijst)
- Leeftijd invoer met validatie
- Gewichtscategorie (alleen voor honden)
- Postcode validatie (NL formaat: 1234AB)
- Dekkingsopties (Basis, Standaard, Plus)
- Eigen risico selectie
- Vergoedingspercentage
- Jaarlimiet
- Extra opties (gebitszorg, fysiotherapie, reisdekking)
- Trust elements (snelheid, geen verplichting, privacy)

### Resultatenpagina (/pet/results)

- Overzicht van 3 verzekeraars met realistische prijzen
- Filters:
  - Sorteren (populair, goedkoopst, beste dekking)
  - Prijsrange slider
  - Eigen risico checkboxes
  - Vergoedingspercentage
  - Jaarlimiet
  - Extra opties
- Resultatenkaarten met:
  - Provider naam
  - Badges (Aanrader, Populair, Beste dekking)
  - Maand- en jaarpremie
  - Highlights
  - CTA's
- Detail dialog per provider met:
  - Premie opbouw
  - Voorbeeldkosten (consult, röntgen, operatie)
  - Vergoedingen
  - Wachttijd
  - Uitsluitingen
  - Voorwaarden
- Besparingsindicator
- Waarschuwing over wachttijden
- Mogelijkheid om gegevens te wijzigen

## 🧮 Prijsberekeningslogica

De premie wordt berekend op basis van:

1. **Basispremie**: Verschillend voor hond (€28-32) en kat (€22-25)
2. **Leeftijdsfactor**:
   - 0-1 jaar: 0.9x
   - 2-6 jaar: 1.0x
   - 7-10 jaar: 1.25x
   - 11+ jaar: 1.6x
3. **Rasfactor**: Bepaalde rassen (Bulldog, Maine Coon, etc.) 1.1-1.15x
4. **Locatiefactor**: Stedelijk gebied 1.1x, landelijk 0.95x
5. **Dekkingstype**: Basis 0.7x, Standaard 1.0x, Plus 1.35-1.4x
6. **Eigen risico korting**: €0 = 1.0x, €100 = 0.85-0.88x, €250 = 0.72-0.75x
7. **Vergoedingspercentage**: 70% = 0.82-0.85x, 80% = 0.92-0.95x, 90% = 1.0x
8. **Jaarlimiet**: €2.500 = 0.78-0.8x, €5.000 = 1.0x, €10.000 = 1.25-1.3x
9. **Add-ons**: Vaste bedragen per optie (€3.50-€6)

## 🔒 Privacy & Veiligheid

- Geen echte backend of database
- Alle data blijft client-side
- URL query parameters voor deelbare resultaten
- Geen analytics of tracking
- Geen externe API calls

## 🎯 Gebruikerservaring

- **Loading states**: Skeleton loading en spinners
- **Error states**: Inline validatie met duidelijke foutmeldingen
- **Empty states**: Geen resultaten met reset optie
- **Tooltips**: Hulpinformatie bij complexe velden
- **Responsive**: Mobile-first design
- **Accessibility**: Toetsenbordnavigatie, ARIA labels, focus states

## 📱 Browser Ondersteuning

- Chrome/Edge (laatste 2 versies)
- Firefox (laatste 2 versies)
- Safari (laatste 2 versies)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚧 Toekomstige Uitbreidingen

- Export naar PDF
- E-mail resultaten
- Favorieten opslaan (localStorage)
- Meerdere huisdieren vergelijken
- Meer verzekeraars
- Echte API integratie
- A/B testing voor conversie optimalisatie

## 📄 Licentie

Dit is een demonstratie project. Geen echte verzekeringen of data.

## 🤝 Credits

Gebouwd met Next.js, React, TypeScript en Tailwind CSS.
Design geïnspireerd door Nederlandse vergelijkingssites, maar volledig eigen implementatie.
