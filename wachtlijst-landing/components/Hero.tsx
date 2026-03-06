'use client';

import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-amber-50 pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm text-primary-600 uppercase tracking-wide font-semibold mb-4">
              VOOR KINDEROPVANG ORGANISATIES
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Stop met wachtlijst chaos.{' '}
              <span className="text-primary-600">Start met transparantie.</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mt-6 max-w-lg">
              Ouders weten waar ze staan. Jij bespaart 12 uur per week. Iedereen
              blij.
            </p>

            {/* Trust bullets */}
            <div className="mt-6 space-y-2">
              {[
                'Setup in 5 minuten',
                'Geen creditcard nodig',
                '14 dagen gratis proberen',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle size={18} className="text-success-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Start Gratis Trial
                <ArrowRight size={18} />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                <Play size={18} />
                Bekijk Demo
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12">
              <p className="text-sm text-gray-500 mb-4">
                Vertrouwd door 50+ opvanglocaties
              </p>
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-8 bg-gray-200 rounded opacity-50"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right column - App mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative transform rotate-2">
              <div className="bg-white border-2 border-primary-200 rounded-lg shadow-2xl overflow-hidden aspect-[4/3]">
                {/* Mock dashboard */}
                <div className="bg-primary-600 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="flex-1 bg-white/20 rounded h-5 mx-8" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    <div className="h-8 w-28 bg-primary-100 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Wachtend', num: '47', color: 'bg-blue-50' },
                      { label: 'Gematcht', num: '12', color: 'bg-green-50' },
                      { label: 'Plekken', num: '3', color: 'bg-amber-50' },
                    ].map((s) => (
                      <div key={s.label} className={`${s.color} rounded-md p-3`}>
                        <div className="text-2xl font-bold text-gray-900">
                          {s.num}
                        </div>
                        <div className="text-xs text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-gray-50 rounded p-3"
                      >
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-3 w-32 bg-gray-200 rounded" />
                          <div className="h-2 w-20 bg-gray-100 rounded mt-1" />
                        </div>
                        <div className="h-6 w-16 bg-success-100 rounded text-xs flex items-center justify-center text-success-600 font-medium">
                          #&thinsp;{i}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
