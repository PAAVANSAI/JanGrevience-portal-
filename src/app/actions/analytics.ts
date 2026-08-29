"use server";

import { createClient } from "@/lib/supabase/server";
import type { 
  AnalyticsSummary, 
  MonthlyVolume, 
  DepartmentDistribution, 
  StatusDistribution,
  DepartmentPerformance,
  GeographicBreakdown
} from "@/types/analytics";

interface AnalyticsFilter {
  departmentId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

// Helper to verify admin role
async function verifyAdminAccess(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department_id")
    .eq("id", user.id)
    .single();
    
  if (!profile || (profile.role !== "SUPER_ADMIN" && profile.role !== "DEPT_ADMIN")) {
    console.error("verifyAdminAccess failed", { user, profile });
    throw new Error(`Unauthorized. User: ${user.id}, Profile: ${JSON.stringify(profile)}`);
  }
  
  return profile;
}

export async function fetchAnalyticsData(filters: AnalyticsFilter) {
  const supabase = await createClient();
  const profile = await verifyAdminAccess(supabase);
  
  // If Dept Admin, force their department ID
  let effectiveDeptId = filters.departmentId;
  if (profile.role === "DEPT_ADMIN") {
    effectiveDeptId = profile.department_id;
  }
  
  const args = {
    p_department_id: effectiveDeptId || null,
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
  };

  // Run all RPCs in parallel for performance
  const [
    { data: summaryData, error: summaryErr },
    { data: volumeData, error: volumeErr },
    { data: deptDistData, error: deptDistErr },
    { data: statusDistData, error: statusDistErr },
    { data: performanceData, error: perfErr },
    { data: geoData, error: geoErr }
  ] = await Promise.all([
    supabase.rpc("get_analytics_summary", args),
    supabase.rpc("get_analytics_monthly_volume", args),
    supabase.rpc("get_analytics_department_distribution", { 
      p_start_date: args.p_start_date, 
      p_end_date: args.p_end_date 
    }), // Does not take dept_id
    supabase.rpc("get_analytics_status_distribution", args),
    supabase.rpc("get_analytics_department_performance", args),
    supabase.rpc("get_analytics_geographic_breakdown", args)
  ]);

  if (summaryErr) console.error("Summary error:", summaryErr);
  if (volumeErr) console.error("Volume error:", volumeErr);
  if (deptDistErr) console.error("Dept Dist error:", deptDistErr);
  if (statusDistErr) console.error("Status Dist error:", statusDistErr);
  if (perfErr) console.error("Perf error:", perfErr);
  if (geoErr) console.error("Geo error:", geoErr);

  const summaryFinal = Array.isArray(summaryData) ? summaryData[0] : summaryData;

  return {
    error: summaryErr ? JSON.stringify(summaryErr) : null,
    summary: (summaryFinal as AnalyticsSummary) || {
      total_grievances: 0, pending_grievances: 0, resolved_grievances: 0, overdue_grievances: 0
    },
    volume: (volumeData as MonthlyVolume[]) || [],
    departmentDistribution: (deptDistData as DepartmentDistribution[]) || [],
    statusDistribution: (statusDistData as StatusDistribution[]) || [],
    departmentPerformance: (performanceData as DepartmentPerformance[]) || [],
    geographicBreakdown: (geoData as GeographicBreakdown[]) || []
  };
}
