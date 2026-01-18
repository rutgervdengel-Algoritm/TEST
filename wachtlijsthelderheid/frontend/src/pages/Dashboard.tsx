import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { analyticsApi, entriesApi, logApi } from '../utils/api';
import type { Analytics, WaitlistEntry, DecisionLogEntry, Day } from '../types';

const DAY_LABELS: Record<Day, string> = {
  MA: 'Maandag',
  DI: 'Dinsdag',
  WO: 'Woensdag',
  DO: 'Donderdag',
  VR: 'Vrijdag',
};

// Icons
const Icons = {
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  activity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  spot: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  match: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentEntries, setRecentEntries] = useState<WaitlistEntry[]>([]);
  const [recentLogs, setRecentLogs] = useState<DecisionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, entriesRes, logsRes] = await Promise.all([
          analyticsApi.get(),
          entriesApi.getAll(),
          logApi.getAll(),
        ]);
        setAnalytics(analyticsRes);
        setRecentEntries(entriesRes.entries.slice(-5).reverse());
        setRecentLogs(logsRes.logs.slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Wachtenden"
          value={analytics?.totalWaiting || 0}
          sublabel="Actief op wachtlijst"
          icon={Icons.users}
        />
        <StatCard
          label="Geplaatst"
          value={analytics?.acceptedCount || 0}
          sublabel="Totaal geplaatst"
          icon={Icons.check}
        />
        <StatCard
          label="Gem. wachttijd"
          value={`${analytics?.avgWaitTimeDays || 0}d`}
          sublabel="In dagen"
          icon={Icons.clock}
        />
        <StatCard
          label="Activiteit"
          value={analytics?.recentActivity || 0}
          sublabel="Laatste 7 dagen"
          icon={Icons.activity}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/waitlist/new"
          className="stat-card hover:border-primary-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-primary-200 transition-colors">
              {Icons.plus}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Nieuwe inschrijving</h3>
              <p className="text-sm text-gray-500">Kind toevoegen</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-primary-500 transition-colors">
            {Icons.arrow}
          </span>
        </Link>

        <Link
          to="/spots/new"
          className="stat-card hover:border-green-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
              {Icons.spot}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Plek beschikbaar</h3>
              <p className="text-sm text-gray-500">Vind de beste match</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-green-500 transition-colors">
            {Icons.arrow}
          </span>
        </Link>

        <Link
          to="/matches"
          className="stat-card hover:border-yellow-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 group-hover:bg-yellow-200 transition-colors">
              {Icons.match}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Bekijk matches</h3>
              <p className="text-sm text-gray-500">Lopende voorstellen</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-yellow-500 transition-colors">
            {Icons.arrow}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day demand chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Vraag per dag</h2>
          </div>
          <div className="card-body">
            {analytics && (
              <div className="space-y-3">
                {(Object.entries(analytics.dayDemand) as [Day, number][]).map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.dayDemand));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium text-gray-600">
                        {DAY_LABELS[day]}
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-semibold text-gray-900 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recente activiteit</h2>
            <Link to="/log" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Bekijk alles
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLogs.length === 0 ? (
              <div className="card-body text-center text-gray-500">
                Nog geen activiteit
              </div>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="px-6 py-3">
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.created_at).toLocaleString('nl-NL')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent entries */}
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Laatste inschrijvingen</h2>
            <Link to="/waitlist" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Bekijk alles
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ouder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dagen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startdatum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nog geen inschrijvingen
                    </td>
                  </tr>
                ) : (
                  recentEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {entry.child_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.parent_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.preferred_days.join(', ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(entry.desired_start_date).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          <p className="stat-sublabel">{sublabel}</p>
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          {icon}
        </div>
      </div>
    </div>
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
    matched: 'Voorstel',
    accepted: 'Geplaatst',
    removed: 'Verwijderd',
  };

  return (
    <span className={classes[status as keyof typeof classes] || 'badge-gray'}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
