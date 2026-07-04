import { fetchViewCount } from '@utils/viewCount';
import type { AnalyticsData, AnalyticsPeriod, DailyViewData, WeeklyPatternData } from '../types/analytics';

interface ViewSnapshot {
  timestamp: number;
  totalViews: number;
}

const SNAPSHOT_STORAGE_KEY = 'jsreact:view-count-snapshots';
const SNAPSHOT_MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000;
const SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;
const SNAPSHOT_LIMIT = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function readSnapshots(): ViewSnapshot[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is ViewSnapshot => (
        typeof item?.timestamp === 'number'
        && typeof item?.totalViews === 'number'
        && Number.isFinite(item.timestamp)
        && Number.isFinite(item.totalViews)
      ))
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots: ViewSnapshot[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Analytics remains usable from the current Worker response without local history.
  }
}

function recordSnapshot(totalViews: number, timestamp = Date.now()): ViewSnapshot[] {
  const cutoff = timestamp - SNAPSHOT_MAX_AGE_MS;
  const snapshots = readSnapshots().filter(snapshot => snapshot.timestamp >= cutoff);
  const previous = snapshots[snapshots.length - 1];
  const shouldRecord = !previous
    || timestamp - previous.timestamp >= SNAPSHOT_MIN_INTERVAL_MS
    || totalViews !== previous.totalViews;

  if (shouldRecord) {
    snapshots.push({ timestamp, totalViews });
  } else {
    snapshots[snapshots.length - 1] = { timestamp, totalViews };
  }

  const trimmed = snapshots.slice(-SNAPSHOT_LIMIT);
  writeSnapshots(trimmed);
  return trimmed;
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function deltaBetween(snapshots: ViewSnapshot[], start: number, end: number): number {
  const inRange = snapshots.filter(snapshot => snapshot.timestamp >= start && snapshot.timestamp <= end);
  if (inRange.length < 2) return 0;

  const first = inRange[0];
  const last = inRange[inRange.length - 1];
  return Math.max(0, last.totalViews - first.totalViews);
}

function periodFromObservedSnapshots(snapshots: ViewSnapshot[], now: number, days: number): AnalyticsPeriod {
  const currentStart = now - days * DAY_MS;
  const previousStart = currentStart - days * DAY_MS;
  const current = deltaBetween(snapshots, currentStart, now);
  const previous = deltaBetween(snapshots, previousStart, currentStart);

  return {
    current,
    previous,
    percentChange: calculatePercentChange(current, previous)
  };
}

function observedToday(snapshots: ViewSnapshot[], now: number): AnalyticsPeriod {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const current = deltaBetween(snapshots, todayStart.getTime(), now);
  const previous = deltaBetween(snapshots, yesterdayStart.getTime(), todayStart.getTime());

  return {
    current,
    previous,
    percentChange: calculatePercentChange(current, previous)
  };
}

function dailyTrend(snapshots: ViewSnapshot[], now: number): DailyViewData[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: deltaBetween(snapshots, day.getTime(), Math.min(nextDay.getTime(), now))
    };
  });
}

function weeklyPattern(snapshots: ViewSnapshot[], now: number): WeeklyPatternData[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totals = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];

  for (let daysAgo = 27; daysAgo >= 0; daysAgo--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - daysAgo);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const views = deltaBetween(snapshots, day.getTime(), Math.min(nextDay.getTime(), now));
    const dayIndex = day.getDay();

    totals[dayIndex] += views;
    counts[dayIndex] += 1;
  }

  return dayNames.map((day, index) => ({
    day,
    avgViews: counts[index] > 0 ? Math.round(totals[index] / counts[index]) : 0
  }));
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const totalViews = await fetchViewCount();
  const now = Date.now();
  const snapshots = recordSnapshot(totalViews, now);

  return {
    totalViews,
    today: observedToday(snapshots, now),
    last24Hours: periodFromObservedSnapshots(snapshots, now, 1),
    last7Days: periodFromObservedSnapshots(snapshots, now, 7),
    last30Days: periodFromObservedSnapshots(snapshots, now, 30),
    dailyTrend: dailyTrend(snapshots, now),
    weeklyPattern: weeklyPattern(snapshots, now)
  };
}
