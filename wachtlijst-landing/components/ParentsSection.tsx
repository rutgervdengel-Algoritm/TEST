'use client';

import {
  Mail,
  Bell,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
} from 'lucide-react';
import { motion } from 'framer-motion';

const capabilities = [
  {
    icon: ClipboardList,
    title: 'Beheer al je inschrijvingen',
    description:
      'Eén dashboard voor al je wachtlijsten. Zie direct je positie bij elke opvanglocatie, pauzeer of trek terug wanneer je wilt.',
  },
  {
    icon: Mail,
    title: 'Geautomatiseerde emails naar opvang',
    description:
      'Stel automatische berichten in om opvanglocaties te laten weten dat je nog behoefte hebt. Kies de frequentie en het systeem doet de rest.',
  },
  {
    icon: Bell,
    title: 'Slimme notificaties',
    description:
      'Ontvang direct bericht bij statusveranderingen, vrijgekomen plekken of wanneer actie nodig is. Via email of push-notificatie.',
  },
  {
    icon: Send,
    title: 'Automatische bevestigingen',
    description:
      'Het systeem stuurt periodiek een bevestiging naar de opvang dat je nog interesse hebt. Jij hoeft niets te doen.',
  },
];

export default function ParentsSection() {
  return (
    <section id="ouders" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold mb-6">
              Voor Ouders
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Nooit meer bellen.{' '}
              <span className="text-secondary-600">Alles automatisch.</span>
            </h2>
            <p className="text-lg text-gray-600 mt-4">
              Beheer je inschrijvingen vanuit een overzicht. Stuur automatisch
              emails en ontvang notificaties zonder zelf iets te doen.
            </p>

            <div className="mt-8 space-y-6">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <cap.icon size={20} className="text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cap.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {cap.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <a
              href="#pricing"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-secondary-500 text-white font-medium rounded-lg hover:bg-secondary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            >
              Gratis aanmelden als ouder
              <ArrowRight size={18} />
            </a>
          </motion.div>

          {/* Right - Visual mockup of parent dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              {/* Mock header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Welkom terug</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Sandra van den Berg
                  </p>
                </div>
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-semibold text-sm">
                  SB
                </div>
              </div>

              {/* Registrations list */}
              <p className="text-sm font-medium text-gray-700 mb-3">
                Mijn inschrijvingen (3)
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: 'KDV De Blokkendoos',
                    position: '#4',
                    status: 'Actief',
                    statusColor: 'bg-success-100 text-success-600',
                    lastEmail: '2 dagen geleden',
                  },
                  {
                    name: 'BSO Het Boshuis',
                    position: '#12',
                    status: 'Actief',
                    statusColor: 'bg-success-100 text-success-600',
                    lastEmail: '5 dagen geleden',
                  },
                  {
                    name: 'KDV Zonnestraal',
                    position: '#7',
                    status: 'Email gepland',
                    statusColor: 'bg-primary-100 text-primary-600',
                    lastEmail: 'Morgen automatisch',
                  },
                ].map((reg) => (
                  <div
                    key={reg.name}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {reg.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            Positie: {reg.position}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${reg.statusColor}`}
                          >
                            {reg.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{reg.lastEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-email indicator */}
              <div className="mt-4 bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Mail size={16} className="text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Automatische emails actief
                    </p>
                    <p className="text-xs text-gray-500">
                      3 opvanglocaties ontvangen maandelijks een update van jou
                    </p>
                  </div>
                  <CheckCircle
                    size={18}
                    className="text-success-500 ml-auto flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
