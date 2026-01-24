import { Provider } from './types';

export const providers: Provider[] = [
  {
    id: 'ohra',
    name: 'OHRA',
    basePremiumDog: 28.5,
    basePremiumCat: 22.0,
    coverageMultipliers: {
      basic: 0.7,
      standard: 1.0,
      plus: 1.35,
    },
    addOnPrices: {
      dentalCare: 5.5,
      physiotherapy: 4.0,
      travelCoverage: 3.5,
    },
    deductibleDiscounts: {
      0: 1.0,
      100: 0.88,
      250: 0.75,
    },
    reimbursementMultipliers: {
      70: 0.85,
      80: 0.95,
      90: 1.0,
    },
    yearlyLimitMultipliers: {
      2500: 0.8,
      5000: 1.0,
      10000: 1.25,
    },
    waitingPeriodDays: 14,
    badges: ['Aanrader', 'Laagste premie'],
    highlights: [
      '90% vergoeding mogelijk',
      'Tot €10.000 per jaar',
      '€0 eigen risico mogelijk',
      '14 dagen wachttijd'
    ],
    exclusions: [
      'Aangeboren afwijkingen niet gedekt in basispakket',
      'Gedragsproblemen uitgesloten',
      'Cosmetische behandelingen niet vergoed'
    ],
    sampleCosts: {
      consultation: { cost: 45, reimbursement: 40.5 },
      xray: { cost: 120, reimbursement: 108 },
      surgery: { cost: 1500, reimbursement: 1350 },
    },
  },
  {
    id: 'figo',
    name: 'Figo Pet',
    basePremiumDog: 32.0,
    basePremiumCat: 24.5,
    coverageMultipliers: {
      basic: 0.75,
      standard: 1.0,
      plus: 1.4,
    },
    addOnPrices: {
      dentalCare: 6.0,
      physiotherapy: 5.0,
      travelCoverage: 4.5,
    },
    deductibleDiscounts: {
      0: 1.0,
      100: 0.85,
      250: 0.72,
    },
    reimbursementMultipliers: {
      70: 0.82,
      80: 0.92,
      90: 1.0,
    },
    yearlyLimitMultipliers: {
      2500: 0.78,
      5000: 1.0,
      10000: 1.3,
    },
    waitingPeriodDays: 7,
    badges: ['Populair', 'Beste dekking'],
    highlights: [
      '90% vergoeding standaard',
      'Wereldwijde dekking beschikbaar',
      'Tot €10.000 jaarlimiet',
      'Slechts 7 dagen wachttijd'
    ],
    exclusions: [
      'Eerste 7 dagen geen dekking',
      'Pre-existente aandoeningen uitgesloten',
      'Fokdieren niet gedekt'
    ],
    sampleCosts: {
      consultation: { cost: 45, reimbursement: 40.5 },
      xray: { cost: 120, reimbursement: 110 },
      surgery: { cost: 1500, reimbursement: 1425 },
    },
  },
  {
    id: 'unive',
    name: 'Univé',
    basePremiumDog: 29.5,
    basePremiumCat: 23.0,
    coverageMultipliers: {
      basic: 0.72,
      standard: 1.0,
      plus: 1.38,
    },
    addOnPrices: {
      dentalCare: 5.0,
      physiotherapy: 4.5,
      travelCoverage: 4.0,
    },
    deductibleDiscounts: {
      0: 1.0,
      100: 0.87,
      250: 0.74,
    },
    reimbursementMultipliers: {
      70: 0.84,
      80: 0.94,
      90: 1.0,
    },
    yearlyLimitMultipliers: {
      2500: 0.79,
      5000: 1.0,
      10000: 1.28,
    },
    waitingPeriodDays: 21,
    badges: ['Betrouwbaar'],
    highlights: [
      '80% vergoeding inclusief',
      'Fysiotherapie beschikbaar',
      'Tot €10.000 per jaar',
      '21 dagen wachttijd'
    ],
    exclusions: [
      '21 dagen wachttijd voor ziektes',
      'Gedragsproblemen niet gedekt',
      'Experimentele behandelingen uitgesloten'
    ],
    sampleCosts: {
      consultation: { cost: 45, reimbursement: 36 },
      xray: { cost: 120, reimbursement: 96 },
      surgery: { cost: 1500, reimbursement: 1200 },
    },
  },
];

export const dogBreeds = [
  'Labrador',
  'Duitse Herder',
  'Golden Retriever',
  'Bulldog',
  'Beagle',
  'Poedel',
  'Rottweiler',
  'Yorkshire Terrier',
  'Boxer',
  'Teckel',
  'Chihuahua',
  'Jack Russell Terrier',
  'Border Collie',
  'Husky',
  'Berner Sennenhond',
  'Anders',
];

export const catBreeds = [
  'Europese Korthaar',
  'Brits Korthaar',
  'Maine Coon',
  'Siamese',
  'Ragdoll',
  'Perzische Kat',
  'Noorse Boskat',
  'Bengal',
  'Sphynx',
  'Birmaan',
  'Anders',
];
