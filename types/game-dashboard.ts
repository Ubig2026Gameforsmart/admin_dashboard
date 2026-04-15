export interface GameDashboardKPI {
  totalSessions: number;
  totalParticipants: number;
  avgDuration: number;
  avgQuestions: number;
}

export interface ChartDataItem {
  name: string;
  count: number;
  id?: string;
  value?: number;
}

export interface GameDashboardCharts {
  trend: { date: string; count: number }[];
  apps: { name: string; value: number }[];
  topHosts: any[];
  recentActivity: any[];
  topCategories: ChartDataItem[];
  topStates: ChartDataItem[];
  topCities: ChartDataItem[];
  topCountries: ChartDataItem[];
}

export interface GameDashboardData {
  kpi: GameDashboardKPI;
  charts: GameDashboardCharts;
}
