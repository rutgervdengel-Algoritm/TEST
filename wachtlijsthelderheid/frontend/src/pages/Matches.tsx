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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
          className={`card p-4 text-center transition-all ${filter === 'proposed' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <p className="text-2xl font-bold text-blue-600">{statusCounts.proposed}</p>
          <p className="text-sm text-gray-500">In afwachting</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'accepted' ? 'all' : 'accepted')}
          className={`card p-4 text-center transition-all ${filter === 'accepted' ? 'ring-2 ring-green-500' : ''}`}
        >
          <p className="text-2xl font-bold text-green-600">{statusCounts.accepted}</p>
          <p className="text-sm text-gray-500">Geaccepteerd</p>
        </button>
        <button
          onClick={() => setFilter(filter === 'rejected' ? 'all' : 'rejected')}
          className={`card p-4 text-center transition-all ${filter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
        >
          <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
          <p className="text-sm text-gray-500">Afgewezen</p>
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {filter === 'all' ? 'Alle voorstellen' : `Gefilterd: ${filter}`}
        </h2>
        <Link to="/spots/new" className="btn-primary">
          + Nieuwe plek
        </Link>
      </div>

      {/* Matches list */}
      {filteredMatches.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-gray-400">M</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen voorstellen</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? 'Maak een nieuwe plek aan om matches te vinden'
              : 'Geen voorstellen met deze status'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="btn-secondary">
              Toon alle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="card">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                      match.status === 'accepted' ? 'bg-green-100 text-green-600' :
                      match.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {match.status === 'accepted' ? 'OK' :
                       match.status === 'rejected' ? 'X' : '...'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-medium text-gray-900">{match.child_name}</h3>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="text-sm text-gray-500">{match.parent_name}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Plek: {match.spot_days?.join(', ')} vanaf{' '}
                        {match.start_date && new Date(match.start_date).toLocaleDateString('nl-NL')}
                      </p>
                      {match.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reden afwijzing: {match.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    {/* Score */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      match.match_score >= 70 ? 'bg-green-100 text-green-700' :
                      match.match_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {Math.round(match.match_score)}%
                    </div>

                    {/* Status badge */}
                    <div className="text-right">
                      <StatusBadge status={match.status} />
                      <p className="text-xs text-gray-500 mt-1">
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
    rejected: 'badge-red',
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
