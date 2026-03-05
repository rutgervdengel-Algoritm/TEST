'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    badge: 'GRATIS VOOR OUDERS',
    name: 'Ouder',
    price: '0',
    subtitle: 'altijd gratis',
    color: 'secondary' as const,
    features: [
      'Onbeperkt inschrijvingen beheren',
      'Real-time positie op wachtlijsten',
      'Geautomatiseerde emails naar opvang',
      'Push-notificaties bij statuswijziging',
      'Dashboard met alle wachtlijsten',
    ],
    cta: 'Gratis Aanmelden',
    ctaStyle: 'secondary' as const,
    popular: false,
  },
  {
    badge: 'MEEST GEKOZEN',
    name: 'Basis',
    price: '79',
    subtitle: 'per maand',
    color: 'primary' as const,
    features: [
      'Onbeperkt locaties',
      'Tot 100 wachtlijstplaatsen',
      'Geavanceerde matching',
      'Analytics dashboard',
      'Ontvang automatische ouder-emails',
      'Priority email support',
      'Excel import',
    ],
    cta: 'Start 14 dagen gratis',
    ctaStyle: 'primary' as const,
    popular: true,
  },
  {
    badge: 'VOOR GROTERE ORGANISATIES',
    name: 'Pro',
    price: '149',
    subtitle: 'per maand',
    color: 'primary' as const,
    features: [
      'Alles van Basis, plus:',
      'Tot 300 wachtlijstplaatsen',
      'Voorspellende analytics',
      'API toegang',
      'Dedicated account manager',
      'Telefonische support',
      'Custom integraties',
    ],
    cta: 'Neem contact op',
    ctaStyle: 'outline' as const,
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            Transparante prijzen
          </h2>
          <p className="text-lg text-navy-500">
            Gratis voor ouders. Betaalbaar voor opvangorganisaties.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.popular
                  ? 'border-2 border-primary-500 shadow-md bg-white'
                  : plan.color === 'secondary'
                  ? 'border-2 border-secondary-200 bg-secondary-50/30'
                  : 'border-2 border-navy-200 bg-white'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-px -right-px bg-primary-600 text-white px-3 py-1 rounded-bl-xl rounded-tr-2xl text-xs font-semibold">
                  {plan.badge}
                </span>
              )}

              {!plan.popular && (
                <span
                  className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-4 ${
                    plan.color === 'secondary'
                      ? 'bg-secondary-100 text-secondary-700'
                      : 'bg-navy-100 text-navy-600'
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <h3 className="text-2xl font-bold text-navy-900">{plan.name}</h3>
              <div className="mt-4">
                <span
                  className={`text-5xl font-bold ${
                    plan.popular
                      ? 'text-primary-600'
                      : plan.color === 'secondary'
                      ? 'text-secondary-500'
                      : 'text-navy-900'
                  }`}
                >
                  &euro;{plan.price}
                </span>
              </div>
              <p className="text-sm text-navy-500 mt-2">{plan.subtitle}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      size={18}
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.color === 'secondary'
                          ? 'text-secondary-500'
                          : 'text-primary-500'
                      }`}
                    />
                    <span className="text-sm text-navy-600">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 block w-full text-center px-4 py-3 font-semibold rounded-lg transition-all ${
                  plan.ctaStyle === 'primary'
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                    : plan.ctaStyle === 'secondary'
                    ? 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm hover:shadow-md'
                    : 'border border-navy-300 text-navy-700 hover:bg-navy-50'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Trust items */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 text-sm text-navy-500">
          {[
            '14 dagen gratis trial op betaalde plannen',
            'Geen creditcard nodig voor trial',
            'Opzeggen wanneer je wilt',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check size={16} className="text-primary-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
