'use client';

import { Quote, Phone, Clock, AlertCircle, Frown } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  {
    icon: Phone,
    number: '68%',
    label: 'van ouders belt wekelijks voor een update',
  },
  {
    icon: Clock,
    number: '12 uur',
    label: 'per week kwijt aan telefoontjes',
  },
  {
    icon: AlertCircle,
    number: '89%',
    label: 'van ouders weet niet waar ze staan',
  },
  {
    icon: Frown,
    number: '74%',
    label: 'vindt wachtlijstbeheer frustrerend',
  },
];

export default function Problem() {
  return (
    <section id="opvang" className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Het probleem: een zwart gat
          </h2>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            Ouders bellen, mailen en wachten. Opvangorganisaties verdrinken in
            spreadsheets. Niemand weet waar ze staan.
          </p>
        </motion.div>

        {/* Two quotes side by side */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-primary-500"
          >
            <Quote size={24} className="text-primary-300 mb-3" />
            <p className="text-gray-700 leading-relaxed italic">
              &ldquo;Elke week bellen 15 ouders om te vragen waar ze staan. Ik
              geef elke keer een ander antwoord omdat ik het zelf ook niet precies
              weet.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                M
              </div>
              <p className="text-sm text-gray-600">
                Marieke, Manager BSO De Springplank
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-secondary-500"
          >
            <Quote size={24} className="text-secondary-300 mb-3" />
            <p className="text-gray-700 leading-relaxed italic">
              &ldquo;Ik heb me 8 maanden geleden ingeschreven bij 3 opvangen.
              Nog steeds geen idee of we ooit een plekje krijgen.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold text-sm">
                S
              </div>
              <p className="text-sm text-gray-600">
                Sandra, moeder uit Amsterdam
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg p-5 shadow-sm text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
                <stat.icon size={22} className="text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-primary-600">
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
