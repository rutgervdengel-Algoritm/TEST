'use client';

import { ArrowRight, Play, CheckCircle, Building2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Audience badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                <Building2 size={14} />
                Voor Kinderopvang
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs font-semibold">
                <Users size={14} />
                Voor Ouders
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-900 leading-tight">
              Wachtlijsten die{' '}
              <span className="text-primary-600">voor iedereen</span> werken.
            </h1>
            <p className="text-xl text-navy-500 leading-relaxed mt-6 max-w-lg">
              Opvangorganisaties besparen 12 uur per week. Ouders weten altijd
              waar ze staan en sturen automatisch updates. Iedereen blij.
            </p>

            {/* Trust bullets */}
            <div className="mt-6 space-y-2">
              {[
                'Setup in 5 minuten',
                'Geen creditcard nodig',
                '14 dagen gratis proberen',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-navy-700">
                  <CheckCircle size={18} className="text-primary-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Start Gratis Trial
                <ArrowRight size={18} />
              </a>
              <a
                href="#ouders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy-200 text-navy-700 font-semibold rounded-lg hover:bg-navy-50 transition-all"
              >
                <Play size={18} />
                Bekijk hoe het werkt
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-12">
              <p className="text-sm text-navy-400 mb-4">
                Vertrouwd door 50+ opvanglocaties en 2.000+ ouders
              </p>
              <div className="flex items-center gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-8 bg-navy-100 rounded opacity-60"
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
            <div className="relative transform rotate-1">
              {/* Dashboard mockup */}
              <div className="bg-white border border-navy-200 rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="flex-1 bg-white/20 rounded h-5 mx-8" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-48 bg-navy-100 rounded" />
                    <div className="h-8 w-28 bg-primary-100 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Wachtend', num: '47', color: 'bg-primary-50 border border-primary-100' },
                      { label: 'Gematcht', num: '12', color: 'bg-success-50 border border-success-100' },
                      { label: 'Plekken', num: '3', color: 'bg-secondary-50 border border-secondary-100' },
                    ].map((s) => (
                      <div key={s.label} className={`${s.color} rounded-xl p-3`}>
                        <div className="text-2xl font-bold text-navy-900">
                          {s.num}
                        </div>
                        <div className="text-xs text-navy-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-navy-50 rounded-xl p-3"
                      >
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-3 w-32 bg-navy-200 rounded" />
                          <div className="h-2 w-20 bg-navy-100 rounded mt-1" />
                        </div>
                        <div className="h-6 w-16 bg-success-100 rounded-full text-xs flex items-center justify-center text-success-600 font-medium">
                          #&thinsp;{i}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-4 -left-8 bg-white rounded-xl shadow-lg border border-navy-200 p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={16} className="text-success-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy-900">Email verstuurd</p>
                  <p className="text-xs text-navy-500">Automatische update naar KDV</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
