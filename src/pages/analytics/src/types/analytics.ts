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

export interface AnalyticsData {
  totalViews: number;
  today: AnalyticsPeriod;
  last24Hours: AnalyticsPeriod;
  last7Days: AnalyticsPeriod;
  last30Days: AnalyticsPeriod;
  dailyTrend: DailyViewData[];
  weeklyPattern: WeeklyPatternData[];
}