'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalculatedQuote } from '@/lib/types';
import { Check, Info as InfoIcon } from 'lucide-react';
import { ProviderDetail } from './ProviderDetail';

interface ResultCardProps {
  quote: CalculatedQuote;
}

export function ResultCard({ quote }: ResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { provider, monthlyPremium, yearlyPremium } = quote;

  // Determine top badge based on provider badges
  const getTopBadge = () => {
    if (provider.badges.includes('Aanrader')) {
      return 'Goedkoopste en beste keuze';
    }
    if (provider.badges.includes('Beste dekking')) {
      return 'Beste met ruime vergoeding';
    }
    if (provider.badges.includes('Populair')) {
      return 'Hoge app waardering';
    }
    return null;
  };

  const topBadge = getTopBadge();

  // Get provider parent company (mock data)
  const getProviderInfo = () => {
    const infoMap: Record<string, string> = {
      'OHRA': 'OHRA is een verzekeringsmaatschappij van Achmea',
      'Figo Pet': 'Figo Pet is een gespecialiseerde dierenverzekering',
      'Univé': 'Univé is een coöperatieve verzekeraar',
    };
    return infoMap[provider.name] || '';
  };

  return (
    <>
      <div className="relative">
        {/* Top Badge - Outside card */}
        {topBadge && (
          <div className="mb-2">
            <span className="inline-block px-3 py-1.5 text-xs font-semibold rounded-md bg-badge-blue text-badge-blue-dark">
              {topBadge}
            </span>
          </div>
        )}

        <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-all border border-border relative">
          {/* Vergelijk checkbox - Top Left */}
          <div className="absolute top-4 left-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-text-secondary">Vergelijk</span>
            </label>
          </div>

          <div className="p-6 pt-12">
            {/* 2-Column Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

              {/* LEFT COLUMN - Provider Info */}
              <div className="flex-1 space-y-4">
                {/* Logo + Name */}
                <div className="flex items-start gap-3">
                  {provider.logo && (
                    <div className="text-4xl flex-shrink-0">{provider.logo}</div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">
                      {provider.name}
                    </h3>
                  </div>
                </div>

                {/* Star Rating */}
                {provider.rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-sm">⭐</span>
                    <span className="font-bold text-text-primary">{provider.rating}</span>
                    {provider.reviewCount && (
                      <span className="text-xs text-text-secondary">({provider.reviewCount})</span>
                    )}
                  </div>
                )}

                {/* Info Items - Text format like Independer */}
                <div className="space-y-2 text-sm">
                  {provider.highlights.slice(0, 3).map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-text-secondary">
                        {highlight.includes(':') ? (
                          <>
                            {highlight.split(':')[0]}:{' '}
                            <span className="font-semibold text-text-primary underline decoration-success decoration-2">
                              {highlight.split(':')[1]?.trim()}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-text-primary underline decoration-success decoration-2">
                            {highlight}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}

                  {/* App Rating as text item */}
                  {provider.rating && (
                    <div className="text-text-secondary text-sm">
                      App waardering:{' '}
                      <span className="font-semibold text-text-primary underline decoration-success decoration-2">
                        {provider.rating} / 5
                      </span>
                    </div>
                  )}
                </div>

                {/* Provider Info Line */}
                {getProviderInfo() && (
                  <div className="flex items-start gap-2 bg-badge-blue/30 rounded-md p-2 text-xs">
                    <InfoIcon className="w-3 h-3 text-badge-blue-dark mt-0.5 flex-shrink-0" />
                    <span className="text-badge-blue-dark">{getProviderInfo()}</span>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Price + Buttons */}
              <div className="lg:w-64 flex-shrink-0 space-y-4">
                {/* Price Display */}
                <div className="text-right lg:text-right">
                  <div className="text-4xl lg:text-5xl font-extrabold text-text-primary leading-none">
                    €{monthlyPremium.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-1">
                    per maand
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowDetails(true)}
                  >
                    + Meer info
                  </Button>
                  <Button className="w-full" size="lg">
                    Vraag aan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProviderDetail quote={quote} open={showDetails} onOpenChange={setShowDetails} />
    </>
  );
}
