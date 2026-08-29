export interface AnalyticsSummary {
  total_grievances: number;
  pending_grievances: number;
  resolved_grievances: number;
  overdue_grievances: number;
}

export interface MonthlyVolume {
  month: string;
  grievances: number;
}

export interface DepartmentDistribution {
  department_name: string;
  grievances: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface DepartmentPerformance {
  department_name: string;
  total: number;
  pending: number;
  overdue: number;
  resolution_rate_percent: number;
  sla_compliance_percent: number;
  avg_resolution_days: number;
  avg_satisfaction: number;
}

export interface GeographicBreakdown {
  state: string;
  district: string;
  grievances: number;
}
