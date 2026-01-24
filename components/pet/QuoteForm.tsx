'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { dogBreeds, catBreeds } from '@/lib/petProviders';
import { QuoteFormData, PetType, CoverageType } from '@/lib/types';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuoteFormProps {
  initialData?: Partial<QuoteFormData>;
}

export function QuoteForm({ initialData }: QuoteFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<QuoteFormData>({
    petType: initialData?.petType || 'dog',
    petName: initialData?.petName || '',
    breed: initialData?.breed || '',
    age: initialData?.age || 3,
    weightCategory: initialData?.weightCategory || 'M',
    postalCode: initialData?.postalCode || '',
    coverageType: initialData?.coverageType || 'standard',
    deductible: initialData?.deductible || 100,
    reimbursementPercentage: initialData?.reimbursementPercentage || 80,
    yearlyLimit: initialData?.yearlyLimit || 5000,
    dentalCare: initialData?.dentalCare || false,
    physiotherapy: initialData?.physiotherapy || false,
    travelCoverage: initialData?.travelCoverage || false,
    email: initialData?.email || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.breed) {
      newErrors.breed = 'Selecteer een ras';
    }

    if (!formData.postalCode || !/^\d{4}[A-Z]{2}$/i.test(formData.postalCode)) {
      newErrors.postalCode = 'Voer een geldige postcode in (bijv. 1234AB)';
    }

    if (!formData.age || formData.age < 0 || formData.age > 20) {
      newErrors.age = 'Voer een geldige leeftijd in (0-20 jaar)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create URL params
    const params = new URLSearchParams({
      petType: formData.petType,
      breed: formData.breed,
      age: formData.age.toString(),
      postalCode: formData.postalCode.toUpperCase(),
      coverageType: formData.coverageType,
      deductible: formData.deductible.toString(),
      reimbursementPercentage: formData.reimbursementPercentage.toString(),
      yearlyLimit: formData.yearlyLimit.toString(),
      dentalCare: formData.dentalCare.toString(),
      physiotherapy: formData.physiotherapy.toString(),
      travelCoverage: formData.travelCoverage.toString(),
    });

    if (formData.petName) params.set('petName', formData.petName);
    if (formData.weightCategory) params.set('weightCategory', formData.weightCategory);
    if (formData.email) params.set('email', formData.email);

    router.push(`/pet/results?${params.toString()}`);
  };

  const breeds = formData.petType === 'dog' ? dogBreeds : catBreeds;

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Huisdier */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Over je huisdier</h3>
          </div>

          {/* Pet Type */}
          <div className="space-y-3">
            <Label>Type huisdier</Label>
            <RadioGroup
              value={formData.petType}
              onValueChange={(value: PetType) => {
                setFormData({ ...formData, petType: value, breed: '' });
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dog" id="dog" />
                <Label htmlFor="dog" className="cursor-pointer font-normal">
                  Hond
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cat" id="cat" />
                <Label htmlFor="cat" className="cursor-pointer font-normal">
                  Kat
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Pet Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="petName">Naam (optioneel)</Label>
            <Input
              id="petName"
              type="text"
              placeholder="Naam van je huisdier"
              value={formData.petName}
              onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
            />
          </div>

          {/* Breed */}
          <div className="space-y-2">
            <Label htmlFor="breed">Ras *</Label>
            <Select
              value={formData.breed}
              onValueChange={(value) => setFormData({ ...formData, breed: value })}
            >
              <SelectTrigger id="breed" className={errors.breed ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecteer een ras" />
              </SelectTrigger>
              <SelectContent>
                {breeds.map((breed) => (
                  <SelectItem key={breed} value={breed}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.breed && <p className="text-sm text-red-500">{errors.breed}</p>}
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Leeftijd (in jaren) *</Label>
            <Input
              id="age"
              type="number"
              min="0"
              max="20"
              placeholder="3"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              className={errors.age ? 'border-red-500' : ''}
            />
            {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
          </div>

          {/* Weight Category (only for dogs) */}
          {formData.petType === 'dog' && (
            <div className="space-y-2">
              <Label htmlFor="weight">Gewichtscategorie</Label>
              <Select
                value={formData.weightCategory}
                onValueChange={(value: any) => setFormData({ ...formData, weightCategory: value })}
              >
                <SelectTrigger id="weight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Klein (tot 10 kg)</SelectItem>
                  <SelectItem value="M">Middel (10-25 kg)</SelectItem>
                  <SelectItem value="L">Groot (25+ kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Section 2: Woonplaats */}
        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-text-primary">Woonplaats</h3>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Postcode *</Label>
            <Input
              id="postalCode"
              type="text"
              placeholder="1234AB"
              maxLength={6}
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value.toUpperCase() })
              }
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
          </div>
        </div>

        {/* Section 3: Dekking */}
        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-text-primary">Dekking</h3>

          {/* Coverage Type */}
          <div className="space-y-3">
            <Label>Dekkingstype</Label>
            <RadioGroup
              value={formData.coverageType}
              onValueChange={(value: CoverageType) =>
                setFormData({ ...formData, coverageType: value })
              }
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-background-secondary transition-colors cursor-pointer">
                <RadioGroupItem value="basic" id="basic" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="basic" className="cursor-pointer font-medium">
                    Basis
                  </Label>
                  <p className="text-sm text-text-secondary mt-1">Dekking voor ongevallen</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-background-secondary transition-colors cursor-pointer">
                <RadioGroupItem value="standard" id="standard" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="standard" className="cursor-pointer font-medium">
                    Standaard
                  </Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Ongevallen + ziektekosten
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border border-border rounded-lg hover:bg-background-secondary transition-colors cursor-pointer">
                <RadioGroupItem value="plus" id="plus" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="plus" className="cursor-pointer font-medium">
                    Plus
                  </Label>
                  <p className="text-sm text-text-secondary mt-1">
                    Alles van Standaard + uitgebreide aanvullingen
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Deductible */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="deductible">Eigen risico</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-text-secondary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Het bedrag dat je zelf betaalt voordat de verzekering uitkeert
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.deductible.toString()}
              onValueChange={(value) => setFormData({ ...formData, deductible: parseInt(value) })}
            >
              <SelectTrigger id="deductible">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">€0</SelectItem>
                <SelectItem value="100">€100</SelectItem>
                <SelectItem value="250">€250</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reimbursement Percentage */}
          <div className="space-y-2">
            <Label htmlFor="reimbursement">Vergoedingspercentage</Label>
            <Select
              value={formData.reimbursementPercentage.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, reimbursementPercentage: parseInt(value) })
              }
            >
              <SelectTrigger id="reimbursement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Yearly Limit */}
          <div className="space-y-2">
            <Label htmlFor="yearlyLimit">Jaarlimiet</Label>
            <Select
              value={formData.yearlyLimit.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, yearlyLimit: parseInt(value) })
              }
            >
              <SelectTrigger id="yearlyLimit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2500">€2.500</SelectItem>
                <SelectItem value="5000">€5.000</SelectItem>
                <SelectItem value="10000">€10.000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section 4: Extra's */}
        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-text-primary">Extra opties</h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="dental"
                checked={formData.dentalCare}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, dentalCare: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="dental" className="cursor-pointer font-medium">
                  Gebitszorg
                </Label>
                <p className="text-sm text-text-secondary mt-1">
                  Dekking voor tandheelkundige behandelingen
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="physio"
                checked={formData.physiotherapy}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, physiotherapy: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="physio" className="cursor-pointer font-medium">
                  Fysiotherapie
                </Label>
                <p className="text-sm text-text-secondary mt-1">
                  Dekking voor fysiotherapeutische behandelingen
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="travel"
                checked={formData.travelCoverage}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, travelCoverage: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="travel" className="cursor-pointer font-medium">
                  Reizen/Europa dekking
                </Label>
                <p className="text-sm text-text-secondary mt-1">
                  Dekking tijdens vakanties in Europa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Contact (optional) */}
        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-text-primary">Contact (optioneel)</h3>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="jouw@email.nl"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <p className="text-xs text-text-secondary">
              Alleen voor het opslaan van je vergelijking. We delen je gegevens niet.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 flex flex-col sm:flex-row gap-4">
          <Button type="submit" size="lg" className="flex-1 sm:flex-initial">
            Bekijk 3 aanbiedingen
          </Button>
          <Button type="button" variant="ghost" size="lg" className="sm:flex-initial">
            Hoe werkt vergelijken?
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
}
