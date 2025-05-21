import React, { useEffect, useState } from 'react';
import { Eye, Clock, CalendarDays, Activity, Users } from 'lucide-react';
import { getAnalyticsData } from '../utils/calculateViews';
import { AnalyticsData } from '../types/analytics';
import CounterCard from './CounterCard';
import MetricCard from './MetricCard';
import LineChart from './LineChart';
import Chart from './Chart';
import WeeklyPatternChart from './WeeklyPatternChart';
import Header from './Header';

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data fetch
    setData(getAnalyticsData());
    setLoading(false);

    // Update analytics data every 2 seconds for real-time feel
    const interval = setInterval(() => {
      setData(getAnalyticsData());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-indigo-500 border-t-transparent"></div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const dailyTrendData = data.dailyTrend.map(item => ({
    label: item.date,
    value: item.views
  }));

  const weeklyPatternData = data.weeklyPattern;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header title="Realtime Analytics" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Cards */}
        <section className="mb-12 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CounterCard
              title="Total Views"
              value={data.totalViews}
              icon={<Eye className="w-5 h-5" />}
              duration={1000}
            />
            <MetricCard
              title="Today's Views"
              value={data.today.current}
              previousValue={data.today.previous}
              percentChange={data.today.percentChange}
            />
            <MetricCard
              title="Last 24 Hours"
              value={data.last24Hours.current}
              previousValue={data.last24Hours.previous}
              percentChange={data.last24Hours.percentChange}
            />
            <MetricCard
              title="Last 7 Days"
              value={data.last7Days.current}
              previousValue={data.last7Days.previous}
              percentChange={data.last7Days.percentChange}
            />
          </div>
        </section>

        {/* Charts */}
        <section className="mb-12 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">Performance</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="col-span-1">
              <LineChart
                data={dailyTrendData}
                title="Daily Views (Last 7 Days)"
                height={300}
                lineColor="stroke-indigo-500"
                fillColor="fill-indigo-500/10"
              />
            </div>


          </div>
        </section>

        {/* Insights */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">Insights</h2>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700/50">
            <h3 className="text-xl font-semibold tracking-tight text-gray-800 dark:text-gray-200 mb-6">Key Findings</h3>
            <ul className="dark:text-gray-300 flex grid-cols-3 items-baseline space-y-4 text-gray-600">
              <li className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                <span className="text-indigo-500 dark:text-indigo-400">•</span>
                {data.today.percentChange > 0 ?
                  <span>Today's traffic is <span className="font-medium text-emerald-500">{Math.abs(data.today.percentChange).toFixed(1)}% higher</span> than yesterday.</span> :
                  <span>Today's traffic is <span className="font-medium text-rose-500">{Math.abs(data.today.percentChange).toFixed(1)}% lower</span> than yesterday.</span>
                }
              </li>
              <li className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                <span className="text-indigo-500 dark:text-indigo-400">•</span>
                {Math.max(...weeklyPatternData.map(d => d.avgViews)) === weeklyPatternData[new Date().getDay()].avgViews ?
                  <span>Today is typically your <span className="font-medium text-emerald-500">highest traffic day</span> of the week.</span> :
                  <span>Your highest traffic day is typically <span className="font-medium text-indigo-500 dark:text-indigo-400">{weeklyPatternData.reduce((prev, current) =>
                    (prev.avgViews > current.avgViews) ? prev : current).day}</span>.</span>
                }
              </li>
              <li className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                <span className="text-indigo-500 dark:text-indigo-400">•</span>
                {data.last7Days.percentChange > 0 ?
                  <span>Weekly views are <span className="font-medium text-emerald-500">up {Math.abs(data.last7Days.percentChange).toFixed(1)}%</span> compared to the previous week.</span> :
                  <span>Weekly views are <span className="font-medium text-rose-500">down {Math.abs(data.last7Days.percentChange).toFixed(1)}%</span> compared to the previous week.</span>
                }
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
