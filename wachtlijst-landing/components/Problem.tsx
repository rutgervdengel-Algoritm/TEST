'use client';

import { Quote, Phone, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  {
    icon: Phone,
    number: '68%',
    label: 'ouders belt wekelijks voor update',
  },
  {
    icon: Clock,
    number: '12 uur',
    label: 'per week aan telefoontjes',
  },
  {
    icon: AlertCircle,
    number: '89%',
    label: 'weet niet waar ze staan',
  },
];

export default function Problem() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12 text-gray-900"
        >
          Het Zwarte Gat
        </motion.h2>

        {/* Quote card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-md p-8 shadow-sm"
        >
          <Quote size={32} className="text-primary-300 mb-4" />
          <p className="text-lg italic text-gray-700 leading-relaxed">
            &ldquo;Elke week bellen 15 ouders om te vragen waar ze staan. Ik
            geef elke keer een ander antwoord omdat ik het zelf ook niet precies
            weet. Mijn Excel sheet is een ramp.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
              M
            </div>
            <p className="text-sm text-gray-600">
              &mdash; Marieke, Manager BSO De Springplank
            </p>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-3 gap-8 mt-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <stat.icon size={24} className="text-primary-600" />
              </div>
              <div className="text-4xl font-bold text-primary-600">
                {stat.number}
              </div>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
