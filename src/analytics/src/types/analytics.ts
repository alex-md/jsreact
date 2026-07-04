export interface ViewData {
  count: number;
  date: Date;
}

export interface AnalyticsPeriod {
  current: number;
  previous: number;
  percentChange: number;
}

export interface DailyViewData {
  date: string;
  views: number;
}

export interface WeeklyPatternData {
  day: string;
  avgViews: number;
}

export interface BreakdownItem {
  label: string;
  value: number;
  percent: number;
}

export interface RealtimeMinuteData {
  minute: string;
  views: number;
}

export interface HourlyTrafficData {
  hour: string;
  value: number;
  isCurrent: boolean;
}

export interface InsightData {
  title: string;
  body: string;
  tone: 'blue' | 'green' | 'amber' | 'rose';
}

export interface AnalyticsData {
  totalViews: number;
  viewsToday: number;
  projectedToday: number;
  activeUsers: number;
  last30Minutes: number;
  currentHourlyRate: number;
  sevenDayAverage: number;
  previousSevenDayAverage: number;
  sevenDayTrend: AnalyticsPeriod;
  yesterday: number;
  last24Hours: AnalyticsPeriod;
  last7Days: AnalyticsPeriod;
  last30Days: AnalyticsPeriod;
  dailyTrend: DailyViewData[];
  weeklyPattern: WeeklyPatternData[];
  realtimeMinutes: RealtimeMinuteData[];
  hourlyCurve: HourlyTrafficData[];
  trafficSources: BreakdownItem[];
  topPages: BreakdownItem[];
  devices: BreakdownItem[];
  insights: InsightData[];
  lastUpdated: string;
  source: 'worker' | 'local';
}
