'use client';

import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Stats ticker */}
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
          className="text-4xl font-bold text-white mb-4"
        >
          Klaar om te starten?
        </motion.h2>
        <p className="text-xl text-primary-100 mb-12">
          Sluit je aan bij 50+ opvanglocaties die al tijd besparen
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Start Gratis Trial
            <ArrowRight size={18} />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors"
          >
            Plan een Demo
          </a>
        </div>

        {/* Trust items */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-12 text-sm text-primary-100">
          {[
            'Setup in 2 minuten',
            'Geen creditcard nodig',
            '14 dagen gratis',
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
