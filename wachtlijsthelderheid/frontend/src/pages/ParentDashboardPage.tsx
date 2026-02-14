import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parentApi, StandaloneRegistration, ParentDashboardStats, setAuthToken } from '../utils/api';

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
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Gekoppeld</span>;
    }
    const styles: Record<string, string> = {
      waiting: 'bg-yellow-100 text-yellow-800',
      offered: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      waiting: 'Wachtend',
      offered: 'Aangeboden',
      accepted: 'Geaccepteerd',
      rejected: 'Afgewezen'
    };
    return (
      <span className={`px-2 py-1 ${styles[status] || 'bg-gray-100 text-gray-800'} text-xs rounded-full`}>
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mijn Inschrijvingen</h1>
            <p className="text-sm text-gray-600">Welkom, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/ouder/profiel"
              className="text-gray-600 hover:text-gray-900"
            >
              Profiel
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-teal-600">{stats.registrations.total}</div>
              <div className="text-sm text-gray-600">Totaal inschrijvingen</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.registrations.waiting}</div>
              <div className="text-sm text-gray-600">Wachtend</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.registrations.linked}</div>
              <div className="text-sm text-gray-600">Gekoppeld</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.needsConfirmation}</div>
              <div className="text-sm text-gray-600">Bevestiging nodig</div>
            </div>
          </div>
        )}

        {/* Add button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Inschrijvingen</h2>
          <Link
            to="/ouder/inschrijving/nieuw"
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
          >
            + Nieuwe inschrijving
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-gray-600">Laden...</div>
        )}

        {/* Empty state */}
        {!loading && registrations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Je hebt nog geen inschrijvingen.</p>
            <Link
              to="/ouder/inschrijving/nieuw"
              className="inline-block bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700"
            >
              Eerste inschrijving toevoegen
            </Link>
          </div>
        )}

        {/* Registrations list */}
        {!loading && registrations.length > 0 && (
          <div className="space-y-4">
            {registrations.map((reg) => {
              const daysSince = getDaysSinceConfirmation(reg.last_confirmation_sent);
              const needsConfirmation = reg.confirmationNeeded && reg.status === 'waiting';

              return (
                <div
                  key={reg.id}
                  className={`bg-white rounded-lg shadow p-4 ${needsConfirmation ? 'border-l-4 border-orange-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{reg.organization_name}</h3>
                        {getStatusBadge(reg.status, reg.isLinked || false)}
                      </div>
                      <p className="text-sm text-gray-600">Kind: {reg.child_name}</p>
                      {reg.preferred_days && reg.preferred_days.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Dagen: {reg.preferred_days.join(', ')}
                        </p>
                      )}
                      {reg.desired_start_date && (
                        <p className="text-sm text-gray-600">
                          Gewenste start: {reg.desired_start_date}
                        </p>
                      )}
                      {reg.registration_date && (
                        <p className="text-sm text-gray-500">
                          Inschrijfdatum: {reg.registration_date}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Confirmation status */}
                      {!reg.isLinked && (
                        <div className="text-right">
                          {daysSince !== null ? (
                            <span className={`text-xs ${daysSince > 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                              {daysSince} dagen sinds laatste bevestiging
                            </span>
                          ) : (
                            <span className="text-xs text-orange-600">
                              Nog geen bevestiging verstuurd
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/ouder/inschrijving/${reg.id}`}
                          className="text-sm text-teal-600 hover:text-teal-800"
                        >
                          Bekijken
                        </Link>
                        {!reg.isLinked && reg.organization_email && (
                          <button
                            onClick={() => handleSendConfirmation(reg.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Bevestig
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Verwijder
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Linked info */}
                  {reg.isLinked && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-green-700">
                        Gekoppeld aan organisatie - bekijk de volledige status in het portaal
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Hoe werkt het?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Voeg je inschrijvingen toe bij verschillende kinderdagverblijven</li>
            <li>2. Stuur maandelijks een bevestigingsmail om je interesse te bevestigen</li>
            <li>3. Als een organisatie WachtlijstHelderheid gaat gebruiken, ontvang je een toegangscode</li>
            <li>4. Koppel de code aan je inschrijving om je positie en kansen te zien</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
