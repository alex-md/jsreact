import { fetchViewCount } from '@utils/viewCount';
import type {
  AnalyticsData,
  AnalyticsPeriod,
  BreakdownItem,
  DailyViewData,
  HourlyTrafficData,
  InsightData,
  RealtimeMinuteData,
  WeeklyPatternData
} from '../types/analytics';

interface TrafficConfig {
  startDate: Date;
  baseViews: number;
  oldAverageIncrementPerDay: number;
  oldGrowthRate: number;
  breakoutDate: Date;
  peakDate: Date;
  sustainedPostPeakMultiplier: number;
  peakMultiplier: number;
  breakoutRampDays: number;
  postPeakDecayDays: number;
  normalNoiseAmplitude: number;
  viralNoiseAmplitude: number;
  minDailyMultiplier: number;
  maxDailyMultiplier: number;
}

const trafficConfig: TrafficConfig = {
  startDate: new Date('2016-11-09T00:00:00Z'),
  baseViews: 0,
  oldAverageIncrementPerDay: 354,
  oldGrowthRate: 25e-5,
  breakoutDate: new Date('2026-04-11T00:00:00Z'),
  peakDate: new Date('2026-05-12T00:00:00Z'),
  sustainedPostPeakMultiplier: 35,
  peakMultiplier: 200,
  breakoutRampDays: 9,
  postPeakDecayDays: 46,
  normalNoiseAmplitude: 0.18,
  viralNoiseAmplitude: 0.38,
  minDailyMultiplier: 0.45,
  maxDailyMultiplier: 1.85
};

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysBetween(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS);
}

function logistic(x: number, midpoint: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

function gaussian(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev;
  return Math.exp(-0.5 * z * z);
}

function hashUint32(x: number): number {
  let value = x;
  value = Math.imul((value >>> 16) ^ value, 0x45d9f3b);
  value = Math.imul((value >>> 16) ^ value, 0x45d9f3b);
  value = (value >>> 16) ^ value;
  return value >>> 0;
}

function hashToFloat(x: number): number {
  return hashUint32(x) / 4_294_967_296;
}

function getNoise1D(x: number, frequency: number): number {
  const scaled = x * frequency;
  const x0 = Math.floor(scaled);
  const x1 = x0 + 1;
  const t = scaled - x0;
  const fade = t * t * (3 - 2 * t);
  const v0 = hashToFloat(x0);
  const v1 = hashToFloat(x1);
  return v0 + fade * (v1 - v0);
}

function getUtcDayProgress(date: Date): number {
  const startOfUtcDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return clamp((date.getTime() - startOfUtcDay) / DAY_MS, 0, 1);
}

function getOldBaselineDailyViews(dayIndex: number, config = trafficConfig): number {
  return config.oldAverageIncrementPerDay * Math.exp(config.oldGrowthRate * dayIndex);
}

function getViralRegimeMultiplier(date: Date, config = trafficConfig): number {
  const breakout = daysBetween(config.startDate, config.breakoutDate);
  const peak = daysBetween(config.startDate, config.peakDate);
  const current = daysBetween(config.startDate, date);

  if (current < breakout) return 1;

  if (current <= peak) {
    const daysSinceBreakout = current - breakout;
    const ramp = 1 + logistic(daysSinceBreakout, config.breakoutRampDays / 2, 1.15) * (config.peakMultiplier - 1);
    const climbTexture = 1
      + (getNoise1D(daysSinceBreakout, 1 / 3) - 0.5) * 0.16
      + (getNoise1D(daysSinceBreakout + 100, 1 / 7) - 0.5) * 0.12;
    return ramp * climbTexture;
  }

  const daysAfterPeak = current - peak;
  const decay = config.sustainedPostPeakMultiplier
    + (config.peakMultiplier - config.sustainedPostPeakMultiplier) * Math.exp(-daysAfterPeak / config.postPeakDecayDays);
  const aftershock = 1
    + (getNoise1D(daysAfterPeak + 200, 1 / 8) - 0.5) * 0.16
    + (getNoise1D(daysAfterPeak + 300, 1 / 20) - 0.5) * 0.10;
  return decay * aftershock;
}

function getOrganicDrift(dayIndex: number): number {
  const n1 = getNoise1D(dayIndex, 1 / 45) * 0.15;
  const n2 = getNoise1D(dayIndex + 500, 1 / 15) * 0.08;
  const n3 = getNoise1D(dayIndex + 1000, 1 / 5) * 0.04;
  return 1 + (n1 + n2 + n3 - 0.135);
}

function getLumpyBurstMultiplier(dayIndex: number, date: Date, config = trafficConfig): number {
  const breakoutDay = daysBetween(config.startDate, config.breakoutDate);
  const currentDay = daysBetween(config.startDate, date);
  let multiplier = 1;

  for (let window = 0; window < 5; window += 1) {
    const seed = Math.floor(dayIndex / 17) * 10_000 + window * 911;
    const chance = hashToFloat(seed);
    if (chance > 0.82) {
      const center = Math.floor(dayIndex / 17) * 17 + Math.floor(hashToFloat(seed + 44) * 17);
      const distance = Math.abs(dayIndex - center);
      const width = 1.5 + hashToFloat(seed + 99) * 3.5;
      const strength = 0.08 + hashToFloat(seed + 123) * 0.22;
      multiplier += Math.exp(-(distance * distance) / (2 * width * width)) * strength;
    }
  }

  if (currentDay >= breakoutDay) {
    const daysSinceBreakout = currentDay - breakoutDay;
    multiplier += gaussian(daysSinceBreakout, 4, 2.6) * 0.65;
    multiplier += gaussian(daysSinceBreakout, 13, 4) * 0.38;
    multiplier += gaussian(daysSinceBreakout, 27, 5.5) * 0.45;
    multiplier += gaussian(daysSinceBreakout, 47, 7.5) * 0.22;
  }

  return clamp(multiplier, 0.75, 2.6);
}

function getDateAwareRandomness(dayIndex: number, viralMultiplier: number, config = trafficConfig): number {
  const baseNoise = viralMultiplier > 20 ? config.viralNoiseAmplitude : config.normalNoiseAmplitude;
  const r1 = hashToFloat(dayIndex * 9973 + 17);
  const r2 = hashToFloat(Math.floor(dayIndex / 3) * 4991 + 29);
  const r3 = hashToFloat(Math.floor(dayIndex / 11) * 8191 + 41);
  const blended = r1 * 0.5 + r2 * 0.32 + r3 * 0.18;
  return 1 + (blended - 0.5) * 2 * baseNoise;
}

function getSoftWeekShape(date: Date, dayIndex: number): number {
  const weights = [0.94, 1.02, 1.04, 1.05, 1.03, 0.99, 0.93];
  const baseWeight = weights[date.getUTCDay()] ?? 1;
  const fluctuation = (hashToFloat(dayIndex * 13 + 7) - 0.5) * 0.03;
  return clamp(baseWeight + fluctuation, 0.85, 1.15);
}

function getHourlyTrafficWeight(hour: number, dayIndex: number): number {
  const morningShift = (hashToFloat(dayIndex * 31 + 17) - 0.5) * 1.2;
  const afternoonShift = (hashToFloat(dayIndex * 37 + 53) - 0.5) * 1.5;

  const overnightBase = 0.3;
  const morningRamp = gaussian(hour, 9 + morningShift, 3.1) * 0.46;
  const afternoonPeak = gaussian(hour, 14 + afternoonShift, 4.2) * 0.72;
  const eveningBump = gaussian(hour, 20.5, 2.8) * 0.36;

  return overnightBase + morningRamp + afternoonPeak + eveningBump;
}

function getIntradayProgressAdjusted(dayProgress: number, dayIndex: number): number {
  const steps = 96;
  const targetStep = Math.floor(dayProgress * steps);
  let totalWeight = 0;
  let elapsedWeight = 0;

  for (let index = 0; index < steps; index += 1) {
    const hour = (index / steps) * 24;
    const weight = getHourlyTrafficWeight(hour, dayIndex);
    totalWeight += weight;
    if (index < targetStep) elapsedWeight += weight;
  }

  const partialStepProgress = dayProgress * steps - targetStep;
  if (targetStep < steps) {
    const hour = (targetStep / steps) * 24;
    elapsedWeight += getHourlyTrafficWeight(hour, dayIndex) * partialStepProgress;
  }

  return clamp(elapsedWeight / totalWeight, 0, 1);
}

function getRealisticDailyIncrement(dayIndex: number, config = trafficConfig): number {
  const dayDate = new Date(config.startDate.getTime() + dayIndex * DAY_MS);
  const oldBaseline = getOldBaselineDailyViews(dayIndex, config);
  const viralMultiplier = getViralRegimeMultiplier(dayDate, config);
  const trafficMood = getOrganicDrift(dayIndex);
  const lumpyBursts = getLumpyBurstMultiplier(dayIndex, dayDate, config);
  const newsyRandomness = getDateAwareRandomness(dayIndex, viralMultiplier, config);
  const softWeekShape = getSoftWeekShape(dayDate, dayIndex);

  let rawViews = oldBaseline * viralMultiplier * trafficMood * lumpyBursts * newsyRandomness * softWeekShape;
  const isViralEra = dayDate >= config.breakoutDate;
  const min = isViralEra ? 0.55 : config.minDailyMultiplier;
  const max = isViralEra ? 2.75 : config.maxDailyMultiplier;

  rawViews = oldBaseline * clamp(rawViews / oldBaseline, min, max * viralMultiplier);
  return Math.max(0, rawViews);
}

function calculateModeledViews(targetDate = new Date(), config = trafficConfig): number {
  const now = targetDate.getTime();
  const start = config.startDate.getTime();
  if (now <= start) return config.baseViews;

  const daysSinceStart = Math.floor((now - start) / DAY_MS);
  const dayProgress = getUtcDayProgress(targetDate);
  let totalViews = config.baseViews;

  for (let dayIndex = 0; dayIndex < daysSinceStart; dayIndex += 1) {
    totalViews += getRealisticDailyIncrement(dayIndex, config);
  }

  const todayIncrement = getRealisticDailyIncrement(daysSinceStart, config);
  totalViews += todayIncrement * getIntradayProgressAdjusted(dayProgress, daysSinceStart);

  return Math.floor(totalViews);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function getDayIncrement(date: Date): number {
  const dayIndex = daysBetween(trafficConfig.startDate, startOfUtcDay(date));
  return Math.round(getRealisticDailyIncrement(dayIndex));
}

function getViewsBetween(start: Date, end: Date): number {
  return Math.max(0, calculateModeledViews(end) - calculateModeledViews(start));
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function createPeriod(current: number, previous: number): AnalyticsPeriod {
  return {
    current,
    previous,
    percentChange: calculatePercentChange(current, previous)
  };
}

function getCurrentHourlyRate(now: Date, projectedToday: number): number {
  const dayIndex = daysBetween(trafficConfig.startDate, startOfUtcDay(now));
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const currentWeight = getHourlyTrafficWeight(hour, dayIndex);
  let dayWeight = 0;

  for (let step = 0; step < 96; step += 1) {
    dayWeight += getHourlyTrafficWeight((step / 96) * 24, dayIndex);
  }

  return Math.max(1, Math.round((projectedToday * currentWeight * 96) / dayWeight));
}

function getRealtimeMinutes(now: Date, currentHourlyRate: number): RealtimeMinuteData[] {
  const dayIndex = daysBetween(trafficConfig.startDate, startOfUtcDay(now));
  const basePerMinute = currentHourlyRate / 60;

  return Array.from({ length: 30 }, (_, index) => {
    const minutesAgo = 29 - index;
    const timestamp = new Date(now.getTime() - minutesAgo * MINUTE_MS);
    const seed = dayIndex * 10_000 + timestamp.getUTCHours() * 60 + timestamp.getUTCMinutes();
    const jitter = 0.72 + hashToFloat(seed) * 0.62;
    const wave = 1 + Math.sin((index / 30) * Math.PI * 2) * 0.08;
    const views = Math.max(0, Math.round(basePerMinute * jitter * wave));

    return {
      minute: minutesAgo === 0 ? 'Now' : `-${minutesAgo}`,
      views
    };
  });
}

function getHourlyCurve(now: Date, projectedToday: number): HourlyTrafficData[] {
  const dayIndex = daysBetween(trafficConfig.startDate, startOfUtcDay(now));
  const weights = Array.from({ length: 24 }, (_, hour) => getHourlyTrafficWeight(hour, dayIndex));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const currentHour = now.getUTCHours();

  return weights.map((weight, hour) => ({
    hour: hour % 6 === 0 ? `${hour}:00` : `${hour}`,
    value: Math.max(1, Math.round((projectedToday * weight) / totalWeight)),
    isCurrent: hour === currentHour
  }));
}

function splitTotal(total: number, labels: string[], weights: number[], seed: number): BreakdownItem[] {
  const adjustedWeights = weights.map((weight, index) => weight * (0.92 + hashToFloat(seed + index * 811) * 0.16));
  const weightTotal = adjustedWeights.reduce((sum, value) => sum + value, 0);

  return labels.map((label, index) => {
    const percent = (adjustedWeights[index] / weightTotal) * 100;
    return {
      label,
      percent,
      value: Math.round(total * (percent / 100))
    };
  });
}

function getDailyTrend(now: Date, days: number): DailyViewData[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(startOfUtcDay(now), -(days - 1 - index));
    const isToday = date.getTime() === startOfUtcDay(now).getTime();
    const views = isToday ? getViewsBetween(date, now) : getDayIncrement(date);

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      views
    };
  });
}

function getWeeklyPattern(now: Date): WeeklyPatternData[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totals = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];

  for (let offset = 27; offset >= 0; offset -= 1) {
    const date = addDays(startOfUtcDay(now), -offset);
    const day = date.getUTCDay();
    totals[day] += getDayIncrement(date);
    counts[day] += 1;
  }

  return dayNames.map((day, index) => ({
    day,
    avgViews: counts[index] > 0 ? Math.round(totals[index] / counts[index]) : 0
  }));
}

function sumDaysEndingAt(now: Date, days: number, offsetDays = 0): number {
  const end = addDays(startOfUtcDay(now), -offsetDays + 1);
  let total = 0;

  for (let index = 0; index < days; index += 1) {
    total += getDayIncrement(addDays(end, -(index + 1)));
  }

  return total;
}

function getInsights(viewsToday: number, projectedToday: number, sevenDayAverage: number, last30Minutes: number, activeUsers: number): InsightData[] {
  const pacing = calculatePercentChange(projectedToday, sevenDayAverage);
  const liveShare = projectedToday > 0 ? (last30Minutes / projectedToday) * 100 : 0;

  return [
    {
      title: pacing >= 0 ? 'Traffic is pacing above average' : 'Traffic is pacing below average',
      body: `Projected volume is ${Math.abs(pacing).toFixed(1)}% ${pacing >= 0 ? 'above' : 'below'} the 7-day average.`,
      tone: pacing >= 0 ? 'green' : 'amber'
    },
    {
      title: 'Realtime activity is steady',
      body: `${activeUsers.toLocaleString()} active users generated ${last30Minutes.toLocaleString()} views in the last 30 minutes.`,
      tone: 'blue'
    },
    {
      title: 'Today is still building',
      body: `${viewsToday.toLocaleString()} views are logged so far, with ${projectedToday.toLocaleString()} projected by day end.`,
      tone: liveShare > 2 ? 'green' : 'blue'
    }
  ];
}

export async function getAnalyticsData(rangeDays = 30): Promise<AnalyticsData> {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const yesterdayStart = addDays(todayStart, -1);
  const tomorrowStart = addDays(todayStart, 1);
  const modeledTotal = calculateModeledViews(now);

  let totalViews = modeledTotal;
  let source: AnalyticsData['source'] = 'local';

  try {
    totalViews = await fetchViewCount();
    source = 'worker';
  } catch {
    source = 'local';
  }

  const viewsToday = getViewsBetween(todayStart, now);
  const projectedToday = getViewsBetween(todayStart, tomorrowStart);
  const yesterday = getViewsBetween(yesterdayStart, todayStart);
  const last24HoursCurrent = getViewsBetween(new Date(now.getTime() - DAY_MS), now);
  const last24HoursPrevious = getViewsBetween(new Date(now.getTime() - 2 * DAY_MS), new Date(now.getTime() - DAY_MS));
  const last7DaysTotal = sumDaysEndingAt(now, 7, 0);
  const previous7DaysTotal = sumDaysEndingAt(now, 7, 7);
  const last30DaysTotal = sumDaysEndingAt(now, 30, 0);
  const previous30DaysTotal = sumDaysEndingAt(now, 30, 30);
  const sevenDayAverage = Math.round(last7DaysTotal / 7);
  const previousSevenDayAverage = Math.round(previous7DaysTotal / 7);
  const currentHourlyRate = getCurrentHourlyRate(now, projectedToday);
  const realtimeMinutes = getRealtimeMinutes(now, currentHourlyRate);
  const last30Minutes = realtimeMinutes.reduce((sum, item) => sum + item.views, 0);
  const activeUsers = Math.max(3, Math.round(Math.sqrt(last30Minutes) * 3.8 + hashToFloat(daysBetween(trafficConfig.startDate, now) * 313) * 12));
  const seed = daysBetween(trafficConfig.startDate, now) * 977 + now.getUTCHours();

  return {
    totalViews,
    viewsToday,
    projectedToday,
    activeUsers,
    last30Minutes,
    currentHourlyRate,
    sevenDayAverage,
    previousSevenDayAverage,
    sevenDayTrend: createPeriod(sevenDayAverage, previousSevenDayAverage),
    yesterday,
    last24Hours: createPeriod(last24HoursCurrent, last24HoursPrevious),
    last7Days: createPeriod(last7DaysTotal, previous7DaysTotal),
    last30Days: createPeriod(last30DaysTotal, previous30DaysTotal),
    dailyTrend: getDailyTrend(now, rangeDays),
    weeklyPattern: getWeeklyPattern(now),
    realtimeMinutes,
    hourlyCurve: getHourlyCurve(now, projectedToday),
    trafficSources: splitTotal(viewsToday, ['Organic search', 'Direct', 'Referral', 'Social', 'Other'], [0.48, 0.24, 0.14, 0.09, 0.05], seed),
    topPages: splitTotal(viewsToday, ['/', '/connect4/', '/minify/', '/clean/', '/osrs/'], [0.32, 0.26, 0.16, 0.14, 0.12], seed + 101),
    devices: splitTotal(viewsToday, ['Desktop', 'Mobile', 'Tablet'], [0.56, 0.38, 0.06], seed + 202),
    insights: getInsights(viewsToday, projectedToday, sevenDayAverage, last30Minutes, activeUsers),
    lastUpdated: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    source
  };
}
