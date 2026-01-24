export type PetType = 'dog' | 'cat';
export type CoverageType = 'basic' | 'standard' | 'plus';
export type WeightCategory = 'S' | 'M' | 'L';

export interface QuoteFormData {
  petType: PetType;
  petName?: string;
  breed: string;
  age: number;
  weightCategory?: WeightCategory;
  postalCode: string;
  coverageType: CoverageType;
  deductible: number;
  reimbursementPercentage: number;
  yearlyLimit: number;
  dentalCare: boolean;
  physiotherapy: boolean;
  travelCoverage: boolean;
  email?: string;
}

export interface Provider {
  id: string;
  name: string;
  basePremiumDog: number;
  basePremiumCat: number;
  coverageMultipliers: {
    basic: number;
    standard: number;
    plus: number;
  };
  addOnPrices: {
    dentalCare: number;
    physiotherapy: number;
    travelCoverage: number;
  };
  deductibleDiscounts: {
    0: number;
    100: number;
    250: number;
  };
  reimbursementMultipliers: {
    70: number;
    80: number;
    90: number;
  };
  yearlyLimitMultipliers: {
    2500: number;
    5000: number;
    10000: number;
  };
  waitingPeriodDays: number;
  badges: string[];
  highlights: string[];
  exclusions: string[];
  sampleCosts: {
    consultation: { cost: number; reimbursement: number };
    xray: { cost: number; reimbursement: number };
    surgery: { cost: number; reimbursement: number };
  };
}

export interface CalculatedQuote {
  provider: Provider;
  monthlyPremium: number;
  yearlyPremium: number;
  breakdown: {
    base: number;
    coverage: number;
    addOns: number;
    deductible: number;
    reimbursement: number;
    yearlyLimit: number;
    age: number;
    breed: number;
    location: number;
  };
}
