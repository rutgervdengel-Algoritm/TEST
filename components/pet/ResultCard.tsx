'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalculatedQuote } from '@/lib/types';
import { Check, ExternalLink } from 'lucide-react';
import { ProviderDetail } from './ProviderDetail';

interface ResultCardProps {
  quote: CalculatedQuote;
}

export function ResultCard({ quote }: ResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { provider, monthlyPremium, yearlyPremium } = quote;

  const getBadgeColor = (badge: string) => {
    if (badge.includes('Aanrader') || badge.includes('Laagste')) {
      return 'bg-accent/10 text-accent border-accent/20';
    }
    if (badge.includes('Populair')) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    if (badge.includes('Beste')) {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-6 border border-border">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {provider.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {provider.badges.map((badge, index) => (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getBadgeColor(
                    badge
                  )}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Premium */}
        <div className="bg-background-secondary rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary">
              €{monthlyPremium.toFixed(2)}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              per maand
            </div>
            <div className="text-xs text-text-secondary mt-0.5">
              €{yearlyPremium.toFixed(2)} per jaar
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-6">
          <ul className="space-y-2">
            {provider.highlights.slice(0, 4).map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Details Link */}
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(true)}
            className="text-sm text-primary hover:underline font-medium"
          >
            Bekijk details
          </button>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button className="w-full" size="lg">
            Ga verder
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
            size="sm"
          >
            <span>Polisvoorwaarden</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <ProviderDetail quote={quote} open={showDetails} onOpenChange={setShowDetails} />
    </>
  );
}
