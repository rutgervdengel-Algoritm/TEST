import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analyticsApi } from '../utils/api';
import type { Analytics as AnalyticsData, Day } from '../types';

const DAY_LABELS: Record<Day, string> = {
  MA: 'Maandag',
  DI: 'Dinsdag',
  WO: 'Woensdag',
  DO: 'Donderdag',
  VR: 'Vrijdag',
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const data = await analyticsApi.get();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout title="Analytics">
        <div className="text-center text-gray-500">Kon analytics niet laden</div>
      </Layout>
    );
  }

  const maxDayDemand = Math.max(...Object.values(analytics.dayDemand));
  const totalDayDemand = Object.values(analytics.dayDemand).reduce((a, b) => a + b, 0);
  const conversionRate = analytics.totalEntries > 0
    ? Math.round((analytics.acceptedCount / analytics.totalEntries) * 100)
    : 0;

  return (
    <Layout title="Analytics">
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Totaal wachtenden"
          value={analytics.totalWaiting}
          icon="👶"
          color="blue"
          subtext="Actief op wachtlijst"
        />
        <MetricCard
          label="Geplaatst"
          value={analytics.acceptedCount}
          icon="✅"
          color="green"
          subtext={`${conversionRate}% conversie`}
        />
        <MetricCard
          label="Gem. wachttijd"
          value={`${analytics.avgWaitTimeDays} dagen`}
          icon="⏱️"
          color="yellow"
          subtext="Voor geplaatste kinderen"
        />
        <MetricCard
          label="Activiteit (7d)"
          value={analytics.recentActivity}
          icon="📊"
          color="purple"
          subtext="Acties in logboek"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Day demand chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Vraag per dag</h2>
            <p className="text-sm text-gray-500">Aantal aanvragen per dag van de week</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {(Object.entries(analytics.dayDemand) as [Day, number][]).map(([day, count]) => {
                const percentage = maxDayDemand > 0 ? (count / maxDayDemand) * 100 : 0;
                const sharePercentage = totalDayDemand > 0 ? Math.round((count / totalDayDemand) * 100) : 0;

                return (
                  <div key={day}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                      <span className="text-sm text-gray-500">
                        {count} aanvragen ({sharePercentage}%)
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <strong>Inzicht:</strong>{' '}
                {getMostPopularDay(analytics.dayDemand)} is de meest gevraagde dag
                met {analytics.dayDemand[getMostPopularDay(analytics.dayDemand)]} aanvragen.
              </p>
            </div>
          </div>
        </div>

        {/* Funnel / conversion */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Wachtlijst funnel</h2>
            <p className="text-sm text-gray-500">Van inschrijving tot plaatsing</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <FunnelStep
                label="Totaal ingeschreven"
                value={analytics.totalEntries}
                percentage={100}
                color="gray"
              />
              <FunnelStep
                label="Actief wachtend"
                value={analytics.totalWaiting}
                percentage={analytics.totalEntries > 0 ? (analytics.totalWaiting / analytics.totalEntries) * 100 : 0}
                color="yellow"
              />
              <FunnelStep
                label="Geplaatst"
                value={analytics.acceptedCount}
                percentage={analytics.totalEntries > 0 ? (analytics.acceptedCount / analytics.totalEntries) * 100 : 0}
                color="green"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
                  <p className="text-sm text-gray-500">Conversie ratio</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{analytics.avgWaitTimeDays}</p>
                  <p className="text-sm text-gray-500">Gem. wachtdagen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Inzichten & aanbevelingen</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                icon="📈"
                title="Piekdagen"
                description={`${getMostPopularDay(analytics.dayDemand)} en ${getSecondMostPopularDay(analytics.dayDemand)} zijn het populairst. Overweeg hier extra capaciteit.`}
              />
              <InsightCard
                icon="⏰"
                title="Wachttijd"
                description={
                  analytics.avgWaitTimeDays > 60
                    ? 'De gemiddelde wachttijd is vrij hoog. Meer plekken kunnen helpen.'
                    : 'De wachttijd is binnen redelijke grenzen.'
                }
              />
              <InsightCard
                icon="🎯"
                title="Capaciteit"
                description={`Met ${analytics.totalWaiting} wachtenden kun je vooruit plannen voor de komende periode.`}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtext: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: 'gray' | 'yellow' | 'green';
}) {
  const colorClasses = {
    gray: 'bg-gray-200',
    yellow: 'bg-yellow-400',
    green: 'bg-green-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${percentage}%` }}
        >
          {percentage >= 10 && (
            <span className="text-xs font-medium text-white">{Math.round(percentage)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function getMostPopularDay(dayDemand: Record<Day, number>): Day {
  return (Object.entries(dayDemand) as [Day, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function getSecondMostPopularDay(dayDemand: Record<Day, number>): Day {
  const sorted = (Object.entries(dayDemand) as [Day, number][])
    .sort((a, b) => b[1] - a[1]);
  return sorted[1]?.[0] || sorted[0][0];
}
