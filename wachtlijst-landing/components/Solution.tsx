'use client';

import { ArrowRight, Upload, Eye, Zap, Mail, Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const opvangSteps = [
  {
    num: '1',
    icon: Upload,
    title: 'Importeer je lijst',
    description: 'Upload je Excel of voeg handmatig toe. Klaar in 5 minuten.',
  },
  {
    num: '2',
    icon: Eye,
    title: 'Ouders krijgen toegang',
    description: 'Elke inschrijving krijgt een unieke code. Real-time positie zichtbaar.',
  },
  {
    num: '3',
    icon: Zap,
    title: 'Automatisch matchen',
    description: 'Nieuwe plek? Systeem stelt beste matches voor. Accepteren met 1 klik.',
  },
];

const ouderSteps = [
  {
    num: '1',
    icon: Search,
    title: 'Schrijf je in',
    description: 'Meld je aan bij een of meerdere opvanglocaties. Direct overzicht.',
  },
  {
    num: '2',
    icon: Bell,
    title: 'Ontvang updates',
    description: 'Automatische notificaties bij elke statusverandering. Nooit meer bellen.',
  },
  {
    num: '3',
    icon: Mail,
    title: 'Stuur geautomatiseerde emails',
    description: 'Laat de opvang automatisch weten dat je nog behoefte hebt. Geen handmatig werk.',
  },
];

export default function Solution() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Zo simpel werkt het
          </h2>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            In 3 stappen naar volledige transparantie — voor opvang en ouders.
          </p>
        </motion.div>

        {/* For Opvang */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              Voor Opvanglocaties
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {opvangSteps.map((step, i) => (
              <div key={step.num} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-center"
                >
                  <div className="mx-auto w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                    <step.icon size={24} />
                  </div>
                  <div className="inline-flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-xs font-bold mt-3">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mt-2 text-sm">{step.description}</p>
                </motion.div>

                {i < opvangSteps.length - 1 && (
                  <div className="hidden md:flex absolute top-16 -right-4 z-10 w-8 items-center justify-center">
                    <ArrowRight size={20} className="text-primary-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* For Ouders */}
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold">
              Voor Ouders
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {ouderSteps.map((step, i) => (
              <div key={step.num} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:border-secondary-300 hover:shadow-md transition-all text-center"
                >
                  <div className="mx-auto w-14 h-14 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center">
                    <step.icon size={24} />
                  </div>
                  <div className="inline-flex items-center justify-center w-6 h-6 bg-secondary-600 text-white rounded-full text-xs font-bold mt-3">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold mt-3 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mt-2 text-sm">{step.description}</p>
                </motion.div>

                {i < ouderSteps.length - 1 && (
                  <div className="hidden md:flex absolute top-16 -right-4 z-10 w-8 items-center justify-center">
                    <ArrowRight size={20} className="text-secondary-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
