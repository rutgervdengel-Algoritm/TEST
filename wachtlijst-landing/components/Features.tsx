'use client';

import { useState } from 'react';
import {
  Clock,
  Zap,
  Shield,
  BarChart3,
  Eye,
  Target,
  Bell,
  Mail,
  Send,
  CalendarCheck,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  {
    id: 'opvang',
    label: 'Voor Opvanglocaties',
    color: 'primary' as const,
    features: [
      {
        icon: Clock,
        title: 'Bespaar 12 uur per week',
        description:
          'Stop met telefoontjes beantwoorden. Ouders zien zelf hun positie in real-time.',
      },
      {
        icon: Zap,
        title: 'Automatische matching',
        description:
          'Nieuwe plek beschikbaar? Top 5 matches in 1 seconde. Stuur voorstel met 1 klik.',
      },
      {
        icon: Shield,
        title: 'Volledige audit trail',
        description:
          'Elke beslissing wordt vastgelegd. Perfect voor verantwoording naar gemeenten.',
      },
      {
        icon: BarChart3,
        title: 'Inzicht in vraagpatronen',
        description:
          'Zie waar de vraag zit en plan je capaciteit beter met data-gedreven inzichten.',
      },
      {
        icon: Bell,
        title: 'Ontvang notificaties van ouders',
        description:
          'Ouders sturen geautomatiseerde berichten. Jij ontvangt alles netjes in je dashboard.',
      },
      {
        icon: RefreshCw,
        title: 'Automatische herinneringen',
        description:
          'Stel in dat ouders periodiek bevestigen dat ze nog interesse hebben. Houdt je lijst schoon.',
      },
    ],
  },
  {
    id: 'ouders',
    label: 'Voor Ouders',
    color: 'secondary' as const,
    features: [
      {
        icon: Eye,
        title: 'Altijd duidelijkheid',
        description:
          'Zie je exacte positie op de wachtlijst, wie voor je staat en waarom.',
      },
      {
        icon: Target,
        title: 'Match-kans indicator',
        description:
          'Realistische inschatting of je een plek krijgt voor jouw gewenste startdatum.',
      },
      {
        icon: Mail,
        title: 'Geautomatiseerde emails naar opvang',
        description:
          'Laat opvanglocaties automatisch weten dat je nog interesse hebt. Geen handwerk.',
      },
      {
        icon: Send,
        title: 'Notificaties bij statuswijziging',
        description:
          'Ontvang direct bericht als je positie verandert of er een plek vrijkomt.',
      },
      {
        icon: CalendarCheck,
        title: 'Beheer al je inschrijvingen',
        description:
          'Overzicht van al je wachtlijsten op een plek. Voeg toe, pauzeer of trek terug.',
      },
      {
        icon: Smartphone,
        title: 'Werkt op elk apparaat',
        description:
          'Via browser op telefoon, tablet of computer. Geen app download nodig.',
      },
    ],
  },
];

export default function Features() {
  const [activeTab, setActiveTab] = useState('opvang');
  const currentTab = tabs.find((t) => t.id === activeTab)!;

  return (
    <section
      id="features"
      className="bg-gradient-to-br from-primary-50/50 to-white py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-lg text-navy-500">
            Krachtige tools voor opvanglocaties en ouders
          </p>
        </motion.div>

        {/* Tab buttons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-white shadow-sm border border-navy-200 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? tab.color === 'primary'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-secondary-500 text-white shadow-sm'
                    : 'text-navy-500 hover:text-navy-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {currentTab.features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-6 border border-navy-200 hover:-translate-y-1 hover:shadow-md hover:border-primary-300 transition-all"
            >
              <div
                className={`rounded-xl p-3 w-fit ${
                  currentTab.color === 'primary'
                    ? 'bg-primary-100'
                    : 'bg-secondary-100'
                }`}
              >
                <feature.icon
                  size={22}
                  className={
                    currentTab.color === 'primary'
                      ? 'text-primary-600'
                      : 'text-secondary-600'
                  }
                />
              </div>
              <h3 className="text-lg font-semibold mt-4 text-navy-900">
                {feature.title}
              </h3>
              <p className="text-navy-500 mt-2 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
