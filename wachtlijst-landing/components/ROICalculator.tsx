'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function ROICalculator() {
  const [entries, setEntries] = useState(50);
  const [calls, setCalls] = useState(15);

  const hoursSavedWeek = Math.round(((calls * 5) / 60) * 10) / 10;
  const hoursSavedMonth = Math.round(hoursSavedWeek * 4 * 10) / 10;
  const costSavedYear = Math.round(hoursSavedWeek * 4 * 12 * 15);
  const monthlyCost = 79;
  const yearlyCost = monthlyCost * 12;
  const roi = Math.round(((costSavedYear - yearlyCost) / yearlyCost) * 100);

  return (
    <section className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-8 sm:p-12 border border-gray-200">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            Hoeveel bespaar jij?
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Bereken je besparing als opvangorganisatie
          </p>

          {/* Slider 1 */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-medium text-gray-700">
                Aantal inschrijvingen op wachtlijst
              </label>
              <span className="text-2xl font-bold text-primary-600">
                {entries}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="w-full h-2 bg-primary-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10</span>
              <span>500</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-medium text-gray-700">
                Gemiddeld telefoontjes per week
              </label>
              <span className="text-2xl font-bold text-primary-600">
                {calls}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={calls}
              onChange={(e) => setCalls(Number(e.target.value))}
              className="w-full h-2 bg-primary-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>

          {/* Result card */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200 mt-8">
            <p className="text-sm uppercase text-gray-500 tracking-wide font-medium">
              Je bespaart
            </p>
            <p
              className={`text-4xl sm:text-5xl font-bold my-4 ${
                costSavedYear > 2000 ? 'text-success-600' : 'text-primary-600'
              }`}
            >
              {hoursSavedWeek} uur per week
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>= {hoursSavedMonth} uur per maand</p>
              <p>
                = &euro;{costSavedYear.toLocaleString('nl-NL')} per jaar aan
                personeelskosten
              </p>
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 text-sm text-gray-600 space-y-1">
              <p>WachtlijstHelderheid kost &euro;{monthlyCost}/maand</p>
              <p className="text-success-600 font-semibold">
                ROI: {roi > 0 ? `${roi}%` : 'n.v.t.'} per jaar
              </p>
            </div>
            <a
              href="#pricing"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Start nu
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
