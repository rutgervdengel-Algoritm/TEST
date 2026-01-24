'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export interface FilterState {
  sortBy: 'popular' | 'cheapest' | 'best-coverage';
  priceRange: [number, number];
  deductibles: number[];
  reimbursements: number[];
  yearlyLimits: number[];
  extras: {
    dentalCare: boolean;
    physiotherapy: boolean;
    travelCoverage: boolean;
  };
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  minPrice: number;
  maxPrice: number;
}

export function Filters({ filters, onFiltersChange, minPrice, maxPrice }: FiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
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
  };

  const toggleDeductible = (value: number) => {
    const newDeductibles = filters.deductibles.includes(value)
      ? filters.deductibles.filter((d) => d !== value)
      : [...filters.deductibles, value];
    updateFilter('deductibles', newDeductibles);
  };

  const toggleReimbursement = (value: number) => {
    const newReimbursements = filters.reimbursements.includes(value)
      ? filters.reimbursements.filter((r) => r !== value)
      : [...filters.reimbursements, value];
    updateFilter('reimbursements', newReimbursements);
  };

  const toggleYearlyLimit = (value: number) => {
    const newLimits = filters.yearlyLimits.includes(value)
      ? filters.yearlyLimits.filter((l) => l !== value)
      : [...filters.yearlyLimits, value];
    updateFilter('yearlyLimits', newLimits);
  };

  const hasActiveFilters =
    filters.deductibles.length > 0 ||
    filters.reimbursements.length > 0 ||
    filters.yearlyLimits.length > 0 ||
    filters.extras.dentalCare ||
    filters.extras.physiotherapy ||
    filters.extras.travelCoverage ||
    filters.priceRange[0] !== minPrice ||
    filters.priceRange[1] !== maxPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label htmlFor="sort">Sorteren</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: any) => updateFilter('sortBy', value)}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Meest gekozen</SelectItem>
            <SelectItem value="cheapest">Laagste premie</SelectItem>
            <SelectItem value="best-coverage">Beste dekking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border pt-4" />

      {/* Price Range */}
      <div className="space-y-3">
        <Label>
          Premie per maand: €{filters.priceRange[0]} - €{filters.priceRange[1]}
        </Label>
        <Slider
          min={minPrice}
          max={maxPrice}
          step={1}
          value={filters.priceRange}
          onValueChange={(value: number[]) => updateFilter('priceRange', value as [number, number])}
          className="py-4"
        />
      </div>

      <div className="border-t border-border pt-4" />

      {/* Deductible */}
      <div className="space-y-3">
        <Label>Eigen risico</Label>
        <div className="space-y-2">
          {[0, 100, 250].map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`deductible-${value}`}
                checked={filters.deductibles.includes(value)}
                onCheckedChange={() => toggleDeductible(value)}
              />
              <Label
                htmlFor={`deductible-${value}`}
                className="font-normal cursor-pointer"
              >
                €{value}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4" />

      {/* Reimbursement Percentage */}
      <div className="space-y-3">
        <Label>Vergoeding percentage</Label>
        <div className="space-y-2">
          {[70, 80, 90].map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`reimbursement-${value}`}
                checked={filters.reimbursements.includes(value)}
                onCheckedChange={() => toggleReimbursement(value)}
              />
              <Label
                htmlFor={`reimbursement-${value}`}
                className="font-normal cursor-pointer"
              >
                {value}%
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4" />

      {/* Yearly Limit */}
      <div className="space-y-3">
        <Label>Jaarlimiet</Label>
        <div className="space-y-2">
          {[2500, 5000, 10000].map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`limit-${value}`}
                checked={filters.yearlyLimits.includes(value)}
                onCheckedChange={() => toggleYearlyLimit(value)}
              />
              <Label htmlFor={`limit-${value}`} className="font-normal cursor-pointer">
                €{value.toLocaleString('nl-NL')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4" />

      {/* Extras */}
      <div className="space-y-3">
        <Label>Extra opties</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-dental"
              checked={filters.extras.dentalCare}
              onCheckedChange={(checked) =>
                updateFilter('extras', { ...filters.extras, dentalCare: checked as boolean })
              }
            />
            <Label htmlFor="filter-dental" className="font-normal cursor-pointer">
              Gebitszorg
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-physio"
              checked={filters.extras.physiotherapy}
              onCheckedChange={(checked) =>
                updateFilter('extras', { ...filters.extras, physiotherapy: checked as boolean })
              }
            />
            <Label htmlFor="filter-physio" className="font-normal cursor-pointer">
              Fysiotherapie
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-travel"
              checked={filters.extras.travelCoverage}
              onCheckedChange={(checked) =>
                updateFilter('extras', { ...filters.extras, travelCoverage: checked as boolean })
              }
            />
            <Label htmlFor="filter-travel" className="font-normal cursor-pointer">
              Reizen/Europa
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4" />

      {/* Help Link */}
      <div>
        <a
          href="#"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          Waar moet ik op letten?
        </a>
      </div>
    </div>
  );
}
