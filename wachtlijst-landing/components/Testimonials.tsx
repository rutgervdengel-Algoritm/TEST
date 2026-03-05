'use client';

import { Star, Play } from 'lucide-react';
import { motion } from 'framer-motion';

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className="fill-secondary-400 text-secondary-400"
        />
      ))}
    </div>
  );
}

const testimonials = [
  {
    quote:
      'Sinds WachtlijstHelderheid krijgen we 80% minder telefoontjes. Ik had niet verwacht dat het zo\'n groot verschil zou maken.',
    name: 'Marieke van Dam',
    role: 'Manager BSO De Springplank',
    initials: 'MvD',
    type: 'opvang' as const,
  },
  {
    quote:
      'Setup duurde letterlijk 5 minuten. De import van onze Excel ging perfect.',
    name: 'Tom Jansen',
    role: 'Eigenaar KDV De Blokkendoos',
    initials: 'TJ',
    type: 'opvang' as const,
  },
  {
    quote:
      'Ouders zijn zo blij dat ze eindelijk weten waar ze staan. Veel minder frustratie bij ons team.',
    name: 'Lisa de Vries',
    role: 'Leidinggevende BSO Het Boshuis',
    initials: 'LdV',
    type: 'opvang' as const,
  },
];

const parentTestimonials = [
  {
    quote:
      'Eindelijk weet ik waar ik sta! Het systeem stuurt automatisch updates naar de opvang. Ik hoef niets meer te doen.',
    name: 'Laura',
    role: 'Moeder uit Utrecht',
    initials: 'L',
  },
  {
    quote:
      'Bij 4 opvangen tegelijk op de wachtlijst, en alles overzichtelijk in een dashboard. De automatische emails zijn geniaal.',
    name: 'Mark & Sophie',
    role: 'Ouders uit Den Haag',
    initials: 'MS',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-navy-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            Wat onze gebruikers zeggen
          </h2>
          <p className="text-lg text-navy-500">
            Opvangorganisaties en ouders over hun ervaring
          </p>
        </motion.div>

        {/* Featured testimonial with video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow-sm overflow-hidden mb-8"
        >
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative bg-navy-100 aspect-video flex items-center justify-center">
              <button className="bg-white/90 rounded-full w-16 h-16 shadow-lg flex items-center justify-center hover:bg-white transition-colors">
                <Play size={28} className="text-primary-600 ml-1" />
              </button>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <Stars />
              <p className="text-lg text-navy-700 mt-4 leading-relaxed">
                &ldquo;Sinds WachtlijstHelderheid krijgen we 80% minder
                telefoontjes. Ouders zijn blij, wij zijn blij. Win-win.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  MvD
                </div>
                <p className="text-sm text-navy-500">
                  Marieke van Dam, Manager BSO De Springplank
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Opvang testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-navy-200"
            >
              <Stars />
              <p className="text-navy-700 mt-4">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {t.initials}
                </div>
                <p className="text-sm text-navy-500">
                  {t.name}, {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Parent testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          {parentTestimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-l-4 border-secondary-400 bg-white rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block text-xs font-medium bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                  Ouder
                </span>
              </div>
              <p className="text-navy-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold text-sm">
                  {t.initials}
                </div>
                <p className="text-sm text-navy-500">
                  {t.name}, {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
