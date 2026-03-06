import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { matchesApi } from '../utils/api';
import type { Match } from '../types';

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const response = await matchesApi.getAll();
      setMatches(response.matches);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMatches = filter === 'all'
    ? matches
    : matches.filter(m => m.status === filter);

  const statusCounts = {
    proposed: matches.filter(m => m.status === 'proposed').length,
    accepted: matches.filter(m => m.status === 'accepted').length,
    rejected: matches.filter(m => m.status === 'rejected').length,
  };

  if (loading) {
    return (
      <Layout title="Matches">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Matches">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter(filter === 'proposed' ? 'all' : 'proposed')}
          className={`stat-card text-center transition-all ${filter === 'proposed' ? 'ring-2 ring-forest-500' : ''}`}
        >
          <p className="text-2xl font-bold text-forest-600">{statusCounts.proposed}</p>
          <p className="text-sm text-navy-400">In afwachting</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'accepted' ? 'all' : 'accepted')}
          className={`stat-card text-center transition-all ${filter === 'accepted' ? 'ring-2 ring-teal-500' : ''}`}
        >
          <p className="text-2xl font-bold text-teal-600">{statusCounts.accepted}</p>
          <p className="text-sm text-navy-400">Geaccepteerd</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'rejected' ? 'all' : 'rejected')}
          className={`stat-card text-center transition-all ${filter === 'rejected' ? 'ring-2 ring-terracotta-500' : ''}`}
        >
          <p className="text-2xl font-bold text-terracotta-600">{statusCounts.rejected}</p>
          <p className="text-sm text-navy-400">Afgewezen</p>
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif font-bold text-forest-600">
          {filter === 'all' ? 'Alle voorstellen' : `Gefilterd: ${filter}`}
        </h2>
        <Link to="/spots/new" className="btn-primary">
          + Nieuwe plek
        </Link>
      </div>

      {/* Matches list */}
      {filteredMatches.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-navy-400">M</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-forest-600 mb-2">Geen voorstellen</h3>
          <p className="text-navy-400 mb-4">
            {filter === 'all'
              ? 'Maak een nieuwe plek aan om matches te vinden'
              : 'Geen voorstellen met deze status'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="btn-outline">
              Toon alle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="card p-0 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                      match.status === 'accepted' ? 'bg-teal-100 text-teal-600' :
                      match.status === 'rejected' ? 'bg-terracotta-100 text-terracotta-600' :
                      'bg-forest-100 text-forest-600'
                    }`}>
                      {match.status === 'accepted' ? 'OK' :
                       match.status === 'rejected' ? 'X' : '...'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-semibold text-forest-600">{match.child_name}</h3>
                        <span className="text-navy-300 hidden sm:inline">•</span>
                        <span className="text-sm text-navy-400">{match.parent_name}</span>
                      </div>
                      <p className="text-sm text-navy-500">
                        Plek: {match.spot_days?.join(', ')} vanaf{' '}
                        {match.start_date && new Date(match.start_date).toLocaleDateString('nl-NL')}
                      </p>
                      {match.rejection_reason && (
                        <p className="text-sm text-terracotta-600 mt-1">
                          Reden afwijzing: {match.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    {/* Score */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      match.match_score >= 70 ? 'bg-teal-50 text-teal-700 ring-2 ring-teal-500/20' :
                      match.match_score >= 40 ? 'bg-terracotta-50 text-terracotta-700 ring-2 ring-terracotta-500/20' :
                      'bg-terracotta-100 text-terracotta-700 ring-2 ring-terracotta-600/20'
                    }`}>
                      {Math.round(match.match_score)}%
                    </div>

                    {/* Status badge */}
                    <div className="text-right">
                      <StatusBadge status={match.status} />
                      <p className="text-xs text-navy-400 mt-1">
                        {new Date(match.proposed_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    proposed: 'badge-blue',
    accepted: 'badge-green',
    rejected: 'badge-amber',
    expired: 'badge-gray',
  };

  const labels = {
    proposed: 'In afwachting',
    accepted: 'Geaccepteerd',
    rejected: 'Afgewezen',
    expired: 'Verlopen',
  };

  return (
    <span className={classes[status as keyof typeof classes] || 'badge-gray'}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
