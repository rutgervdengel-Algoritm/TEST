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
      return 'bg-success/10 text-success border-success/20';
    }
    if (badge.includes('Populair')) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    if (badge.includes('Beste')) {
      return 'bg-primary/10 text-primary border-primary/20';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

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

        <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-all p-6 border border-border">
          {/* Header with logo and rating */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Logo */}
              {provider.logo && (
                <div className="text-4xl flex-shrink-0">{provider.logo}</div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  {provider.name}
                </h3>

                {/* Star Rating */}
                {provider.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-500 text-sm">⭐</span>
                    <span className="font-bold text-text-primary">{provider.rating}</span>
                    {provider.reviewCount && (
                      <span className="text-xs text-text-secondary">({provider.reviewCount})</span>
                    )}
                  </div>
                )}

                {/* Badges */}
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
          </div>

        {/* Premium - Independer style with LARGE number */}
        <div className="flex items-center justify-end mb-6">
          <div className="text-right">
            <div className="text-5xl font-extrabold text-text-primary leading-none">
              €{monthlyPremium.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              per maand
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-6">
          <ul className="space-y-2">
            {provider.highlights.slice(0, 4).map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-text-secondary">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Details Link */}
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(true)}
            className="text-sm text-primary hover:underline font-semibold"
          >
            + Meer info
          </button>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setShowDetails(true)}
            >
              + Meer info
            </Button>
            <Button className="flex-1" size="lg">
              Vraag aan
            </Button>
          </div>

          {/* Vergelijk checkbox - Independer style */}
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-text-secondary">Vergelijk</span>
          </label>
        </div>
      </div>
      </div>

      <ProviderDetail quote={quote} open={showDetails} onOpenChange={setShowDetails} />
    </>
  );
}
