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

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-16 text-gray-900"
        >
          Wat klanten zeggen
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Featured testimonial - spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-white rounded-md shadow-sm overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Video placeholder */}
              <div className="relative bg-gray-200 aspect-video flex items-center justify-center">
                <button className="bg-white/90 rounded-full w-16 h-16 shadow-lg flex items-center justify-center hover:bg-white transition-colors">
                  <Play size={28} className="text-primary-600 ml-1" />
                </button>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Stars />
                <p className="text-lg text-gray-700 mt-4 leading-relaxed">
                  &ldquo;Sinds WachtlijstHelderheid krijgen we 80% minder
                  telefoontjes. Ik had niet verwacht dat het zo&apos;n groot
                  verschil zou maken.&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                    MvD
                  </div>
                  <p className="text-sm text-gray-600">
                    &mdash; Marieke van Dam, Manager BSO De Springplank
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Testimonial 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-md p-6 shadow-sm"
          >
            <Stars />
            <p className="text-gray-700 mt-4">
              &ldquo;Setup duurde letterlijk 5 minuten. De import van onze Excel
              ging perfect.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                TJ
              </div>
              <p className="text-sm text-gray-600">
                &mdash; Tom Jansen, Eigenaar KDV De Blokkendoos
              </p>
            </div>
          </motion.div>

          {/* Testimonial 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-md p-6 shadow-sm"
          >
            <Stars />
            <p className="text-gray-700 mt-4">
              &ldquo;Ouders zijn zo blij dat ze eindelijk weten waar ze staan.
              Veel minder frustratie.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                LdV
              </div>
              <p className="text-sm text-gray-600">
                &mdash; Lisa de Vries, Leidinggevende BSO Het Boshuis
              </p>
            </div>
          </motion.div>

          {/* Testimonial 4 - Parent (different style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 border-l-4 border-secondary-500 bg-white rounded-md p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block text-xs font-medium bg-secondary-100 text-secondary-800 px-2 py-1 rounded">
                Ouder
              </span>
            </div>
            <p className="text-gray-700">
              &ldquo;Eindelijk weet ik waar ik sta! Geen wekelijks gebel meer
              nodig.&rdquo;
            </p>
            <p className="text-sm text-gray-600 mt-4">
              &mdash; Laura, moeder uit Utrecht
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
