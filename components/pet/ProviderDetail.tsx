'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalculatedQuote } from '@/lib/types';
import { Check } from 'lucide-react';

interface ProviderDetailProps {
  quote: CalculatedQuote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderDetail({ quote, open, onOpenChange }: ProviderDetailProps) {
  const { provider, monthlyPremium, yearlyPremium, breakdown } = quote;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{provider.name}</DialogTitle>
          <DialogDescription>
            Bekijk alle details van deze huisdierenverzekering
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="coverage" className="flex-1">
              Vergoedingen
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex-1">
              Voorwaarden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Premium */}
            <div className="bg-background-secondary p-6 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-text-primary">
                  €{monthlyPremium.toFixed(2)}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  per maand (€{yearlyPremium.toFixed(2)} per jaar)
                </div>
              </div>
            </div>

            {/* Premium Breakdown */}
            <div>
              <h4 className="font-semibold text-text-primary mb-3">Premie opbouw</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Basispremie</span>
                  <span className="font-medium">€{breakdown.base.toFixed(2)}</span>
                </div>
                {breakdown.coverage !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Dekking aanpassing</span>
                    <span className="font-medium">€{breakdown.coverage.toFixed(2)}</span>
                  </div>
                )}
                {breakdown.addOns > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Extra opties</span>
                    <span className="font-medium">€{breakdown.addOns.toFixed(2)}</span>
                  </div>
                )}
                {breakdown.age !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Leeftijd aanpassing</span>
                    <span className="font-medium">
                      €{breakdown.age.toFixed(2)}
                    </span>
                  </div>
                )}
                {breakdown.breed !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ras aanpassing</span>
                    <span className="font-medium">€{breakdown.breed.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h4 className="font-semibold text-text-primary mb-3">Kenmerken</h4>
              <ul className="space-y-2">
                {provider.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-4 space-y-3">
              <Button className="w-full" size="lg">
                Kies deze verzekering
              </Button>
              <Button variant="secondary" className="w-full">
                Bewaar voor later
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-6">
            <div>
              <h4 className="font-semibold text-text-primary mb-4">
                Voorbeeldkosten en vergoedingen
              </h4>
              <p className="text-sm text-text-secondary mb-4">
                Deze bedragen zijn indicatief en kunnen variëren per dierenarts en situatie.
              </p>

              <div className="space-y-3">
                <div className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-text-primary">
                        Dierenarts consult
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        Standaard consult bij dierenarts
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">
                        Kosten: €{provider.sampleCosts.consultation.cost}
                      </div>
                      <div className="font-medium text-accent">
                        Vergoeding: €{provider.sampleCosts.consultation.reimbursement}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-text-primary">Röntgenfoto</div>
                      <div className="text-sm text-text-secondary mt-1">
                        Diagnostische röntgenopname
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">
                        Kosten: €{provider.sampleCosts.xray.cost}
                      </div>
                      <div className="font-medium text-accent">
                        Vergoeding: €{provider.sampleCosts.xray.reimbursement}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-text-primary">Operatie</div>
                      <div className="text-sm text-text-secondary mt-1">
                        Standaard chirurgische ingreep
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">
                        Kosten: €{provider.sampleCosts.surgery.cost}
                      </div>
                      <div className="font-medium text-accent">
                        Vergoeding: €{provider.sampleCosts.surgery.reimbursement}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-6">
            <div>
              <h4 className="font-semibold text-text-primary mb-3">Wachttijd</h4>
              <p className="text-sm text-text-secondary">
                {provider.waitingPeriodDays} dagen na aanvang van de verzekering voordat je
                aanspraak kunt maken op vergoedingen voor ziektes. Voor ongevallen geldt
                meestal geen wachttijd.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-text-primary mb-3">Uitsluitingen</h4>
              <ul className="space-y-2">
                {provider.exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="text-text-secondary">{exclusion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-semibold text-text-primary mb-3">Voorwaarden</h4>
              <div className="space-y-3 text-sm text-text-secondary">
                <p>
                  De volledige polisvoorwaarden zijn beschikbaar op de website van de
                  verzekeraar. Lees deze zorgvuldig door voordat je een verzekering
                  afsluit.
                </p>
                <Button variant="link" className="p-0 h-auto">
                  Download polisvoorwaarden (PDF)
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
