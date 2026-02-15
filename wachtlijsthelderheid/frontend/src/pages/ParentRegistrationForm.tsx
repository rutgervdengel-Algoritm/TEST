import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { parentApi, setAuthToken, StandaloneRegistration } from '../utils/api';
import {
  ArrowLeft, Save, Building2, Mail, Phone, MapPin,
  Baby, Calendar, Clock, FileText, CheckCircle
} from 'lucide-react';

const DAYS = ['MA', 'DI', 'WO', 'DO', 'VR'];
const STATUS_OPTIONS = [
  { value: 'waiting', label: 'Wachtend', icon: Clock },
  { value: 'offered', label: 'Aangeboden', icon: CheckCircle },
  { value: 'accepted', label: 'Geaccepteerd', icon: CheckCircle },
  { value: 'rejected', label: 'Afgewezen', icon: CheckCircle }
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

  const toggleDay = (day: string) => {
    setPreferredDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
          <Link
            to="/ouder/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar overzicht
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">
            {isEdit ? 'Inschrijving bewerken' : 'Nieuwe inschrijving'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Error */}
        {error && (
          <div className="bg-error-50 border border-error-100 text-error-600 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Section */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Organisatie</h2>
                <p className="text-sm text-gray-600">Gegevens van het kinderdagverblijf</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Organization Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam kinderdagverblijf <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Bijv. Kinderdagverblijf De Zonnetjes"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={organizationEmail}
                    onChange={(e) => setOrganizationEmail(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="info@kdv.nl"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Nodig voor bevestigingsmails</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={organizationPhone}
                    onChange={(e) => setOrganizationPhone(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="020-1234567"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={organizationAddress}
                    onChange={(e) => setOrganizationAddress(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Straat 123, 1234 AB Plaats"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Child Section */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                <Baby className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Kind gegevens</h2>
                <p className="text-sm text-gray-600">Informatie over je kind</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Child Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam kind <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Baby className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Voornaam"
                    required
                  />
                </div>
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geboortedatum
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={childBirthdate}
                    onChange={(e) => setChildBirthdate(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Preferred Days */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gewenste dagen
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-sm font-medium text-sm transition-all duration-200 ${
                        preferredDays.includes(day)
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desired Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gewenste startdatum
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={desiredStartDate}
                    onChange={(e) => setDesiredStartDate(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Registration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inschrijfdatum
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Notes Section */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Status & Notities</h2>
                <p className="text-sm text-gray-600">Aanvullende informatie</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`px-4 py-3 rounded-sm font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        status === opt.value
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notities
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-y"
                  placeholder="Eventuele opmerkingen of bijzonderheden..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              to="/ouder/dashboard"
              className="px-6 py-3 rounded-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-500 text-white px-6 py-3 rounded-sm font-medium hover:bg-primary-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? 'Wijzigingen opslaan' : 'Inschrijving toevoegen'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
