'use client';

import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-primary-200 text-sm mb-8"
        >
          12 opvanglocaties gestart deze week
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
        >
          Klaar om te starten?
        </motion.h2>
        <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
          Of je nu een opvangorganisatie bent of een ouder — begin vandaag met
          transparantie en bespaar tijd.
        </p>

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Start als Opvang
            <ArrowRight size={18} />
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary-500 text-white font-medium rounded-lg hover:bg-secondary-600 transition-colors"
          >
            Aanmelden als Ouder
            <ArrowRight size={18} />
          </a>
        </div>

        {/* Trust items */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 text-sm text-primary-100">
          {[
            'Gratis voor ouders',
            '14 dagen gratis voor opvang',
            'Geen creditcard nodig',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
