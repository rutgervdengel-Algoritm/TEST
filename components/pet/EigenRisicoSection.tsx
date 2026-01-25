'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EigenRisicoSectionProps {
  selectedDeductible: number;
  onDeductibleChange: (value: number) => void;
}

export function EigenRisicoSection({ selectedDeductible, onDeductibleChange }: EigenRisicoSectionProps) {
  const [showMore, setShowMore] = useState(false);

  const deductibleOptions = [
    { value: 0, label: '€ 385', subtext: 'Geen korting' },
    { value: 100, label: '€ 585', subtext: 'Tot € 102 korting' },
    { value: 250, label: '€ 885', subtext: 'Tot € 264 korting' },
  ];

  const visibleOptions = showMore ? deductibleOptions : deductibleOptions.slice(0, 2);

  return (
    <div className="bg-white rounded-card shadow-card p-5 mb-6">
      <div className="mb-4">
        <h3 className="font-bold text-text-primary mb-1">Eigen risico</h3>
        <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary">
          <span>?</span>
          <span>Dit is het deel dat je zelf meebetaalt aan de zorg die door je huisdier ontvangt.</span>
        </button>
      </div>

      <div className="space-y-2">
        {visibleOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDeductible === option.value
                ? 'border-success bg-success/5'
                : 'border-border hover:bg-background-secondary'
            }`}
          >
            <input
              type="radio"
              name="deductible"
              value={option.value}
              checked={selectedDeductible === option.value}
              onChange={() => onDeductibleChange(option.value)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedDeductible === option.value
                ? 'border-success'
                : 'border-border'
            }`}>
              {selectedDeductible === option.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{option.label}</div>
              <div className="text-xs text-text-secondary">{option.subtext}</div>
            </div>
          </label>
        ))}
      </div>

      {!showMore && deductibleOptions.length > 2 && (
        <button
          onClick={() => setShowMore(true)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 font-medium"
        >
          <span className="text-lg">+</span>
          <span>Meer opties</span>
        </button>
      )}

      {showMore && (
        <button
          onClick={() => setShowMore(false)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 font-medium"
        >
          <ChevronUp className="w-4 h-4" />
          <span>Minder opties</span>
        </button>
      )}
    </div>
  );
}
