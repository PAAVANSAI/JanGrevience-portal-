"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsFiltersProps {
  onFilterChange: (filters: { departmentId: string | null; startDate: string | null; endDate: string | null }) => void;
  isDepartmentAdmin: boolean;
  userDepartmentId: string | null;
}

export default function AnalyticsFilters({ onFilterChange, isDepartmentAdmin, userDepartmentId }: AnalyticsFiltersProps) {
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all_time");

  const supabase = createClient();

  useEffect(() => {
    // Only fetch departments if Super Admin
    if (!isDepartmentAdmin) {
      supabase.from("departments").select("id, name").eq("is_active", true)
        .then(({ data }) => {
          if (data) setDepartments(data);
        });
    }
  }, [isDepartmentAdmin, supabase]);

  const handleApply = () => {
    let startDate: string | null = null;
    let endDate: string | null = null;
    const now = new Date();

    if (dateRange === "last_30") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString();
    } else if (dateRange === "last_90") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      startDate = d.toISOString();
    } else if (dateRange === "this_year") {
      const d = new Date(now.getFullYear(), 0, 1);
      startDate = d.toISOString();
    }

    const deptId = isDepartmentAdmin ? userDepartmentId : (selectedDept || null);
    
    onFilterChange({
      departmentId: deptId,
      startDate,
      endDate
    });
  };

  return (
    <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm mb-6 flex flex-col sm:flex-row items-end gap-4">
      
      {!isDepartmentAdmin && (
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Department</label>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-bg border border-border rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue/50"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="w-full sm:w-auto">
        <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Date Range</label>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full px-3 py-2 bg-bg border border-border rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue/50"
        >
          <option value="all_time">All Time</option>
          <option value="last_30">Last 30 Days</option>
          <option value="last_90">Last 90 Days</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label className="block text-xs font-semibold text-text-muted uppercase mb-1 invisible">Apply</label>
        <button 
          onClick={handleApply}
          className="w-full px-5 py-2 bg-blue text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-hover transition-colors"
        >
          Apply Filters
        </button>
      </div>

    </div>
  );
}
