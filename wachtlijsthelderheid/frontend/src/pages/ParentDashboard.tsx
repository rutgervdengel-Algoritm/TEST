import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../utils/api';
import type { PortalEntrySummary } from '../types';

// Icons
const Icons = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  child: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const DAY_LABELS: Record<string, string> = {
  MA: 'Ma',
  DI: 'Di',
  WO: 'Wo',
  DO: 'Do',
  VR: 'Vr',
};

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [entries, setEntries] = useState<PortalEntrySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const result = await portalApi.getByEmail(email.trim());
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  function handleEntryClick(accessCode: string) {
    navigate(`/portaal/${accessCode}`);
  }

  function getMatchChanceColor(chance: string) {
    switch (chance) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  function getMatchChanceLabel(chance: string) {
    switch (chance) {
      case 'high': return 'Hoge kans';
      case 'medium': return 'Gemiddeld';
      case 'low': return 'Lage kans';
      default: return 'Onbekend';
    }
  }

  function getConfirmationBanner(entry: PortalEntrySummary) {
    const { confirmation } = entry;

    if (confirmation.status === 'expired') {
      return (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-red-500">{Icons.warning}</span>
            <span className="text-sm font-medium">Inschrijving verlopen</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEntryClick(entry.accessCode);
            }}
            className="text-sm font-medium text-red-700 hover:text-red-800"
          >
            Heractiveren
          </button>
        </div>
      );
    }

    if (confirmation.needsConfirmation) {
      return (
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-700">
            <span className="text-yellow-500">{Icons.warning}</span>
            <span className="text-sm font-medium">Bevestiging vereist</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEntryClick(entry.accessCode);
            }}
            className="text-sm font-medium text-yellow-700 hover:text-yellow-800"
          >
            Nu bevestigen
          </button>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border-t border-green-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-green-500">{Icons.check}</span>
          <span className="text-sm">Actief</span>
        </div>
        <span className="text-sm text-green-600">
          Verloopt over {confirmation.daysUntilExpiry} dagen
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Mijn Inschrijvingen</h1>
          <p className="text-gray-600 mt-1">
            Bekijk al je kinderopvang inschrijvingen op een plek
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Search form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {Icons.mail}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Voer je e-mailadres in..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Zoeken...
                </>
              ) : (
                <>
                  {Icons.search}
                  Zoek inschrijvingen
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            {Icons.warning}
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && entries.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {Icons.child}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Geen inschrijvingen gevonden
            </h3>
            <p className="text-gray-600">
              Er zijn geen inschrijvingen gekoppeld aan dit e-mailadres.
            </p>
          </div>
        )}

        {/* Entry cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry.accessCode)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
              >
                {/* Card header with match chance */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        {Icons.child}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{entry.childName}</h3>
                        <p className="text-sm text-gray-500">{entry.parentName}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMatchChanceColor(entry.position.matchChance)}`}>
                      {getMatchChanceLabel(entry.position.matchChance)}
                    </span>
                  </div>

                  {/* Organization */}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <span className="text-gray-400">{Icons.building}</span>
                    <span className="text-sm">{entry.organization.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {entry.organization.type}
                    </span>
                  </div>

                  {/* Position */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Positie op wachtlijst</span>
                      <span className="font-bold text-gray-900">
                        #{entry.position.current}
                        <span className="text-gray-400 font-normal"> van {entry.position.total}</span>
                      </span>
                    </div>
                    {entry.position.range && (
                      <p className="text-xs text-gray-500 mt-1">
                        Range: #{entry.position.range.best} - #{entry.position.range.worst}
                      </p>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <span className="text-gray-400">{Icons.calendar}</span>
                      <span>{new Date(entry.desiredStartDate).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div className="flex gap-1">
                      {entry.preferredDays.map((day) => (
                        <span
                          key={day}
                          className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium"
                        >
                          {DAY_LABELS[day]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pending matches badge */}
                  {entry.pendingMatches > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">
                        {entry.pendingMatches} openstaand voorstel{entry.pendingMatches > 1 ? 'len' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirmation banner */}
                {getConfirmationBanner(entry)}

                {/* Arrow indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                  {Icons.arrow}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alternative: Access code entry */}
        {!searched && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-2">Of gebruik je toegangscode:</p>
            <button
              onClick={() => navigate('/portaal')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Inloggen met toegangscode
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
