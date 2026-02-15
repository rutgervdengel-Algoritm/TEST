'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Hoe lang duurt het om te implementeren?',
    a: 'Gemiddeld 5 minuten. Je importeert je bestaande Excel lijst (of voegt handmatig toe), stelt je prioriteitsregels in, en je bent klaar. We helpen graag bij de eerste setup.',
  },
  {
    q: 'Moeten ouders een app downloaden?',
    a: 'Nee. Ouders krijgen een unieke toegangscode en gebruiken gewoon hun browser. Werkt op elke telefoon, tablet of computer. Geen downloads of accounts nodig.',
  },
  {
    q: 'Wat als het niet voor ons werkt?',
    a: 'Probeer 14 dagen gratis, zonder creditcard. Bevalt het niet? Opzeggen met 1 klik. Geen vragen, geen kleine lettertjes.',
  },
  {
    q: 'Is onze data veilig?',
    a: 'Ja. AVG-compliant, gehost in EU (AWS Frankfurt), versleutelde opslag, dagelijkse backups. We nemen privacy serieus.',
  },
  {
    q: 'Kunnen we onze huidige Excel lijst importeren?',
    a: 'Absoluut. Upload je Excel, wijs de kolommen toe (naam, datum inschrijving, etc.), en we importeren alles automatisch. Werkt in 99% van de gevallen.',
  },
  {
    q: 'Wat als ouders geen code invoeren?',
    a: 'Geen probleem. Jij beheert de wachtlijst zoals altijd. Het platform bespaart jou tijd. Als ouders hun code gebruiken, krijgen zij transparantie en bel jij minder. Win-win.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="contact" className="bg-gray-50 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
          Veelgestelde vragen
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-md shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-lg text-gray-900 pr-4">
                  {faq.q}
                </span>
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
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">
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
