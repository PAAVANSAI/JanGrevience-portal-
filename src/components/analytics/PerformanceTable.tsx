"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DepartmentPerformance } from "@/types/analytics";

interface PerformanceTableProps {
  performance: DepartmentPerformance[];
}

export default function PerformanceTable({ performance }: PerformanceTableProps) {
  
  const handleExport = () => {
    // Generate CSV
    const headers = [
      "Department", "Total", "Pending", "Overdue", 
      "Resolution Rate (%)", "SLA Compliance (%)", 
      "Avg Resolution (Days)", "Avg Satisfaction"
    ];
    
    const rows = performance.map(p => [
      `"${p.department_name}"`,
      p.total,
      p.pending,
      p.overdue,
      p.resolution_rate_percent,
      p.sla_compliance_percent,
      p.avg_resolution_days,
      p.avg_satisfaction
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `department_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Department Performance</h3>
          <p className="text-sm text-text-secondary mt-1">Detailed breakdown of resolution metrics across all departments.</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text-primary bg-bg border border-border rounded-lg hover:bg-surface-hover shadow-sm transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg text-text-muted text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Pending</th>
              <th className="px-6 py-4 text-right">Overdue</th>
              <th className="px-6 py-4 text-right">Res. Rate</th>
              <th className="px-6 py-4 text-right">SLA Comp.</th>
              <th className="px-6 py-4 text-right">Avg Time (Days)</th>
              <th className="px-6 py-4 text-right">Avg Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {performance.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-text-muted">No data available for the selected period.</td>
              </tr>
            ) : (
              performance.map((dept) => (
                <tr key={dept.department_name} className="hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary">{dept.department_name}</td>
                  <td className="px-6 py-4 text-right text-text-secondary">{dept.total}</td>
                  <td className="px-6 py-4 text-right text-text-secondary">{dept.pending}</td>
                  <td className="px-6 py-4 text-right text-rose-600 font-medium">{dept.overdue > 0 ? dept.overdue : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      dept.resolution_rate_percent >= 80 ? 'bg-emerald-50 text-emerald-700' : 
                      dept.resolution_rate_percent >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {dept.resolution_rate_percent}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-text-secondary">{dept.sla_compliance_percent}%</td>
                  <td className="px-6 py-4 text-right text-text-secondary">{dept.avg_resolution_days}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-text-primary font-medium">{dept.avg_satisfaction}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
