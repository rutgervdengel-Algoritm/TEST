'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { QuoteFormData } from '@/lib/types';
import { calculateAllQuotes, sortQuotes } from '@/lib/petPricing';
import { Filters, FilterState } from '@/components/pet/Filters';
import { ResultCard } from '@/components/pet/ResultCard';
import { YourDataCard } from '@/components/pet/YourDataCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Parse query params to formData
  const formData: QuoteFormData = useMemo(() => ({
    petType: (searchParams.get('petType') as 'dog' | 'cat') || 'dog',
    petName: searchParams.get('petName') || undefined,
    breed: searchParams.get('breed') || '',
    age: parseInt(searchParams.get('age') || '3'),
    weightCategory: (searchParams.get('weightCategory') as any) || undefined,
    postalCode: searchParams.get('postalCode') || '',
    coverageType: (searchParams.get('coverageType') as any) || 'standard',
    deductible: parseInt(searchParams.get('deductible') || '100'),
    reimbursementPercentage: parseInt(searchParams.get('reimbursementPercentage') || '80'),
    yearlyLimit: parseInt(searchParams.get('yearlyLimit') || '5000'),
    dentalCare: searchParams.get('dentalCare') === 'true',
    physiotherapy: searchParams.get('physiotherapy') === 'true',
    travelCoverage: searchParams.get('travelCoverage') === 'true',
    email: searchParams.get('email') || undefined,
  }), [searchParams]);

  // Calculate quotes
  const allQuotes = useMemo(() => calculateAllQuotes(formData), [formData]);

  // Calculate price range
  const minPrice = useMemo(() => Math.floor(Math.min(...allQuotes.map((q) => q.monthlyPremium))), [allQuotes]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...allQuotes.map((q) => q.monthlyPremium))), [allQuotes]);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'popular',
    priceRange: [minPrice, maxPrice],
    deductibles: [],
    reimbursements: [],
    yearlyLimits: [],
    extras: {
      dentalCare: false,
      physiotherapy: false,
      travelCoverage: false,
    },
  });

  // Update price range when quotes change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [minPrice, maxPrice],
    }));
  }, [minPrice, maxPrice]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    let filtered = allQuotes.filter((quote) => {
      // Price range filter
      if (
        quote.monthlyPremium < filters.priceRange[0] ||
        quote.monthlyPremium > filters.priceRange[1]
      ) {
        return false;
      }

      // Deductible filter
      if (filters.deductibles.length > 0 && !filters.deductibles.includes(formData.deductible)) {
        return false;
      }

      // Reimbursement filter
      if (
        filters.reimbursements.length > 0 &&
        !filters.reimbursements.includes(formData.reimbursementPercentage)
      ) {
        return false;
      }

      // Yearly limit filter
      if (filters.yearlyLimits.length > 0 && !filters.yearlyLimits.includes(formData.yearlyLimit)) {
        return false;
      }

      return true;
    });

    return sortQuotes(filtered, filters.sortBy);
  }, [allQuotes, filters, formData.deductible, formData.reimbursementPercentage, formData.yearlyLimit]);

  const handleEditQuote = () => {
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`/pet/quote?${params.toString()}`);
  };

  const savings = useMemo(() => {
    if (filteredQuotes.length < 2) return 0;
    const prices = filteredQuotes.map((q) => q.yearlyPremium);
    return Math.max(...prices) - Math.min(...prices);
  }, [filteredQuotes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Aanbiedingen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background-secondary">
        {/* Header */}
        <header className="bg-white border-b border-border">
          <div className="max-w-container mx-auto px-4 py-6">
            <Link
              href="/pet/quote"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar aanvraag
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Resultaten voor jou
            </h1>

            {/* Tab - Independer style (only Aanbevolen) */}
            <div className="mb-4">
              <div className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-t-lg text-sm">
                Aanbevolen
                <span className="ml-2 text-xs opacity-90">De beste voor jou</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>
                Gebaseerd op: {formData.petType === 'dog' ? 'Hond' : 'Kat'}, {formData.breed},{' '}
                {formData.age} jaar, {formData.postalCode}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={handleEditQuote}
                className="p-0 h-auto text-primary hover:underline"
              >
                Wijzig gegevens
              </Button>
            </div>
          </div>
        </header>

        {/* Summary Banner */}
        {savings > 0 && (
          <div className="bg-accent/5 border-b border-accent/20">
            <div className="max-w-container mx-auto px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Je bespaart tot €{savings.toFixed(2)} per jaar door te vergelijken!
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-text-secondary cursor-help flex-shrink-0 mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Dit is het verschil tussen de goedkoopste en duurste aanbieding
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop Sticky */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-8">
                {/* Jouw gegevens card */}
                <YourDataCard formData={formData} onEdit={handleEditQuote} />

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-card p-6">
                  <Filters
                    filters={filters}
                    onFiltersChange={setFilters}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                  />
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {filteredQuotes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    Geen resultaten gevonden
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Probeer je filters aan te passen om meer resultaten te zien.
                  </p>
                  <Button onClick={() => setFilters({
                    sortBy: 'popular',
                    priceRange: [minPrice, maxPrice],
                    deductibles: [],
                    reimbursements: [],
                    yearlyLimits: [],
                    extras: {
                      dentalCare: false,
                      physiotherapy: false,
                      travelCoverage: false,
                    },
                  })}>
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredQuotes.map((quote) => (
                    <ResultCard key={quote.provider.id} quote={quote} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-white mt-12">
          <div className="max-w-container mx-auto px-4 py-8">
            <div className="text-center space-y-4">
              <p className="text-sm text-text-secondary">
                Alle prijzen zijn indicatief en exclusief eventuele kortingen. De definitieve
                premie wordt door de verzekeraar vastgesteld.
              </p>
              <p className="text-sm text-text-secondary">
                Deze vergelijking is onafhankelijk en transparant. We ontvangen geen vergoeding
                van verzekeraars voor het tonen van hun aanbiedingen.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-secondary flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Laden...</p>
          </div>
        </div>
      }
    >
      <ResultsPageContent />
    </Suspense>
  );
}
