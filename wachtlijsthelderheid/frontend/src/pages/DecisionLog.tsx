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
  interest_confirmed: 'B',
  entry_expired: 'X',
  entry_archived: 'A',
  import: 'I',
  export: 'E',
};

const ACTION_COLORS: Record<string, string> = {
  entry_added: 'bg-teal-100 text-teal-700',
  entry_updated: 'bg-forest-100 text-forest-700',
  entry_removed: 'bg-terracotta-100 text-terracotta-700',
  spot_created: 'bg-forest-100 text-forest-700',
  proposal_sent: 'bg-terracotta-100 text-terracotta-600',
  proposal_accepted: 'bg-teal-100 text-teal-700',
  proposal_rejected: 'bg-terracotta-100 text-terracotta-700',
  rule_updated: 'bg-cream-200 text-navy-600',
  interest_confirmed: 'bg-teal-100 text-teal-700',
  entry_expired: 'bg-terracotta-100 text-terracotta-600',
  entry_archived: 'bg-cream-200 text-navy-600',
  import: 'bg-forest-100 text-forest-700',
  export: 'bg-forest-100 text-forest-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  inschrijving: 'Inschrijving',
  matching: 'Matching',
  regelwijziging: 'Regelwijziging',
  archivering: 'Archivering',
  import_export: 'Import/Export',
  system: 'Systeem',
  general: 'Algemeen',
};

const CATEGORY_COLORS: Record<string, string> = {
  inschrijving: 'bg-teal-50 text-teal-700 border-teal-200',
  matching: 'bg-forest-50 text-forest-700 border-forest-200',
  regelwijziging: 'bg-forest-50 text-forest-600 border-forest-200',
  archivering: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
  import_export: 'bg-forest-50 text-forest-700 border-forest-200',
  system: 'bg-cream-100 text-navy-600 border-cream-300',
  general: 'bg-cream-100 text-navy-600 border-cream-300',
};

export default function DecisionLog() {
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  async function applyFilters() {
    setLoading(true);
    try {
      const filters: {
        category?: string;
        action_type?: string;
        from_date?: string;
        to_date?: string;
      } = {};
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (filter !== 'all') filters.action_type = filter;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const response = await logApi.getAll(Object.keys(filters).length > 0 ? filters : undefined);
      setLogs(response.logs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const actionTypes = [...new Set(logs.map(l => l.action_type))];
  const categories = [...new Set(logs.map(l => l.category).filter(Boolean))];

  const filteredLogs = logs.filter(log => {
    if (search && !log.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
    const filters: {
      category?: string;
      action_type?: string;
      from_date?: string;
      to_date?: string;
    } = {};
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (filter !== 'all') filters.action_type = filter;
    if (fromDate) filters.from_date = fromDate;
    if (toDate) filters.to_date = toDate;

    const url = logApi.exportUrl(Object.keys(filters).length > 0 ? filters : undefined);

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

  function clearFilters() {
    setFilter('all');
    setCategoryFilter('all');
    setFromDate('');
    setToDate('');
    setSearch('');
    loadLogs();
  }

  if (loading) {
    return (
      <Layout title="Beslissingslog">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    );
  }

  const hasActiveFilters = filter !== 'all' || categoryFilter !== 'all' || fromDate || toDate;

  return (
    <Layout title="Beslissingslog">
      {/* Filters */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="label">Zoeken</label>
              <input
                type="text"
                placeholder="Zoek in beschrijvingen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
              />
            </div>

            <div className="w-full lg:w-48">
              <label className="label">Categorie</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="all">Alle categorieen</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat as string] || cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-48">
              <label className="label">Actie type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input"
              >
                <option value="all">Alle acties</option>
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-40">
              <label className="label">Van</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="w-full lg:w-40">
              <label className="label">Tot</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-cream-200">
            <button onClick={applyFilters} className="btn-primary">
              Filters toepassen
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-outline">
                Filters wissen
              </button>
            )}
            <div className="ml-auto">
              <button onClick={handleExport} className="btn-outline flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporteer CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="card p-4 bg-forest-50 border-forest-200 mb-6">
        <div>
          <h3 className="font-semibold text-forest-700">Audit trail</h3>
          <p className="text-sm text-forest-600">
            Alle beslissingen en wijzigingen worden hier gelogd voor transparantie en verantwoording.
            Totaal: {logs.length} logboekregels
            {hasActiveFilters && ` (gefilterd: ${filteredLogs.length})`}
          </p>
        </div>
      </div>

      {/* Stats per category */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = logs.filter(l => l.category === key).length;
          return (
            <button
              key={key}
              onClick={() => {
                setCategoryFilter(key);
                applyFilters();
              }}
              className={`p-3 rounded-xl border text-center transition-colors ${
                categoryFilter === key
                  ? CATEGORY_COLORS[key]
                  : 'bg-white border-cream-300 hover:border-forest-300'
              }`}
            >
              <p className="text-lg font-bold text-forest-600">{count}</p>
              <p className="text-xs text-navy-400">{label}</p>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-navy-400">L</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-forest-600 mb-2">Geen activiteit</h3>
          <p className="text-navy-400">
            {search || hasActiveFilters
              ? 'Geen resultaten gevonden voor deze zoekopdracht'
              : 'Er zijn nog geen acties gelogd'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-navy-400 mb-4 sticky top-16 bg-cream-100 py-2 z-5">
                {date}
              </h3>
              <div className="space-y-3">
                {dateLogs.map(log => (
                  <div key={log.id} className="card p-0 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          ACTION_COLORS[log.action_type] || 'bg-cream-200 text-navy-600'
                        }`}>
                          {ACTION_ICONS[log.action_type] || '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-navy-600">{log.description}</p>

                          {log.reason && (
                            <p className="text-sm text-navy-400 mt-1 italic">
                              Reden: {log.reason}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-navy-400">
                              {new Date(log.created_at).toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {log.category && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                CATEGORY_COLORS[log.category] || 'bg-cream-100 text-navy-500 border-cream-300'
                              }`}>
                                {CATEGORY_LABELS[log.category] || log.category}
                              </span>
                            )}

                            <span className="text-xs px-2 py-0.5 bg-cream-200 text-navy-500 rounded-full">
                              {log.action_type.replace(/_/g, ' ')}
                            </span>

                            {log.related_entry_id && (
                              <span className="text-xs text-navy-400">
                                Entry #{log.related_entry_id}
                              </span>
                            )}

                            {log.employee_name && (
                              <span className="text-xs text-navy-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {log.employee_name}
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
