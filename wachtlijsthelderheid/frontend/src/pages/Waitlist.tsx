import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { entriesApi } from '../utils/api';
import type { WaitlistEntry, Day } from '../types';

type SortField = 'child_name' | 'parent_name' | 'created_at' | 'desired_start_date' | 'status';
type SortDir = 'asc' | 'desc';

const DAYS: Day[] = ['MA', 'DI', 'WO', 'DO', 'VR'];

export default function Waitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showDeleteModal, setShowDeleteModal] = useState<WaitlistEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const response = await entriesApi.getAll();
      setEntries(response.entries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry: WaitlistEntry) {
    try {
      await entriesApi.delete(entry.id);
      setEntries(entries.filter(e => e.id !== entry.id));
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...entries];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e =>
        e.child_name.toLowerCase().includes(searchLower) ||
        e.parent_name.toLowerCase().includes(searchLower) ||
        e.access_code.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus);
    }

    // Day filter
    if (filterDay !== 'all') {
      result = result.filter(e => e.preferred_days.includes(filterDay as Day));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'child_name':
          comparison = a.child_name.localeCompare(b.child_name);
          break;
        case 'parent_name':
          comparison = a.parent_name.localeCompare(b.parent_name);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'desired_start_date':
          comparison = new Date(a.desired_start_date).getTime() - new Date(b.desired_start_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, search, filterStatus, filterDay, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <Layout title="Wachtlijst">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Wachtlijst">
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek op naam of toegangscode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Alle statussen</option>
            <option value="waiting">Wachtend</option>
            <option value="matched">Voorstel verstuurd</option>
            <option value="accepted">Geplaatst</option>
          </select>
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Alle dagen</option>
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <Link to="/waitlist/new" className="btn-primary whitespace-nowrap">
            + Nieuwe inschrijving
          </Link>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
          <p className="text-sm text-gray-500">Totaal</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {entries.filter(e => e.status === 'waiting').length}
          </p>
          <p className="text-sm text-gray-500">Wachtend</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {entries.filter(e => e.status === 'matched').length}
          </p>
          <p className="text-sm text-gray-500">Voorstel verstuurd</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {entries.filter(e => e.status === 'accepted').length}
          </p>
          <p className="text-sm text-gray-500">Geplaatst</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader
                  label="Kind"
                  field="child_name"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Ouder"
                  field="parent_name"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dagen</th>
                <SortHeader
                  label="Gewenste start"
                  field="desired_start_date"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Inschrijfdatum"
                  field="created_at"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioriteit</th>
                <SortHeader
                  label="Status"
                  field="status"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {search || filterStatus !== 'all' || filterDay !== 'all'
                      ? 'Geen resultaten gevonden'
                      : 'Nog geen inschrijvingen'}
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{entry.child_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{entry.access_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{entry.parent_name}</p>
                      {entry.parent_email && (
                        <p className="text-xs text-gray-500">{entry.parent_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {DAYS.map(day => (
                          <span
                            key={day}
                            className={`w-7 h-7 rounded text-xs font-medium flex items-center justify-center ${
                              entry.preferred_days.includes(day)
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(entry.desired_start_date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {entry.priority_factors.has_sibling && (
                          <span className="badge-blue" title="Broertje/zusje">B/Z</span>
                        )}
                        {entry.priority_factors.single_parent && (
                          <span className="badge-yellow" title="Alleenstaand ouder">AO</span>
                        )}
                        {entry.priority_factors.custom && (
                          <span className="badge-gray" title={entry.priority_factors.custom}>+</span>
                        )}
                        {!entry.priority_factors.has_sibling && !entry.priority_factors.single_parent && !entry.priority_factors.custom && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/waitlist/${entry.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                          title="Bewerken"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(entry)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Verwijderen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inschrijving verwijderen
            </h3>
            <p className="text-gray-600 mb-6">
              Weet je zeker dat je de inschrijving van <strong>{showDeleteModal.child_name}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="btn-danger"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <svg className={`w-4 h-4 ${dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    waiting: 'badge-yellow',
    matched: 'badge-blue',
    accepted: 'badge-green',
    removed: 'badge-gray',
  };

  const labels = {
    waiting: 'Wachtend',
    matched: 'Voorstel verstuurd',
    accepted: 'Geplaatst',
    removed: 'Verwijderd',
  };

  return (
    <span className={classes[status as keyof typeof classes] || 'badge-gray'}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
