'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '1',
    title: 'Importeer je lijst',
    description:
      'Upload je Excel of voeg handmatig toe. Klaar in 5 minuten.',
  },
  {
    num: '2',
    title: 'Ouders krijgen toegang',
    description:
      'Elke inschrijving krijgt unieke code. Real-time positie zichtbaar.',
  },
  {
    num: '3',
    title: 'Automatisch matchen',
    description:
      'Nieuwe plek? Systeem stelt beste matches voor. Accepteren met 1 klik.',
  },
];

export default function Solution() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16 text-gray-900"
        >
          Zo simpel werkt het
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-md p-6 hover:shadow-md transition-shadow text-center"
              >
                {/* Step number */}
                <div className="mx-auto w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mt-6 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 mt-2">{step.description}</p>

                {/* Screenshot placeholder */}
                <div className="mt-6 bg-gray-100 rounded-md border border-gray-200 aspect-video flex items-center justify-center">
                  <span className="text-xs text-gray-400">Screenshot</span>
                </div>
              </motion.div>

              {/* Arrow between steps (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-20 -right-4 z-10 w-8 items-center justify-center">
                  <ArrowRight size={24} className="text-primary-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
