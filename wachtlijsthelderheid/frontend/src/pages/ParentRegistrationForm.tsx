import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { parentApi, setAuthToken, StandaloneRegistration } from '../utils/api';

const DAYS = ['MA', 'DI', 'WO', 'DO', 'VR'];
const STATUS_OPTIONS = [
  { value: 'waiting', label: 'Wachtend' },
  { value: 'offered', label: 'Aangeboden' },
  { value: 'accepted', label: 'Geaccepteerd' },
  { value: 'rejected', label: 'Afgewezen' }
];

export default function ParentRegistrationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [organizationName, setOrganizationName] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [organizationPhone, setOrganizationPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthdate, setChildBirthdate] = useState('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('parentToken');
    if (!token) {
      navigate('/ouder/login');
      return;
    }
    setAuthToken(token);

    if (isEdit && id) {
      loadRegistration(parseInt(id));
    }
  }, [id, isEdit, navigate]);

  const loadRegistration = async (regId: number) => {
    try {
      setLoading(true);
      const result = await parentApi.getRegistration(regId);
      const reg = result.registration;
      setOrganizationName(reg.organization_name);
      setOrganizationEmail(reg.organization_email || '');
      setOrganizationAddress(reg.organization_address || '');
      setOrganizationPhone(reg.organization_phone || '');
      setChildName(reg.child_name);
      setChildBirthdate(reg.child_birthdate || '');
      setPreferredDays(reg.preferred_days || []);
      setDesiredStartDate(reg.desired_start_date || '');
      setRegistrationDate(reg.registration_date || '');
      setNotes(reg.notes || '');
      setStatus(reg.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon inschrijving niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setPreferredDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const data: Partial<StandaloneRegistration> = {
      organization_name: organizationName,
      organization_email: organizationEmail || null,
      organization_address: organizationAddress || null,
      organization_phone: organizationPhone || null,
      child_name: childName,
      child_birthdate: childBirthdate || null,
      preferred_days: preferredDays,
      desired_start_date: desiredStartDate || null,
      registration_date: registrationDate || null,
      notes: notes || null,
      status: status as 'waiting' | 'offered' | 'accepted' | 'rejected'
    };

    try {
      if (isEdit && id) {
        await parentApi.updateRegistration(parseInt(id), data);
      } else {
        await parentApi.createRegistration(data);
      }
      navigate('/ouder/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/ouder/dashboard" className="text-teal-600 hover:text-teal-800 text-sm">
            Terug naar overzicht
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            {isEdit ? 'Inschrijving bewerken' : 'Nieuwe inschrijving'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Organization info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organisatie gegevens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam kinderdagverblijf / BSO *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email organisatie
                </label>
                <input
                  type="email"
                  value={organizationEmail}
                  onChange={(e) => setOrganizationEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Voor bevestigingsmail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon organisatie
                </label>
                <input
                  type="tel"
                  value={organizationPhone}
                  onChange={(e) => setOrganizationPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres / Locatie
                </label>
                <input
                  type="text"
                  value={organizationAddress}
                  onChange={(e) => setOrganizationAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Child info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kind gegevens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam kind *
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geboortedatum
                </label>
                <input
                  type="date"
                  value={childBirthdate}
                  onChange={(e) => setChildBirthdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Voorkeuren</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gewenste dagen
                </label>
                <div className="flex gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 rounded-md border ${
                        preferredDays.includes(day)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gewenste startdatum
                  </label>
                  <input
                    type="date"
                    value={desiredStartDate}
                    onChange={(e) => setDesiredStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inschrijfdatum
                  </label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notities
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Bijzonderheden, allergieën, etc."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : isEdit ? 'Wijzigingen opslaan' : 'Inschrijving toevoegen'}
            </button>
            <Link
              to="/ouder/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Annuleren
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
