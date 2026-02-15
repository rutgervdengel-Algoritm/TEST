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
  Smartphone,
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  {
    id: 'opvang',
    label: 'Voor Opvanglocaties',
    features: [
      {
        icon: Clock,
        title: 'Bespaar 12 uur per week',
        description:
          'Stop met telefoontjes beantwoorden. Ouders zien zelf hun positie.',
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
        description: 'Zie waar de vraag zit. Plan je capaciteit beter.',
      },
    ],
  },
  {
    id: 'ouders',
    label: 'Voor Ouders',
    features: [
      {
        icon: Eye,
        title: 'Altijd duidelijkheid',
        description:
          'Zie je exacte positie, wie voor je staat, en waarom.',
      },
      {
        icon: Target,
        title: 'Match-kans indicator',
        description:
          'Realistische inschatting of je plek krijgt voor jouw startdatum.',
      },
      {
        icon: Bell,
        title: 'Automatische updates',
        description:
          'Notificatie bij elke statusverandering. Nooit meer zelf bellen.',
      },
      {
        icon: Smartphone,
        title: 'Toegankelijk overal',
        description:
          'Via browser op elk device. Geen app download nodig.',
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
      className="bg-gradient-to-br from-primary-50 to-white py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Alles wat je nodig hebt
          </h2>
          <p className="text-gray-600">Voor opvanglocaties en ouders</p>
        </motion.div>

        {/* Tab buttons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-sm bg-white shadow-sm p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-sm font-medium rounded-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {currentTab.features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-md p-6 hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="bg-primary-100 rounded-sm p-3 w-fit">
                <feature.icon size={24} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mt-4 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 mt-2">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
