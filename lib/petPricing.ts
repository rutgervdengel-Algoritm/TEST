import { QuoteFormData, Provider, CalculatedQuote } from './types';
import { providers } from './petProviders';

// Age factor calculation
function getAgeFactor(age: number): number {
  if (age <= 1) return 0.9;
  if (age <= 6) return 1.0;
  if (age <= 10) return 1.25;
  return 1.6;
}

// Breed factor (some breeds are more expensive to insure)
function getBreedFactor(breed: string, petType: 'dog' | 'cat'): number {
  const highRiskDogBreeds = ['Bulldog', 'Rottweiler', 'Duitse Herder', 'Berner Sennenhond'];
  const highRiskCatBreeds = ['Maine Coon', 'Perzische Kat', 'Sphynx'];

  if (petType === 'dog' && highRiskDogBreeds.includes(breed)) {
    return 1.15;
  }
  if (petType === 'cat' && highRiskCatBreeds.includes(breed)) {
    return 1.1;
  }
  return 1.0;
}

// Location factor based on postal code (first 2 digits)
function getLocationFactor(postalCode: string): number {
  const prefix = parseInt(postalCode.substring(0, 2));

  // Urban areas (Amsterdam, Rotterdam, Den Haag) tend to have higher vet costs
  if ([10, 11, 12, 30, 25].includes(prefix)) {
    return 1.1;
  }
  // Rural areas
  if (prefix >= 97 || prefix <= 79) {
    return 0.95;
  }
  return 1.0;
}

export function calculateQuote(
  formData: QuoteFormData,
  provider: Provider
): CalculatedQuote {
  // Base premium
  const basePremium = formData.petType === 'dog'
    ? provider.basePremiumDog
    : provider.basePremiumCat;

  // Coverage multiplier
  const coverageMultiplier = provider.coverageMultipliers[formData.coverageType];

  // Add-ons
  let addOns = 0;
  if (formData.dentalCare) addOns += provider.addOnPrices.dentalCare;
  if (formData.physiotherapy) addOns += provider.addOnPrices.physiotherapy;
  if (formData.travelCoverage) addOns += provider.addOnPrices.travelCoverage;

  // Deductible discount
  const deductibleDiscount = provider.deductibleDiscounts[
    formData.deductible as keyof typeof provider.deductibleDiscounts
  ];

  // Reimbursement multiplier
  const reimbursementMultiplier = provider.reimbursementMultipliers[
    formData.reimbursementPercentage as keyof typeof provider.reimbursementMultipliers
  ];

  // Yearly limit multiplier
  const yearlyLimitMultiplier = provider.yearlyLimitMultipliers[
    formData.yearlyLimit as keyof typeof provider.yearlyLimitMultipliers
  ];

  // Age factor
  const ageFactor = getAgeFactor(formData.age);

  // Breed factor
  const breedFactor = getBreedFactor(formData.breed, formData.petType);

  // Location factor
  const locationFactor = getLocationFactor(formData.postalCode);

  // Calculate final premium
  const baseCost = basePremium;
  const coverageCost = basePremium * (coverageMultiplier - 1);
  const ageAdjustment = basePremium * (ageFactor - 1);
  const breedAdjustment = basePremium * (breedFactor - 1);
  const locationAdjustment = basePremium * (locationFactor - 1);

  let monthlyPremium = basePremium * coverageMultiplier * ageFactor * breedFactor * locationFactor;
  monthlyPremium = monthlyPremium * deductibleDiscount;
  monthlyPremium = monthlyPremium * reimbursementMultiplier;
  monthlyPremium = monthlyPremium * yearlyLimitMultiplier;
  monthlyPremium = monthlyPremium + addOns;

  // Round to 2 decimals
  monthlyPremium = Math.round(monthlyPremium * 100) / 100;
  const yearlyPremium = Math.round(monthlyPremium * 12 * 100) / 100;

  return {
    provider,
    monthlyPremium,
    yearlyPremium,
    breakdown: {
      base: baseCost,
      coverage: coverageCost,
      addOns,
      deductible: basePremium * (deductibleDiscount - 1),
      reimbursement: basePremium * (reimbursementMultiplier - 1),
      yearlyLimit: basePremium * (yearlyLimitMultiplier - 1),
      age: ageAdjustment,
      breed: breedAdjustment,
      location: locationAdjustment,
    },
  };
}

export function calculateAllQuotes(formData: QuoteFormData): CalculatedQuote[] {
  return providers.map(provider => calculateQuote(formData, provider));
}

export function sortQuotes(
  quotes: CalculatedQuote[],
  sortBy: 'popular' | 'cheapest' | 'best-coverage'
): CalculatedQuote[] {
  const sorted = [...quotes];

  switch (sortBy) {
    case 'cheapest':
      return sorted.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
    case 'best-coverage':
      // Sort by provider badges (best coverage first)
      return sorted.sort((a, b) => {
        const aScore = a.provider.badges.includes('Beste dekking') ? 1 : 0;
        const bScore = b.provider.badges.includes('Beste dekking') ? 1 : 0;
        return bScore - aScore;
      });
    case 'popular':
    default:
      // Keep original order but put "Populair" first
      return sorted.sort((a, b) => {
        const aScore = a.provider.badges.includes('Populair') ? 1 : 0;
        const bScore = b.provider.badges.includes('Populair') ? 1 : 0;
        return bScore - aScore;
      });
  }
}
