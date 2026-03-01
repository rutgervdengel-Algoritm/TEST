'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Hoe lang duurt het om te implementeren?',
    a: 'Gemiddeld 5 minuten. Je importeert je bestaande Excel lijst (of voegt handmatig toe), stelt je prioriteitsregels in, en je bent klaar. We helpen graag bij de eerste setup.',
    audience: 'opvang',
  },
  {
    q: 'Is het echt gratis voor ouders?',
    a: 'Ja, WachtlijstHelderheid is volledig gratis voor ouders. Je kunt onbeperkt inschrijvingen beheren, automatische emails instellen en notificaties ontvangen. Geen verborgen kosten.',
    audience: 'ouders',
  },
  {
    q: 'Hoe werken de geautomatiseerde emails?',
    a: 'Als ouder stel je in hoe vaak je de opvang wilt laten weten dat je nog interesse hebt (maandelijks, per kwartaal, etc.). Het systeem verstuurt automatisch een nette email namens jou. De opvang ziet dit in hun dashboard.',
    audience: 'ouders',
  },
  {
    q: 'Moeten ouders een app downloaden?',
    a: 'Nee. Ouders krijgen een unieke toegangscode en gebruiken gewoon hun browser. Werkt op elke telefoon, tablet of computer. Geen downloads of accounts nodig.',
    audience: 'beide',
  },
  {
    q: 'Wat als het niet voor ons werkt?',
    a: 'Probeer 14 dagen gratis, zonder creditcard. Bevalt het niet? Opzeggen met 1 klik. Geen vragen, geen kleine lettertjes.',
    audience: 'opvang',
  },
  {
    q: 'Is onze data veilig?',
    a: 'Ja. AVG-compliant, gehost in de EU (AWS Frankfurt), versleutelde opslag, dagelijkse backups. We nemen privacy serieus — voor opvangorganisaties en ouders.',
    audience: 'beide',
  },
  {
    q: 'Kunnen we onze huidige Excel lijst importeren?',
    a: 'Absoluut. Upload je Excel, wijs de kolommen toe (naam, datum inschrijving, etc.), en we importeren alles automatisch. Werkt in 99% van de gevallen.',
    audience: 'opvang',
  },
  {
    q: 'Kan ik bij meerdere opvangen tegelijk op de wachtlijst staan?',
    a: 'Ja, je kunt je bij onbeperkt opvanglocaties inschrijven en alles vanuit een dashboard beheren. Het systeem stuurt naar elke locatie apart geautomatiseerde updates.',
    audience: 'ouders',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="bg-gray-50 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
          Veelgestelde vragen
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12">
          Antwoorden voor opvangorganisaties en ouders
        </p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3 pr-4">
                  {faq.audience === 'ouders' && (
                    <span className="flex-shrink-0 text-xs font-medium bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">
                      Ouders
                    </span>
                  )}
                  {faq.audience === 'opvang' && (
                    <span className="flex-shrink-0 text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      Opvang
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all ${
                  openIndex === i
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-5 pb-5 text-gray-600 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
