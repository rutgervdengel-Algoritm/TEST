import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { entriesApi } from '../utils/api';
import type { Day, PriorityFactors } from '../types';

const DAYS: { value: Day; label: string }[] = [
  { value: 'MA', label: 'Maandag' },
  { value: 'DI', label: 'Dinsdag' },
  { value: 'WO', label: 'Woensdag' },
  { value: 'DO', label: 'Donderdag' },
  { value: 'VR', label: 'Vrijdag' },
];

export default function EntryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [preferredDays, setPreferredDays] = useState<Day[]>([]);
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [hasSibling, setHasSibling] = useState(false);
  const [singleParent, setSingleParent] = useState(false);
  const [customPriority, setCustomPriority] = useState('');
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      loadEntry(parseInt(id));
    }
  }, [id, isEditing]);

  async function loadEntry(entryId: number) {
    try {
      const response = await entriesApi.get(entryId);
      const entry = response.entry;
      setParentName(entry.parent_name);
      setParentEmail(entry.parent_email || '');
      setChildName(entry.child_name);
      setChildBirthdate(entry.child_birthdate || '');
      setPreferredDays(entry.preferred_days);
      setDesiredStartDate(entry.desired_start_date);
      setNotes(entry.notes || '');
      setHasSibling(entry.priority_factors.has_sibling || false);
      setSingleParent(entry.priority_factors.single_parent || false);
      setCustomPriority(entry.priority_factors.custom || '');
      setAccessCode(entry.access_code);
    } catch (error) {
      console.error('Error loading entry:', error);
      setError('Kon inschrijving niet laden');
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(day: Day) {
    setPreferredDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (preferredDays.length === 0) {
      setError('Selecteer minimaal één dag');
      return;
    }

    setSaving(true);

    const data = {
      parent_name: parentName,
      parent_email: parentEmail || undefined,
      child_name: childName,
      child_birthdate: childBirthdate || undefined,
      preferred_days: preferredDays,
      desired_start_date: desiredStartDate,
      notes: notes || undefined,
      priority_factors: {
        has_sibling: hasSibling,
        single_parent: singleParent,
        custom: customPriority || undefined,
      } as PriorityFactors,
    };

    try {
      if (isEditing && id) {
        await entriesApi.update(parseInt(id), data);
      } else {
        await entriesApi.create(data);
      }
      navigate('/waitlist');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout title={isEditing ? 'Inschrijving bewerken' : 'Nieuwe inschrijving'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? 'Inschrijving bewerken' : 'Nieuwe inschrijving'}>
      <div className="max-w-2xl">
        <Link to="/waitlist" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar wachtlijst
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Feature 6: Access code with QR code display */}
          {isEditing && accessCode && (
            <div className="card p-4 bg-primary-50 border-primary-200">
              <div className="flex items-start gap-6">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      `${window.location.origin}/portal/${accessCode}`
                    )}`}
                    alt={`QR code voor ${accessCode}`}
                    className="w-[120px] h-[120px] rounded-lg border border-primary-200"
                  />
                </div>
                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-800">Toegangscode ouder portal</p>
                  <p className="text-xl font-mono font-bold text-primary-900 mt-1">{accessCode}</p>
                  <p className="text-xs text-primary-600 mt-2">
                    Scan de QR-code of gebruik de code om in te loggen op het ouderportaal.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(accessCode)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopieer code
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/portal/${accessCode}`)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Kopieer link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <title>Toegangscode - ${accessCode}</title>
                                <style>
                                  body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
                                  h1 { font-size: 18px; color: #333; margin-bottom: 20px; }
                                  .qr { margin: 20px auto; }
                                  .code { font-family: monospace; font-size: 28px; font-weight: bold; margin: 20px 0; }
                                  .info { color: #666; font-size: 14px; max-width: 300px; margin: 0 auto; }
                                  .url { font-size: 12px; color: #999; margin-top: 20px; word-break: break-all; }
                                </style>
                              </head>
                              <body>
                                <h1>Ouder Portal Toegangscode</h1>
                                <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/portal/${accessCode}`)}" />
                                <div class="code">${accessCode}</div>
                                <p class="info">Scan de QR-code of ga naar het ouderportaal en voer de bovenstaande code in.</p>
                                <p class="url">${window.location.origin}/portal/${accessCode}</p>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parent info */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Gegevens ouder/verzorger</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="parentName" className="label">Naam ouder/verzorger *</label>
                <input
                  type="text"
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="input"
                  placeholder="Volledige naam"
                  required
                />
              </div>
              <div>
                <label htmlFor="parentEmail" className="label">Email (optioneel)</label>
                <input
                  type="email"
                  id="parentEmail"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="input"
                  placeholder="email@voorbeeld.nl"
                />
                <p className="text-xs text-gray-500 mt-1">Voor het versturen van notificaties</p>
              </div>
            </div>
          </div>

          {/* Child info */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Gegevens kind</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="childName" className="label">Naam kind *</label>
                <input
                  type="text"
                  id="childName"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="input"
                  placeholder="Volledige naam"
                  required
                />
              </div>
              <div>
                <label htmlFor="childBirthdate" className="label">Geboortedatum (optioneel)</label>
                <input
                  type="date"
                  id="childBirthdate"
                  value={childBirthdate}
                  onChange={(e) => setChildBirthdate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Voorkeuren</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Gewenste dagen *</label>
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
                <p className="text-xs text-gray-500 mt-2">
                  Geselecteerd: {preferredDays.length > 0 ? preferredDays.join(', ') : 'Geen'}
                </p>
              </div>
              <div>
                <label htmlFor="desiredStartDate" className="label">Gewenste startdatum *</label>
                <input
                  type="date"
                  id="desiredStartDate"
                  value={desiredStartDate}
                  onChange={(e) => setDesiredStartDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="notes" className="label">Opmerkingen (optioneel)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Bijzonderheden, allergieën, etc."
                />
              </div>
            </div>
          </div>

          {/* Priority factors */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Prioriteitscriteria</h2>
              <p className="text-sm text-gray-500">Deze factoren beïnvloeden de positie op de wachtlijst</p>
            </div>
            <div className="card-body space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSibling}
                  onChange={(e) => setHasSibling(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Broertje/zusje op locatie</p>
                  <p className="text-sm text-gray-500">Er is al een kind van dit gezin ingeschreven</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleParent}
                  onChange={(e) => setSingleParent(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Alleenstaand ouder</p>
                  <p className="text-sm text-gray-500">Eenoudergezin</p>
                </div>
              </label>

              <div>
                <label htmlFor="customPriority" className="label">Overige prioriteit (optioneel)</label>
                <input
                  type="text"
                  id="customPriority"
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value)}
                  className="input"
                  placeholder="Bijv. medische indicatie, medewerker, etc."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link to="/waitlist" className="btn-secondary">
              Annuleren
            </Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Opslaan...' : isEditing ? 'Wijzigingen opslaan' : 'Inschrijving toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
