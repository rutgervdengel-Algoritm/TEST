import { QuoteForm } from '@/components/pet/QuoteForm';
import { Clock, ShieldCheck, Lock } from 'lucide-react';
import { Suspense } from 'react';

function QuotePageContent() {
  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-container mx-auto px-4 py-6">
          <nav className="text-sm text-text-secondary mb-4">
            <span>Huisdierenverzekering</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-3">
            Vergelijk huisdierenverzekeringen
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl">
            Krijg direct 3 aanbiedingen. Transparant en zonder gedoe.
          </p>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-white border-b border-border">
        <div className="max-w-container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Binnen 1 minuut</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Direct 3 persoonlijke aanbiedingen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Geen verplichting</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Vrijblijvend vergelijken en kiezen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">
                  Jouw gegevens blijven van jou
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  We delen je informatie niet met derden
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
            <QuoteForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-12">
        <div className="max-w-container mx-auto px-4 py-8">
          <p className="text-sm text-text-secondary text-center">
            Door een offerte aan te vragen ga je akkoord met onze algemene voorwaarden en
            privacy policy.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <QuotePageContent />
    </Suspense>
  );
}
