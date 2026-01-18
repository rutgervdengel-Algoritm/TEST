import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { logApi, getAuthToken } from '../utils/api';
import type { DecisionLogEntry } from '../types';

const ACTION_ICONS: Record<string, string> = {
  entry_added: '+',
  entry_updated: 'E',
  entry_removed: 'X',
  spot_created: 'P',
  proposal_sent: 'V',
  proposal_accepted: 'OK',
  proposal_rejected: 'X',
  rule_updated: 'R',
};

const ACTION_COLORS: Record<string, string> = {
  entry_added: 'bg-green-100 text-green-700',
  entry_updated: 'bg-blue-100 text-blue-700',
  entry_removed: 'bg-red-100 text-red-700',
  spot_created: 'bg-purple-100 text-purple-700',
  proposal_sent: 'bg-yellow-100 text-yellow-700',
  proposal_accepted: 'bg-green-100 text-green-700',
  proposal_rejected: 'bg-red-100 text-red-700',
  rule_updated: 'bg-gray-100 text-gray-700',
};

export default function DecisionLog() {
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const response = await logApi.getAll();
      setLogs(response.logs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const actionTypes = [...new Set(logs.map(l => l.action_type))];

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.action_type !== filter) return false;
    if (search && !log.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.created_at).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, DecisionLogEntry[]>);

  function handleExport() {
    const token = getAuthToken();
    const url = logApi.exportUrl();
    // Create a temporary link with auth header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'beslissingslog.csv';
        link.click();
      });
  }

  if (loading) {
    return (
      <Layout title="Beslissingslog">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Beslissingslog">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek in beschrijvingen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">Alle acties</option>
          {actionTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button onClick={handleExport} className="btn-secondary whitespace-nowrap">
          Exporteer CSV
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-blue-50 border-blue-200 mb-6">
        <div>
          <h3 className="font-medium text-blue-900">Audit trail</h3>
          <p className="text-sm text-blue-700">
            Alle beslissingen en wijzigingen worden hier gelogd voor transparantie en verantwoording.
            Totaal: {logs.length} logboekregels
          </p>
        </div>
      </div>

      {/* Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-gray-400">L</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen activiteit</h3>
          <p className="text-gray-500">
            {search || filter !== 'all'
              ? 'Geen resultaten gevonden voor deze zoekopdracht'
              : 'Er zijn nog geen acties gelogd'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-4 sticky top-0 bg-gray-50 py-2">
                {date}
              </h3>
              <div className="space-y-3">
                {dateLogs.map(log => (
                  <div key={log.id} className="card">
                    <div className="card-body py-3">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          ACTION_COLORS[log.action_type] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {ACTION_ICONS[log.action_type] || '?'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{log.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {log.action_type.replace(/_/g, ' ')}
                            </span>
                            {log.related_entry_id && (
                              <span className="text-xs text-gray-500">
                                Entry #{log.related_entry_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
