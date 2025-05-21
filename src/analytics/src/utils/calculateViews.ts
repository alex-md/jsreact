// Add these interfaces at the top of the file
interface DailyView {
  date: string;
  views: number;
}

interface WeeklyPattern {
  day: string;
  avgViews: number;
}

export function calculateViews(targetDate = new Date()) {
  const startDate = new Date('2016-11-09T00:00:00Z');
  const msPerDay = 86400000;

  const daysSinceStart = Math.floor((targetDate.getTime() - startDate.getTime()) / msPerDay);
  const timeElapsedToday = targetDate.getTime() - new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();

  const averageIncrementPerDay = 1110;
  const baseViews = 0;
  const growthRate = 0.00082;
  const weeklyCycleAmplitude = 0.85;
  const dailyCycleAmplitude = 1.85;

  // Calculate cumulative views for each day since start
  let totalViews = baseViews; // Start with base views
  const growthFactor = Math.exp(growthRate);

  // Pre-calculate growth multiplier for performance
  const cumulativeGrowth = (growthFactor ** daysSinceStart - 1) / (growthFactor - 1);
  totalViews += averageIncrementPerDay * cumulativeGrowth;

  // Add today's partial increment
  const dayOfWeek = targetDate.getDay();
  const hourOfDay = targetDate.getHours();

  const weeklyCycle = Math.sin(2 * Math.PI * dayOfWeek / 7) * weeklyCycleAmplitude;
  const dailyCycle = Math.cos(2 * Math.PI * hourOfDay / 24) * dailyCycleAmplitude;

  // Deterministic random component for today
  const deterministicRandom = seededRandom(daysSinceStart + startDate.getTime());
  const randomNoise = (deterministicRandom - 0.5) * 0.25;

  // Calculate today's increment with all factors
  const todayGrowthMultiplier = Math.exp(growthRate * daysSinceStart);
  const dailyIncrement = averageIncrementPerDay * (1 + weeklyCycle + dailyCycle + randomNoise) * todayGrowthMultiplier;
  const partialDayIncrement = (timeElapsedToday / msPerDay) * dailyIncrement;
  totalViews += partialDayIncrement;

  return Math.floor(totalViews);
}

// Helper function for deterministic randomness
function seededRandom(seed: number) {
  const m = 2 ** 32;
  const a = 1664525;
  const c = 1013904223;
  seed = (a * seed + c) % m;
  return seed / m;
}

export function calculateViewsForDate(year: number, month: number, day: number, hour = 0, minute = 0, second = 0) {
  const date = new Date(year, month - 1, day, hour, minute, second);
  return calculateViews(date);
}

export function calculateViewsForPastDays(days: number): number[] {
  const today = new Date();
  const results: number[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    results.push(calculateViews(date));
  }

  return results;
}

export function calculateViewIncreaseForPeriod(days: number): {
  current: number;
  previous: number;
  percentChange: number;
} {
  const today = new Date();
  const endOfPeriod = calculateViews(today);

  const startOfPeriod = new Date();
  startOfPeriod.setDate(today.getDate() - days);
  const startViews = calculateViews(startOfPeriod);

  const currentPeriodViews = endOfPeriod - startViews;

  const startOfPreviousPeriod = new Date();
  startOfPreviousPeriod.setDate(startOfPeriod.getDate() - days);
  const previousPeriodStartViews = calculateViews(startOfPreviousPeriod);

  const previousPeriodViews = startViews - previousPeriodStartViews;

  const percentChange = previousPeriodViews === 0
    ? 100
    : ((currentPeriodViews - previousPeriodViews) / previousPeriodViews) * 100;

  return {
    current: currentPeriodViews,
    previous: previousPeriodViews,
    percentChange
  };
}

export function calculateDaily24HourViews(): {
  current: number;
  previous: number;
  percentChange: number;
} {
  const now = new Date();
  const viewsNow = calculateViews(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const viewsYesterday = calculateViews(yesterday);

  const dayBeforeYesterday = new Date(yesterday);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
  const viewsDayBeforeYesterday = calculateViews(dayBeforeYesterday);

  const current = viewsNow - viewsYesterday;
  const previous = viewsYesterday - viewsDayBeforeYesterday;

  const percentChange = previous === 0
    ? 100
    : ((current - previous) / previous) * 100;

  return {
    current,
    previous,
    percentChange
  };
}

export function getDailyViewsForPastDays(days: number): DailyView[] {
  const result: DailyView[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endViews = calculateViews(endOfDay);
    const startViews = calculateViews(startOfDay);
    const dailyViews = endViews - startViews;

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    result.push({
      date: formattedDate,
      views: dailyViews
    });
  }

  return result;
}

export function getWeeklyPattern(): WeeklyPattern[] {
  const result: WeeklyPattern[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDay = today.getDay();

  // Get 4 weeks of data to calculate averages
  const weeks = 4;
  const days = 7 * weeks;

  // Store daily totals and counts
  const dailyTotals = Array(7).fill(0);
  const dailyCounts = Array(7).fill(0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endViews = calculateViews(endOfDay);
    const startViews = calculateViews(startOfDay);
    const dailyViews = endViews - startViews;

    const dayOfWeek = date.getDay();
    dailyTotals[dayOfWeek] += dailyViews;
    dailyCounts[dayOfWeek]++;
  }

  // Calculate averages
  for (let i = 0; i < 7; i++) {
    const avgViews = dailyCounts[i] > 0 ? Math.round(dailyTotals[i] / dailyCounts[i]) : 0;
    result.push({
      day: dayNames[i],
      avgViews
    });
  }

  return result;
}

export function getAnalyticsData(): {
  totalViews: number;
  today: { current: number; previous: number; percentChange: number };
  last24Hours: { current: number; previous: number; percentChange: number };
  last7Days: { current: number; previous: number; percentChange: number };
  last30Days: { current: number; previous: number; percentChange: number };
  dailyTrend: { date: string; views: number }[];
  weeklyPattern: { day: string; avgViews: number }[];
} {
  const now = new Date();

  // Calculate today's views
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(startOfToday);
  endOfYesterday.setSeconds(endOfYesterday.getSeconds() - 1);

  const startOfYesterday = new Date(endOfYesterday);
  startOfYesterday.setHours(0, 0, 0, 0);

  const currentViews = calculateViews(now) - calculateViews(startOfToday);
  const yesterdayViews = calculateViews(endOfYesterday) - calculateViews(startOfYesterday);

  const percentChangeToday = yesterdayViews === 0
    ? 100
    : ((currentViews - yesterdayViews) / yesterdayViews) * 100;

  return {
    totalViews: calculateViews(now),
    today: {
      current: currentViews,
      previous: yesterdayViews,
      percentChange: percentChangeToday
    },
    last24Hours: calculateDaily24HourViews(),
    last7Days: calculateViewIncreaseForPeriod(7),
    last30Days: calculateViewIncreaseForPeriod(30),
    dailyTrend: getDailyViewsForPastDays(7),
    weeklyPattern: getWeeklyPattern()
  };
}
