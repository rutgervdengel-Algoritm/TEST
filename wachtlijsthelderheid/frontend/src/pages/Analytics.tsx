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

// Icons
const Icons = {
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout title="Analytics">
        <div className="text-center text-navy-400">Kon analytics niet laden</div>
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
          subtext="Actief op wachtlijst"
          icon={Icons.users}
          iconBg="bg-forest-100"
          iconColor="text-forest-600"
        />
        <MetricCard
          label="Geplaatst"
          value={analytics.acceptedCount}
          subtext={`${conversionRate}% conversie`}
          icon={Icons.check}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
        />
        <MetricCard
          label="Gem. wachttijd"
          value={`${analytics.avgWaitTimeDays}d`}
          subtext="Voor geplaatste kinderen"
          icon={Icons.clock}
          iconBg="bg-terracotta-100"
          iconColor="text-terracotta-600"
        />
        <MetricCard
          label="Activiteit (7d)"
          value={analytics.recentActivity}
          subtext="Acties in logboek"
          icon={Icons.activity}
          iconBg="bg-forest-100"
          iconColor="text-forest-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day demand chart */}
        <div className="card">
          <div className="card-header bg-cream-50">
            <h2 className="font-serif font-bold text-forest-600 text-lg">Vraag per dag</h2>
            <p className="text-sm text-navy-400 mt-1">Aantal aanvragen per dag van de week</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(Object.entries(analytics.dayDemand) as [Day, number][]).map(([day, count]) => {
                const percentage = maxDayDemand > 0 ? (count / maxDayDemand) * 100 : 0;
                const sharePercentage = totalDayDemand > 0 ? Math.round((count / totalDayDemand) * 100) : 0;

                return (
                  <div key={day}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-forest-600">{DAY_LABELS[day]}</span>
                      <span className="text-sm text-navy-400">
                        {count} ({sharePercentage}%)
                      </span>
                    </div>
                    <div className="h-4 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-cream-200">
              <p className="text-sm text-navy-500">
                <strong className="text-forest-600">Inzicht:</strong>{' '}
                {getMostPopularDay(analytics.dayDemand)} is de meest gevraagde dag
                met {analytics.dayDemand[getMostPopularDay(analytics.dayDemand)]} aanvragen.
              </p>
            </div>
          </div>
        </div>

        {/* Funnel / conversion */}
        <div className="card">
          <div className="card-header bg-cream-50">
            <h2 className="font-serif font-bold text-forest-600 text-lg">Wachtlijst funnel</h2>
            <p className="text-sm text-navy-400 mt-1">Van inschrijving tot plaatsing</p>
          </div>
          <div className="p-6">
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
                color="amber"
              />
              <FunnelStep
                label="Geplaatst"
                value={analytics.acceptedCount}
                percentage={analytics.totalEntries > 0 ? (analytics.acceptedCount / analytics.totalEntries) * 100 : 0}
                color="teal"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-cream-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-cream-50 rounded-xl">
                  <p className="text-3xl font-bold text-forest-600">{conversionRate}%</p>
                  <p className="text-sm text-navy-400">Conversie ratio</p>
                </div>
                <div className="text-center p-4 bg-cream-50 rounded-xl">
                  <p className="text-3xl font-bold text-forest-600">{analytics.avgWaitTimeDays}</p>
                  <p className="text-sm text-navy-400">Gem. wachtdagen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card lg:col-span-2">
          <div className="card-header bg-cream-50 flex items-center gap-2">
            <span className="text-terracotta-500">{Icons.lightbulb}</span>
            <h2 className="font-serif font-bold text-forest-600 text-lg">Inzichten & aanbevelingen</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InsightCard
                title="Piekdagen"
                description={`${getMostPopularDay(analytics.dayDemand)} en ${getSecondMostPopularDay(analytics.dayDemand)} zijn het populairst. Overweeg hier extra capaciteit.`}
                icon={Icons.chart}
              />
              <InsightCard
                title="Wachttijd"
                description={
                  analytics.avgWaitTimeDays > 60
                    ? 'De gemiddelde wachttijd is vrij hoog. Meer plekken kunnen helpen.'
                    : 'De wachttijd is binnen redelijke grenzen.'
                }
                icon={Icons.clock}
              />
              <InsightCard
                title="Capaciteit"
                description={`Met ${analytics.totalWaiting} wachtenden kun je vooruit plannen voor de komende periode.`}
                icon={Icons.users}
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
  subtext,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          <p className="stat-sublabel">{subtext}</p>
        </div>
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${iconColor}`}>
          {icon}
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
  color: 'gray' | 'amber' | 'teal';
}) {
  const colorClasses = {
    gray: 'bg-cream-300',
    amber: 'bg-terracotta-400',
    teal: 'bg-teal-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-forest-600">{label}</span>
        <span className="text-sm font-bold text-forest-600">{value}</span>
      </div>
      <div className="h-6 bg-cream-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        >
          {percentage >= 15 && (
            <span className="text-xs font-medium text-white">{Math.round(percentage)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-cream-50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-forest-600">{title}</h3>
      </div>
      <p className="text-sm text-navy-500">{description}</p>
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
