import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { entriesApi } from '../utils/api';
import type { WaitlistEntry, Day, ConfirmationStatus } from '../types';

type SortField = 'child_name' | 'parent_name' | 'created_at' | 'desired_start_date' | 'status' | 'confirmation_status';
type SortDir = 'asc' | 'desc';

const DAYS: Day[] = ['MA', 'DI', 'WO', 'DO', 'VR'];

// Icons
const Icons = {
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  archive: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  restore: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export default function Waitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterConfirmation, setFilterConfirmation] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showDeleteModal, setShowDeleteModal] = useState<WaitlistEntry | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const [activeResponse, archivedResponse] = await Promise.all([
        entriesApi.getAll(),
        entriesApi.getArchived(),
      ]);
      setEntries(activeResponse.entries);
      setArchivedEntries(archivedResponse.entries);
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

  async function handleResetConfirmation(entry: WaitlistEntry) {
    try {
      const response = await entriesApi.resetConfirmation(entry.id);
      setEntries(entries.map(e => e.id === entry.id ? response.entry : e));
    } catch (error) {
      console.error('Error resetting confirmation:', error);
    }
  }

  async function handleBulkResetConfirmation() {
    if (selectedEntries.length === 0) return;

    try {
      setBulkAction(true);
      await entriesApi.bulkResetConfirmation(selectedEntries);
      await loadEntries();
      setSelectedEntries([]);
    } catch (error) {
      console.error('Error bulk resetting confirmation:', error);
    } finally {
      setBulkAction(false);
    }
  }

  async function handleRestore(entry: WaitlistEntry) {
    try {
      const response = await entriesApi.restore(entry.id);
      setArchivedEntries(archivedEntries.filter(e => e.id !== entry.id));
      setEntries([...entries, response.entry]);
    } catch (error) {
      console.error('Error restoring entry:', error);
    }
  }

  function toggleSelectEntry(id: number) {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    const visibleIds = filteredAndSorted.map(e => e.id);
    if (selectedEntries.length === visibleIds.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(visibleIds);
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = showArchived ? [...archivedEntries] : [...entries];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e =>
        e.child_name.toLowerCase().includes(searchLower) ||
        e.parent_name.toLowerCase().includes(searchLower) ||
        e.access_code.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus);
    }

    if (filterConfirmation !== 'all') {
      result = result.filter(e => e.confirmation_status === filterConfirmation);
    }

    if (filterDay !== 'all') {
      result = result.filter(e => e.preferred_days.includes(filterDay as Day));
    }

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
        case 'confirmation_status':
          comparison = (a.confirmation_status || '').localeCompare(b.confirmation_status || '');
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, archivedEntries, showArchived, search, filterStatus, filterConfirmation, filterDay, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const confirmationCounts = useMemo(() => ({
    active: entries.filter(e => e.confirmation_status === 'active').length,
    pending: entries.filter(e => e.confirmation_status === 'pending_confirmation').length,
    expired: entries.filter(e => e.confirmation_status === 'expired').length,
  }), [entries]);

  if (loading) {
    return (
      <Layout title="Wachtlijst">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Wachtlijst">
      {/* Confirmation warning banner */}
      {confirmationCounts.pending > 0 && !showArchived && (
        <div className="mb-6 p-4 bg-terracotta-50 border border-terracotta-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-terracotta-600">{Icons.warning}</span>
            <div className="flex-1">
              <p className="font-semibold text-terracotta-700">
                {confirmationCounts.pending} inschrijving(en) wachten op bevestiging
              </p>
              <p className="text-sm text-terracotta-600">
                Deze ouders hebben hun interesse nog niet bevestigd en kunnen binnenkort verlopen.
              </p>
            </div>
            <button
              onClick={() => setFilterConfirmation('pending_confirmation')}
              className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-800"
            >
              Bekijk
            </button>
          </div>
        </div>
      )}

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
        <div className="flex gap-2 flex-wrap">
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
            value={filterConfirmation}
            onChange={(e) => setFilterConfirmation(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Alle bevestigingen</option>
            <option value="active">Actief ({confirmationCounts.active})</option>
            <option value="pending_confirmation">Wacht op bevestiging ({confirmationCounts.pending})</option>
            <option value="expired">Verlopen ({confirmationCounts.expired})</option>
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
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`btn-outline flex items-center gap-2 ${showArchived ? 'bg-forest-500 text-white' : ''}`}
          >
            {Icons.archive}
            {showArchived ? 'Actief' : `Archief (${archivedEntries.length})`}
          </button>
          <Link to="/waitlist/new" className="btn-primary whitespace-nowrap">
            + Nieuwe inschrijving
          </Link>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedEntries.length > 0 && !showArchived && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-4">
          <span className="text-sm text-teal-700 font-medium">
            {selectedEntries.length} geselecteerd
          </span>
          <button
            onClick={handleBulkResetConfirmation}
            disabled={bulkAction}
            className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            {Icons.refresh}
            {bulkAction ? 'Bezig...' : 'Reset bevestigingsstatus'}
          </button>
          <button
            onClick={() => setSelectedEntries([])}
            className="text-sm text-navy-400 hover:text-navy-600 ml-auto"
          >
            Deselecteer
          </button>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-forest-600">{entries.length}</p>
          <p className="text-sm text-navy-400">Totaal</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-terracotta-500">
            {entries.filter(e => e.status === 'waiting').length}
          </p>
          <p className="text-sm text-navy-400">Wachtend</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-forest-500">
            {entries.filter(e => e.status === 'matched').length}
          </p>
          <p className="text-sm text-navy-400">Voorstel verstuurd</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-teal-600">
            {entries.filter(e => e.status === 'accepted').length}
          </p>
          <p className="text-sm text-navy-400">Geplaatst</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-bold text-terracotta-600">
            {confirmationCounts.pending}
          </p>
          <p className="text-sm text-navy-400">Wacht op bevestiging</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-50">
              <tr>
                {!showArchived && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === filteredAndSorted.length && filteredAndSorted.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-cream-300"
                    />
                  </th>
                )}
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-navy-400 uppercase">Dagen</th>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-navy-400 uppercase">Prioriteit</th>
                <SortHeader
                  label="Status"
                  field="status"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Bevestiging"
                  field="confirmation_status"
                  current={sortField}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-right text-xs font-semibold text-navy-400 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={showArchived ? 9 : 10} className="px-6 py-12 text-center text-navy-400">
                    {search || filterStatus !== 'all' || filterDay !== 'all' || filterConfirmation !== 'all'
                      ? 'Geen resultaten gevonden'
                      : showArchived ? 'Geen gearchiveerde inschrijvingen' : 'Nog geen inschrijvingen'}
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-cream-50 transition-colors">
                    {!showArchived && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry.id)}
                          onChange={() => toggleSelectEntry(entry.id)}
                          className="rounded border-cream-300"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-forest-600">{entry.child_name}</p>
                          <p className="text-xs text-navy-400 font-mono">{entry.access_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-navy-600">{entry.parent_name}</p>
                      {entry.parent_email && (
                        <p className="text-xs text-navy-400">{entry.parent_email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {DAYS.map(day => (
                          <span
                            key={day}
                            className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center ${
                              entry.preferred_days.includes(day)
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-cream-200 text-navy-300'
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-500">
                      {new Date(entry.desired_start_date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-500">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {entry.priority_factors.has_sibling && (
                          <span className="badge-blue" title="Broertje/zusje">B/Z</span>
                        )}
                        {entry.priority_factors.single_parent && (
                          <span className="badge-amber" title="Alleenstaand ouder">AO</span>
                        )}
                        {entry.priority_factors.custom && (
                          <span className="badge-gray" title={entry.priority_factors.custom}>+</span>
                        )}
                        {!entry.priority_factors.has_sibling && !entry.priority_factors.single_parent && !entry.priority_factors.custom && (
                          <span className="text-navy-300 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-6 py-4">
                      <ConfirmationBadge status={entry.confirmation_status} lastConfirmed={entry.last_confirmed_at} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {showArchived ? (
                          <button
                            onClick={() => handleRestore(entry)}
                            className="p-2 text-navy-300 hover:text-teal-600 rounded-lg hover:bg-cream-100"
                            title="Herstellen"
                          >
                            {Icons.restore}
                          </button>
                        ) : (
                          <>
                            {entry.confirmation_status !== 'active' && (
                              <button
                                onClick={() => handleResetConfirmation(entry)}
                                className="p-2 text-navy-300 hover:text-teal-600 rounded-lg hover:bg-cream-100"
                                title="Reset bevestigingsstatus"
                              >
                                {Icons.refresh}
                              </button>
                            )}
                            <Link
                              to={`/waitlist/${entry.id}/edit`}
                              className="p-2 text-navy-300 hover:text-forest-600 rounded-lg hover:bg-cream-100"
                              title="Bewerken"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => setShowDeleteModal(entry)}
                              className="p-2 text-navy-300 hover:text-terracotta-600 rounded-lg hover:bg-cream-100"
                              title="Verwijderen"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
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
        <div className="fixed inset-0 bg-forest-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <h3 className="text-lg font-serif font-bold text-forest-600 mb-2">
              Inschrijving verwijderen
            </h3>
            <p className="text-navy-500 mb-6">
              Weet je zeker dat je de inschrijving van <strong className="text-forest-600">{showDeleteModal.child_name}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-outline"
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
      className="px-6 py-3 text-left text-xs font-semibold text-navy-400 uppercase cursor-pointer hover:bg-cream-100"
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
    waiting: 'badge-amber',
    matched: 'badge-blue',
    accepted: 'badge-green',
    removed: 'badge-gray',
    pending_confirmation: 'badge-amber',
    expired: 'badge-red',
    archived: 'badge-gray',
  };

  const labels = {
    waiting: 'Wachtend',
    matched: 'Voorstel verstuurd',
    accepted: 'Geplaatst',
    removed: 'Verwijderd',
    pending_confirmation: 'Wacht op bevestiging',
    expired: 'Verlopen',
    archived: 'Gearchiveerd',
  };

  return (
    <span className={classes[status as keyof typeof classes] || 'badge-gray'}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function ConfirmationBadge({ status, lastConfirmed }: { status?: ConfirmationStatus; lastConfirmed?: string }) {
  const classes = {
    active: 'badge-green',
    pending_confirmation: 'badge-amber',
    expired: 'badge-red',
    archived: 'badge-gray',
  };

  const labels = {
    active: 'Actief',
    pending_confirmation: 'Wacht op bevestiging',
    expired: 'Verlopen',
    archived: 'Gearchiveerd',
  };

  if (!status) return <span className="text-navy-300 text-sm">-</span>;

  return (
    <div>
      <span className={classes[status] || 'badge-gray'}>
        {labels[status] || status}
      </span>
      {lastConfirmed && (
        <p className="text-xs text-navy-400 mt-1">
          {new Date(lastConfirmed).toLocaleDateString('nl-NL')}
        </p>
      )}
    </div>
  );
}
