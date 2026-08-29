"use client";

import React, { useEffect, useState, useTransition } from "react";
import { fetchAnalyticsData } from "@/app/actions/analytics";
import { createClient } from "@/lib/supabase/client";
import SummaryCards from "@/components/analytics/SummaryCards";
import AnalyticsCharts from "@/components/analytics/Charts";
import PerformanceTable from "@/components/analytics/PerformanceTable";
import GeographicTable from "@/components/analytics/GeographicTable";
import AnalyticsFilters from "@/components/analytics/AnalyticsFilters";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [roleInfo, setRoleInfo] = useState<{ isDeptAdmin: boolean; deptId: string | null; loaded: boolean }>({
    isDeptAdmin: false, deptId: null, loaded: false
  });

  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role, department_id").eq("id", user.id).single();
        setRoleInfo({
          isDeptAdmin: profile?.role === "DEPT_ADMIN",
          deptId: profile?.department_id || null,
          loaded: true
        });
      }
    }
    checkRole();
  }, [supabase]);

  useEffect(() => {
    if (roleInfo.loaded) {
      loadData({});
    }
  }, [roleInfo.loaded]);

  const loadData = (filters: { departmentId?: string | null; startDate?: string | null; endDate?: string | null }) => {
    startTransition(async () => {
      try {
        const result = await fetchAnalyticsData(filters);
        setData(result);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      }
    });
  };

  if (!roleInfo.loaded || (!data && isPending)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">System-wide performance and volume metrics.</p>
        {(data as any)?.error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md break-all">
            <strong>Server Error:</strong> {(data as any).error}
          </div>
        )}
      </div>

      <AnalyticsFilters 
        onFilterChange={loadData} 
        isDepartmentAdmin={roleInfo.isDeptAdmin} 
        userDepartmentId={roleInfo.deptId} 
      />

      {isPending && (
        <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-sm border border-border px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-blue-600 flex items-center z-50">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Updating...
        </div>
      )}

      {data && (
        <>
          <SummaryCards summary={data.summary} />
          
          <AnalyticsCharts 
            volume={data.volume} 
            departmentDistribution={data.departmentDistribution} 
            statusDistribution={data.statusDistribution} 
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PerformanceTable performance={data.departmentPerformance} />
            </div>
            <div className="xl:col-span-1">
              <GeographicTable geo={data.geographicBreakdown} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
