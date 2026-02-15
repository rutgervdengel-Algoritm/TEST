'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    badge: 'PERFECT OM TE TESTEN',
    name: 'Gratis',
    price: '0',
    subtitle: 'per maand, altijd',
    features: [
      '1 locatie',
      'Tot 25 wachtlijstplaatsen',
      'Basis matching',
      'Email support',
    ],
    cta: 'Start Gratis',
    ctaStyle: 'secondary' as const,
    popular: false,
  },
  {
    badge: 'MEEST GEKOZEN',
    name: 'Basis',
    price: '79',
    subtitle: 'per maand',
    features: [
      'Onbeperkt locaties',
      'Tot 100 wachtlijstplaatsen',
      'Geavanceerde matching',
      'Analytics dashboard',
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
    ctaStyle: 'secondary' as const,
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparante prijzen
          </h2>
          <p className="text-gray-600">Net als onze wachtlijsten</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-md p-8 transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.popular
                  ? 'border-2 border-primary-500 shadow-md'
                  : 'border-2 border-gray-200'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-px -right-px bg-primary-500 text-white px-3 py-1 rounded-bl-md rounded-tr-md text-xs font-semibold">
                  {plan.badge}
                </span>
              )}

              {/* Non-popular badge */}
              {!plan.popular && (
                <span className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded mb-4">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span
                  className={`text-5xl font-bold ${
                    plan.popular ? 'text-primary-600' : 'text-gray-900'
                  }`}
                >
                  &euro;{plan.price}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{plan.subtitle}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      size={18}
                      className="text-success-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-sm text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 block w-full text-center px-4 py-3 font-medium rounded-md transition-colors ${
                  plan.ctaStyle === 'primary'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Trust items */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 text-sm text-gray-600">
          {[
            '14 dagen gratis trial op alle plannen',
            'Geen creditcard nodig voor trial',
            'Opzeggen wanneer je wilt',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check size={16} className="text-success-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
