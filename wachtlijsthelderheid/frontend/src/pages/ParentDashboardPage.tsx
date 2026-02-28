import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parentApi, StandaloneRegistration, ParentDashboardStats, setAuthToken } from '../utils/api';
import {
  Plus, Eye, Send, Trash2, LogOut, User,
  Clock, CheckCircle, Link2, AlertCircle,
  Building2, Calendar, Baby, ChevronRight
} from 'lucide-react';

interface ParentUser {
  id: number;
  email: string;
  name: string;
}

export default function ParentDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ParentUser | null>(null);
  const [registrations, setRegistrations] = useState<StandaloneRegistration[]>([]);
  const [stats, setStats] = useState<ParentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('parentToken');
    const userStr = localStorage.getItem('parentUser');

    if (!token || !userStr) {
      navigate('/ouder/login');
      return;
    }

    try {
      setAuthToken(token);
      setUser(JSON.parse(userStr));
      loadData();
    } catch {
      navigate('/ouder/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('parentToken');
    localStorage.removeItem('parentUser');
    setAuthToken(null);
    navigate('/ouder/login');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [regResult, statsResult] = await Promise.all([
        parentApi.getRegistrations(),
        parentApi.getDashboard()
      ]);
      setRegistrations(regResult.registrations);
      setStats(statsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleSendConfirmation = async (id: number) => {
    try {
      await parentApi.sendConfirmation(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Versturen mislukt');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;
    try {
      await parentApi.deleteRegistration(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verwijderen mislukt');
    }
  };

  const getStatusBadge = (status: string, isLinked: boolean) => {
    if (isLinked) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success-100 text-success-600 text-xs font-medium rounded-full">
          <Link2 className="w-3 h-3" />
          Gekoppeld
        </span>
      );
    }
    const styles: Record<string, string> = {
      waiting: 'bg-warning-100 text-warning-600',
      offered: 'bg-primary-100 text-primary-600',
      accepted: 'bg-success-100 text-success-600',
      rejected: 'bg-error-100 text-error-600'
    };
    const labels: Record<string, string> = {
      waiting: 'Wachtend',
      offered: 'Aangeboden',
      accepted: 'Geaccepteerd',
      rejected: 'Afgewezen'
    };
    const icons: Record<string, React.ReactNode> = {
      waiting: <Clock className="w-3 h-3" />,
      offered: <AlertCircle className="w-3 h-3" />,
      accepted: <CheckCircle className="w-3 h-3" />,
      rejected: <AlertCircle className="w-3 h-3" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${styles[status] || 'bg-gray-100 text-gray-600'} text-xs font-medium rounded-full`}>
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getDaysSinceConfirmation = (lastSent: string | null) => {
    if (!lastSent) return null;
    const days = Math.floor((Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mijn Inschrijvingen</h1>
              <p className="text-sm text-gray-600">Welkom, {user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/ouder/profiel"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-sm hover:bg-gray-100 transition-all duration-200"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-sm hover:bg-gray-100 transition-all duration-200"
                title="Uitloggen"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-md p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.registrations.total}</div>
                  <div className="text-sm text-gray-600">Totaal</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.registrations.waiting}</div>
                  <div className="text-sm text-gray-600">Wachtend</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.registrations.linked}</div>
                  <div className="text-sm text-gray-600">Gekoppeld</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-md p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.needsConfirmation}</div>
                  <div className="text-sm text-gray-600">Bevestigen</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Inschrijvingen</h2>
          <Link
            to="/ouder/inschrijving/nieuw"
            className="bg-primary-500 text-white px-4 py-2.5 rounded-sm font-medium hover:bg-primary-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuwe inschrijving
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-50 border border-error-100 text-error-600 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && registrations.length === 0 && (
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen inschrijvingen</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Voeg je eerste inschrijving toe om te beginnen met het beheren van je wachtlijst aanmeldingen.
            </p>
            <Link
              to="/ouder/inschrijving/nieuw"
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-sm font-medium hover:bg-primary-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              Eerste inschrijving toevoegen
            </Link>
          </div>
        )}

        {/* Registrations List */}
        {!loading && registrations.length > 0 && (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const daysSince = getDaysSinceConfirmation(reg.last_confirmation_sent);
              const needsConfirmation = reg.confirmationNeeded && reg.status === 'waiting';

              return (
                <div
                  key={reg.id}
                  className={`bg-white rounded-md p-5 shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    needsConfirmation ? 'border-l-4 border-l-warning-500 border-t-gray-100 border-r-gray-100 border-b-gray-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{reg.organization_name}</h3>
                        {getStatusBadge(reg.status, reg.isLinked || false)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Baby className="w-4 h-4" />
                          {reg.child_name}
                        </span>
                        {reg.preferred_days && reg.preferred_days.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {reg.preferred_days.join(', ')}
                          </span>
                        )}
                        {reg.desired_start_date && (
                          <span>Start: {reg.desired_start_date}</span>
                        )}
                      </div>

                      {/* Confirmation status */}
                      {!reg.isLinked && (
                        <div className="mt-2">
                          {daysSince !== null ? (
                            <span className={`text-xs ${daysSince > 30 ? 'text-warning-600 font-medium' : 'text-gray-500'}`}>
                              {daysSince} dagen sinds laatste bevestiging
                            </span>
                          ) : (
                            <span className="text-xs text-warning-600 font-medium">
                              Nog geen bevestiging verstuurd
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/ouder/inschrijving/${reg.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-sm transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Bekijken</span>
                      </Link>
                      {!reg.isLinked && reg.organization_email && (
                        <button
                          onClick={() => handleSendConfirmation(reg.id)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 rounded-sm transition-all duration-200"
                        >
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">Bevestig</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reg.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-sm transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/ouder/inschrijving/${reg.id}`}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Linked info */}
                  {reg.isLinked && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-success-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Gekoppeld aan organisatie - bekijk de volledige status in het portaal
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-primary-50 border border-primary-100 rounded-md p-6">
          <h3 className="font-semibold text-primary-900 mb-3">Hoe werkt het?</h3>
          <ol className="text-sm text-primary-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium text-primary-700">1</span>
              Voeg je inschrijvingen toe bij verschillende kinderdagverblijven
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium text-primary-700">2</span>
              Stuur maandelijks een bevestigingsmail om je interesse te bevestigen
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium text-primary-700">3</span>
              Als een organisatie Wait gaat gebruiken, ontvang je een toegangscode
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary-200 rounded-full flex items-center justify-center text-xs font-medium text-primary-700">4</span>
              Koppel de code aan je inschrijving om je positie en kansen te zien
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
