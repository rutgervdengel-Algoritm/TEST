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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
          icon="👶"
          color="blue"
        />
        <StatCard
          label="Geplaatst"
          value={analytics?.acceptedCount || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Gem. wachttijd"
          value={`${analytics?.avgWaitTimeDays || 0} dagen`}
          icon="⏱️"
          color="yellow"
        />
        <StatCard
          label="Activiteit (7d)"
          value={analytics?.recentActivity || 0}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/waitlist/new"
          className="card p-4 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <span className="text-2xl">➕</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Nieuwe inschrijving</h3>
              <p className="text-sm text-gray-500">Kind toevoegen aan wachtlijst</p>
            </div>
          </div>
        </Link>

        <Link
          to="/spots/new"
          className="card p-4 hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Plek beschikbaar</h3>
              <p className="text-sm text-gray-500">Vind de beste match</p>
            </div>
          </div>
        </Link>

        <Link
          to="/matches"
          className="card p-4 hover:border-yellow-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
              <span className="text-2xl">🤝</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Bekijk matches</h3>
              <p className="text-sm text-gray-500">Lopende voorstellen beheren</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      <div className="w-24 text-sm font-medium text-gray-600">
                        {DAY_LABELS[day]}
                      </div>
                      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-lg transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-medium text-gray-900 text-right">
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
            <Link to="/log" className="text-sm text-primary-600 hover:text-primary-700">
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
                  <p className="text-xs text-gray-500 mt-1">
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
            <Link to="/waitlist" className="text-sm text-primary-600 hover:text-primary-700">
              Bekijk alles
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kind</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ouder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dagen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Startdatum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
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
