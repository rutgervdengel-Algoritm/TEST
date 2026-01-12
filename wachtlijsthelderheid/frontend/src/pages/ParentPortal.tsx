import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { portalApi } from '../utils/api';
import type { PortalData, Day, Match } from '../types';

const DAYS: { value: Day; label: string }[] = [
  { value: 'MA', label: 'Maandag' },
  { value: 'DI', label: 'Dinsdag' },
  { value: 'WO', label: 'Woensdag' },
  { value: 'DO', label: 'Donderdag' },
  { value: 'VR', label: 'Vrijdag' },
];

export default function ParentPortal() {
  const { accessCode: urlCode } = useParams();
  const navigate = useNavigate();

  const [accessCode, setAccessCode] = useState(urlCode || '');
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingPreferences, setEditingPreferences] = useState(false);
  const [preferredDays, setPreferredDays] = useState<Day[]>([]);
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [respondingMatch, setRespondingMatch] = useState<Match | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (urlCode) {
      loadPortalData(urlCode);
    }
  }, [urlCode]);

  async function loadPortalData(code: string) {
    setLoading(true);
    setError('');

    try {
      const result = await portalApi.get(code);
      setData(result);
      setPreferredDays(result.entry.preferred_days);
      setDesiredStartDate(result.entry.desired_start_date);
      setNotes(result.entry.notes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ongeldige toegangscode');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (accessCode.trim()) {
      navigate(`/portal/${accessCode.trim().toUpperCase()}`);
    }
  }

  function toggleDay(day: Day) {
    setPreferredDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }

  async function handleSavePreferences() {
    if (!data) return;

    setSaving(true);
    try {
      const result = await portalApi.updatePreferences(data.entry.access_code, {
        preferred_days: preferredDays,
        desired_start_date: desiredStartDate,
        notes,
      });
      setData(prev => prev ? {
        ...prev,
        entry: result.entry,
        position: result.position,
      } : null);
      setEditingPreferences(false);
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRespondToMatch(accept: boolean) {
    if (!data || !respondingMatch) return;

    setResponding(true);
    try {
      await portalApi.respondToMatch(
        data.entry.access_code,
        respondingMatch.id,
        accept,
        accept ? undefined : rejectionReason
      );
      // Reload data
      await loadPortalData(data.entry.access_code);
      setRespondingMatch(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error responding to match:', err);
    } finally {
      setResponding(false);
    }
  }

  // Access code entry screen
  if (!urlCode || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
              <span className="text-white font-bold text-2xl">WH</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ouder Portal</h1>
            <p className="text-gray-600 mt-1">Bekijk uw wachtlijstpositie</p>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Voer uw toegangscode in</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label htmlFor="accessCode" className="label">Toegangscode</label>
                  <input
                    type="text"
                    id="accessCode"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="input font-mono text-lg tracking-wider"
                    placeholder="WL-XXXXXX"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deze code heeft u ontvangen bij uw inschrijving
                  </p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Laden...' : 'Bekijk mijn positie'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                  Beheerder? Log hier in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main portal view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">WH</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{data.organization}</h1>
                <p className="text-sm text-gray-500">Wachtlijst portaal</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/portal')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Position card */}
        <div className="card mb-6 overflow-hidden">
          <div className={`p-6 text-white ${
            data.position.matchChance === 'high' ? 'bg-gradient-to-r from-green-500 to-green-600' :
            data.position.matchChance === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Uw positie op de wachtlijst</p>
                <p className="text-5xl font-bold">
                  #{data.position.position}
                  <span className="text-2xl font-normal text-white/70 ml-2">
                    van {data.position.total}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Match-kans</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {data.position.matchChance === 'high' ? '😊' :
                     data.position.matchChance === 'medium' ? '😐' : '😟'}
                  </span>
                  <span className="text-xl font-semibold capitalize">
                    {data.position.matchChance === 'high' ? 'Hoog' :
                     data.position.matchChance === 'medium' ? 'Gemiddeld' : 'Laag'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              <strong>Transparantie:</strong> Er staan {data.position.aheadInfo.total} mensen voor u
              {data.position.aheadInfo.withSibling > 0 && (
                <>, waarvan {data.position.aheadInfo.withSibling} met broertje/zusje prioriteit</>
              )}.
            </p>
          </div>
        </div>

        {/* Pending matches */}
        {data.pendingMatches.length > 0 && (
          <div className="card mb-6 border-2 border-green-500">
            <div className="card-header bg-green-50">
              <h2 className="font-semibold text-green-800">
                🎉 U heeft een voorstel!
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.pendingMatches.map(match => (
                <div key={match.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        Plek beschikbaar: {match.days.join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Startdatum: {match.start_date ? new Date(match.start_date).toLocaleDateString('nl-NL') : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{Math.round(match.match_score)}%</p>
                      <p className="text-xs text-gray-500">match score</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRespondToMatch(true) || setRespondingMatch(match)}
                      className="btn-success flex-1"
                    >
                      Accepteren
                    </button>
                    <button
                      onClick={() => setRespondingMatch(match)}
                      className="btn-secondary flex-1"
                    >
                      Afwijzen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection modal */}
        {respondingMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full animate-fade-in">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Voorstel afwijzen
                </h3>
                <p className="text-gray-600 mb-4">
                  Weet u zeker dat u dit voorstel wilt afwijzen? U blijft op de wachtlijst staan.
                </p>
                <div className="mb-4">
                  <label htmlFor="reason" className="label">Reden (optioneel)</label>
                  <textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Bijv. dagen passen niet, startdatum te laat, etc."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setRespondingMatch(null);
                      setRejectionReason('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={() => handleRespondToMatch(false)}
                    disabled={responding}
                    className="btn-danger flex-1"
                  >
                    {responding ? 'Bezig...' : 'Afwijzen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Child info */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Inschrijving</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-sm text-gray-500">Kind</p>
                <p className="font-medium text-gray-900">{data.entry.child_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ouder/verzorger</p>
                <p className="font-medium text-gray-900">{data.entry.parent_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Toegangscode</p>
                <p className="font-mono text-gray-900">{data.entry.access_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingeschreven op</p>
                <p className="font-medium text-gray-900">
                  {new Date(data.entry.created_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Uw voorkeuren</h2>
              {!editingPreferences && (
                <button
                  onClick={() => setEditingPreferences(true)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Aanpassen
                </button>
              )}
            </div>
            <div className="card-body">
              {editingPreferences ? (
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                    ⚠️ Let op: het aanpassen van uw voorkeuren kan uw positie op de wachtlijst beïnvloeden.
                  </div>

                  <div>
                    <label className="label">Gewenste dagen</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={preferredDays.includes(day.value) ? 'day-btn-selected' : 'day-btn-unselected'}
                        >
                          {day.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="startDate" className="label">Gewenste startdatum</label>
                    <input
                      type="date"
                      id="startDate"
                      value={desiredStartDate}
                      onChange={(e) => setDesiredStartDate(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="label">Opmerkingen</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setPreferredDays(data.entry.preferred_days);
                        setDesiredStartDate(data.entry.desired_start_date);
                        setNotes(data.entry.notes || '');
                        setEditingPreferences(false);
                      }}
                      className="btn-secondary flex-1"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      disabled={saving}
                      className="btn-primary flex-1"
                    >
                      {saving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Gewenste dagen</p>
                    <div className="flex gap-1 mt-1">
                      {DAYS.map(day => (
                        <span
                          key={day.value}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                            data.entry.preferred_days.includes(day.value)
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gewenste startdatum</p>
                    <p className="font-medium text-gray-900">
                      {new Date(data.entry.desired_start_date).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  {data.entry.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Opmerkingen</p>
                      <p className="text-gray-900">{data.entry.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card mt-6">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Tijdlijn</h2>
          </div>
          <div className="card-body">
            {data.timeline.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nog geen gebeurtenissen</p>
            ) : (
              <div className="space-y-4">
                {data.timeline.map(event => (
                  <div key={event.id} className="flex gap-4">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString('nl-NL')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Vragen over uw inschrijving? Neem contact op met {data.organization}.
          </p>
        </div>
      </main>
    </div>
  );
}
