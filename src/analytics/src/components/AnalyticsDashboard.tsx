import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock3,
  Eye,
  Globe2,
  LayoutList,
  MonitorSmartphone,
  MousePointer2,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';
import { getAnalyticsData } from '../utils/liveAnalytics';
import type { AnalyticsData, BreakdownItem, InsightData } from '../types/analytics';

const ranges = [30, 60, 120, 365] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 10_000 ? 1 : 0
  }).format(value);
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

function MetricCard({ title, value, subtitle, icon, accent }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${accent}`}>{icon}</div>
      </div>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

interface SimpleLineChartProps {
  data: { date: string; views: number }[];
}

function SimpleLineChart({ data }: SimpleLineChartProps) {
  const { points, area, maxValue } = useMemo(() => {
    const width = 720;
    const height = 260;
    const paddingX = 22;
    const paddingY = 20;
    const safeData = data
      .filter(item => Number.isFinite(item.views))
      .map(item => ({ label: item.date, value: Math.max(0, item.views) }));
    const chartData = safeData.length > 0 ? safeData : [{ label: 'Now', value: 0 }];
    const values = chartData.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const pointList = chartData.map((item, index) => {
      const x = paddingX + (index / Math.max(1, chartData.length - 1)) * (width - paddingX * 2);
      const y = paddingY + (1 - (item.value - min) / range) * (height - paddingY * 2);
      return { x, y, label: item.label, value: item.value };
    });
    const path = pointList.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${path} L ${pointList[pointList.length - 1]?.x ?? paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

    return { points: pointList, area: areaPath, maxValue: max };
  }, [data]);

  return (
    <div>
      <div className="flex justify-end text-sm font-medium text-slate-600">Peak {formatCompact(maxValue)}</div>
      <div className="mt-6 overflow-hidden">
        <svg viewBox="0 0 720 260" className="h-72 w-full" role="img" aria-label="Daily views trend">
          <defs>
            <linearGradient id="analytics-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#analytics-area)" />
          <polyline
            points={points.map(point => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke="rgb(37 99 235)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) => (
            <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r="3.5" fill="white" stroke="rgb(37 99 235)" strokeWidth="2">
              <title>{`${point.label}: ${formatNumber(point.value)} views`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function RealtimeCard({ data }: { data: AnalyticsData }) {
  const max = Math.max(1, ...data.realtimeMinutes.map(item => item.views));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Realtime</h2>
          <p className="text-sm text-slate-500">Last 30 minutes</p>
        </div>
        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Live</div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-500">Active users</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{formatNumber(data.activeUsers)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Views</p>
          <p className="mt-1 text-3xl font-semibold text-slate-950">{formatNumber(data.last30Minutes)}</p>
        </div>
      </div>
      <div className="mt-6 flex h-32 items-end gap-1">
        {data.realtimeMinutes.map((item, index) => (
          <div key={`${item.minute}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t bg-blue-500 transition-all"
              style={{ height: `${Math.max(8, (item.views / max) * 100)}%` }}
              title={`${item.minute}: ${formatNumber(item.views)} views`}
            />
            {index % 10 === 0 || index === data.realtimeMinutes.length - 1 ? (
              <span className="text-[10px] text-slate-400">{item.minute}</span>
            ) : (
              <span className="h-3" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Current pace is {formatNumber(data.currentHourlyRate)} views per hour with steady minute-level activity.
      </p>
    </div>
  );
}

function BreakdownCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: BreakdownItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="text-slate-500">{icon}</div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{formatNumber(item.value)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyCurve({ data }: { data: AnalyticsData }) {
  const max = Math.max(1, ...data.hourlyCurve.map(item => item.value));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Hourly curve</h2>
          <p className="text-sm text-slate-500">Projected distribution through the UTC day</p>
        </div>
        <Clock3 className="h-5 w-5 text-slate-400" />
      </div>
      <div className="flex h-44 items-end gap-1">
        {data.hourlyCurve.map(item => (
          <div key={item.hour} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t ${item.isCurrent ? 'bg-emerald-500' : 'bg-slate-300'}`}
              style={{ height: `${Math.max(5, (item.value / max) * 100)}%` }}
              title={`${item.hour}: ${formatNumber(item.value)} views`}
            />
            {item.hour.endsWith(':00') ? <span className="text-[10px] text-slate-400">{item.hour}</span> : <span className="h-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: InsightData }) {
  const toneClass = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800'
  }[insight.tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="font-semibold">{insight.title}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{insight.body}</p>
    </div>
  );
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [rangeDays, setRangeDays] = useState<(typeof ranges)[number]>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAnalyticsData = async () => {
      try {
        const analyticsData = await getAnalyticsData(rangeDays);
        if (isMounted) {
          setData(analyticsData);
          setError(false);
          setLoading(false);
        }
      } catch (requestError) {
        console.error('Error loading analytics data:', requestError);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 10_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rangeDays]);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
          <Activity className="mx-auto h-8 w-8 text-rose-500" />
          <h1 className="mt-4 text-lg font-semibold text-slate-950">Analytics unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">The dashboard could not refresh. Try again in a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live overview
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Realtime overview</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Current traffic, acquisition mix, device split, and page activity for JSreact.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {data.source === 'local' && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">Estimated refresh</span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" />
              Updated {data.lastUpdated}
            </span>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total views"
            value={formatNumber(data.totalViews)}
            subtitle={`${formatNumber(data.viewsToday)} views today`}
            icon={<Eye className="h-5 w-5 text-blue-700" />}
            accent="bg-blue-50"
          />
          <MetricCard
            title="Last 30 minutes"
            value={formatNumber(data.last30Minutes)}
            subtitle={`${formatNumber(data.activeUsers)} active users`}
            icon={<Users className="h-5 w-5 text-emerald-700" />}
            accent="bg-emerald-50"
          />
          <MetricCard
            title="Current rate"
            value={`${formatCompact(data.currentHourlyRate)}/hr`}
            subtitle={`${formatNumber(data.projectedToday)} projected today`}
            icon={<TrendingUp className="h-5 w-5 text-amber-700" />}
            accent="bg-amber-50"
          />
          <MetricCard
            title="7-day average"
            value={formatNumber(data.sevenDayAverage)}
            subtitle={`${formatPercent(data.sevenDayTrend.percentChange)} vs previous 7 days`}
            icon={<BarChart3 className="h-5 w-5 text-rose-700" />}
            accent="bg-rose-50"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Traffic trend</h2>
                <p className="text-sm text-slate-500">Daily views across the selected range</p>
              </div>
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
                {ranges.map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setRangeDays(range)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      rangeDays === range
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {range}d
                  </button>
                ))}
              </div>
            </div>
            <SimpleLineChart data={data.dailyTrend} />
          </div>
          <RealtimeCard data={data} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <BreakdownCard title="Traffic sources" icon={<Globe2 className="h-5 w-5" />} items={data.trafficSources} />
          <BreakdownCard title="Top pages" icon={<LayoutList className="h-5 w-5" />} items={data.topPages} />
          <BreakdownCard title="Devices" icon={<MonitorSmartphone className="h-5 w-5" />} items={data.devices} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HourlyCurve data={data} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <MousePointer2 className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-950">Traffic notes</h2>
            </div>
            <div className="space-y-3">
              {data.insights.map(insight => (
                <InsightCard key={insight.title} insight={insight} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
