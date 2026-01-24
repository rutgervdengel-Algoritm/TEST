'use client';

import { QuoteFormData } from '@/lib/types';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YourDataCardProps {
  formData: QuoteFormData;
  onEdit: () => void;
}

export function YourDataCard({ formData, onEdit }: YourDataCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-text-primary">Jouw gegevens</h3>
        <button
          onClick={onEdit}
          className="text-primary hover:text-primary-600 transition-colors"
          aria-label="Wijzig gegevens"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5 text-sm">
        {/* Pet info */}
        <div className="flex items-center gap-2">
          <span className="text-text-primary">🐾</span>
          <span className="text-text-secondary">
            {formData.petType === 'dog' ? 'Hond' : 'Kat'}, {formData.breed}, {formData.age} jaar
          </span>
        </div>

        {/* Postcode */}
        <div className="flex items-center gap-2">
          <span className="text-text-primary">📍</span>
          <span className="text-text-secondary">{formData.postalCode}</span>
        </div>
      </div>

      {/* Bewaar voor later button */}
      <Button
        variant="secondary"
        className="w-full mt-4"
        size="sm"
      >
        ♥ Bewaar voor later
      </Button>
    </div>
  );
}
