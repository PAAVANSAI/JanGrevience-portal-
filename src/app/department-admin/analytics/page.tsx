"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/UserContext";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

/* ─── colour palette ─── */
const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:   "#6366f1", // indigo
  ACKNOWLEDGED:"#8b5cf6", // violet
  ASSIGNED:    "#3b82f6", // blue
  IN_PROGRESS: "#f59e0b", // amber
  RESOLVED:    "#10b981", // emerald
  CLOSED:      "#0ea5e9", // sky
  REJECTED:    "#ef4444", // red
  ESCALATED:   "#f97316", // orange
};

const CATEGORY_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b",
];

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  fontSize: "13px",
};

/* ─── helper: nice status label ─── */
function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function DepartmentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const supabase = createClient();
  const { profile } = useUserRole();

  useEffect(() => {
    if (profile?.department_id) loadStats();
  }, [profile?.department_id]);

  /* ─────────── data fetching ─────────── */
  async function loadStats() {
    setLoading(true);
    try {
      // 1. All grievances in this department
      const { data: grievances } = await supabase
        .from("grievances")
        .select("id, status, created_at, category_id, escalation_level, categories(name), grievance_assignments(officer_id)")
        .eq("department_id", profile!.department_id);

      // 2. All officers in this department
      const { data: officers } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_on_leave")
        .eq("department_id", profile!.department_id)
        .in("role", ["OFFICER", "DEPT_ADMIN"]);

      const g = grievances || [];
      const o = officers || [];

      /* ── summary counts ── */
      const total = g.length;
      const resolvedCount = g.filter(x => ["RESOLVED", "CLOSED"].includes(x.status)).length;
      const pendingCount  = g.filter(x => !["RESOLVED", "CLOSED", "REJECTED"].includes(x.status)).length;
      const unassignedCount = g.filter(x =>
        !x.grievance_assignments || x.grievance_assignments.length === 0
      ).filter(x => !["RESOLVED", "CLOSED", "REJECTED"].includes(x.status)).length;
      const escalatedCount = g.filter(x => (x.escalation_level ?? 0) > 0 && !["RESOLVED", "CLOSED", "REJECTED"].includes(x.status)).length;
      const activeOfficers = o.filter(x => !x.is_on_leave).length;
      const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

      /* ── status breakdown (pie) ── */
      const statusCounts: Record<string, number> = {};
      g.forEach(x => { statusCounts[x.status] = (statusCounts[x.status] || 0) + 1; });
      const statusData = Object.entries(statusCounts)
        .map(([name, value]) => ({ name: statusLabel(name), value, key: name }))
        .filter(d => d.value > 0);

      /* ── category distribution (bar) ── */
      const catCounts: Record<string, number> = {};
      g.forEach(x => {
        const catName = (x.categories as any)?.name || "Uncategorised";
        catCounts[catName] = (catCounts[catName] || 0) + 1;
      });
      const categoryData = Object.entries(catCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      /* ── officer workload ── */
      const officerMap: Record<string, { name: string; active: number; resolved: number; total: number }> = {};
      o.forEach(x => { officerMap[x.id] = { name: x.full_name, active: 0, resolved: 0, total: 0 }; });

      g.forEach(x => {
        if (x.grievance_assignments && x.grievance_assignments.length > 0) {
          x.grievance_assignments.forEach((a: any) => {
            if (officerMap[a.officer_id]) {
              officerMap[a.officer_id].total += 1;
              if (["RESOLVED", "CLOSED"].includes(x.status)) {
                officerMap[a.officer_id].resolved += 1;
              } else {
                officerMap[a.officer_id].active += 1;
              }
            }
          });
        }
      });

      // Only show officers who have at least 1 case on the workload chart
      const workloadData = Object.values(officerMap)
        .filter(x => x.total > 0)
        .sort((a, b) => b.total - a.total)
        .map(x => ({
          name: x.name.length > 14 ? x.name.substring(0, 12) + "…" : x.name,
          fullName: x.name,
          active: x.active,
          resolved: x.resolved,
        }));

      // Leaderboard: all officers, sorted by total resolved desc
      const leaderboard = Object.values(officerMap)
        .sort((a, b) => (b.resolved + b.active) - (a.resolved + a.active));

      setStats({
        total: total || 0,
        resolvedCount: resolvedCount || 0,
        pendingCount: pendingCount || 0,
        unassignedCount: unassignedCount || 0,
        escalatedCount: escalatedCount || 0,
        activeOfficers: activeOfficers || 0,
        resolutionRate: resolutionRate || 0,
        statusData: statusData || [],
        categoryData: categoryData || [],
        workloadData: workloadData || [],
        leaderboard: leaderboard || [],
      });
    } catch (err) {
      console.error("Analytics load error:", err);
      // Set safe empty stats so the page renders with empty states instead of crashing
      setStats({
        total: 0, resolvedCount: 0, pendingCount: 0, unassignedCount: 0, escalatedCount: 0,
        activeOfficers: 0, resolutionRate: 0,
        statusData: [], categoryData: [], workloadData: [], leaderboard: [],
      });
    } finally {
      setLoading(false);
    }
  }

  /* ─────────── render ─────────── */
  if (!profile?.department_id) {
    return <div className="p-8 text-center text-text-muted">You are not assigned to a department.</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        title="Department Analytics"
        description="Real-time performance metrics, workload insights, and officer leaderboard."
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-2 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* ═══ Summary Cards ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Total" value={stats.total} color="text-navy" />
            <StatCard label="Resolved" value={stats.resolvedCount} color="text-emerald-600" />
            <StatCard label="Pending" value={stats.pendingCount} color="text-amber-600" />
            <StatCard label="Unassigned" value={stats.unassignedCount} color="text-rose-500" />
            <StatCard label="Escalated" value={stats.escalatedCount} color="text-orange-600" />
            <StatCard label="Officers" value={stats.activeOfficers} color="text-blue" sub="Active" />
          </div>

          {/* ═══ Resolution Rate Banner ═══ */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs uppercase font-semibold text-text-muted tracking-wider mb-1">Resolution Rate</p>
              <p className="text-3xl font-bold text-navy">{stats.resolutionRate}%</p>
            </div>
            <div className="flex-1 h-3 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stats.resolutionRate}%`,
                  background: stats.resolutionRate >= 75
                    ? "linear-gradient(90deg, #10b981, #0ea5e9)"
                    : stats.resolutionRate >= 40
                      ? "linear-gradient(90deg, #f59e0b, #f97316)"
                      : "linear-gradient(90deg, #ef4444, #f97316)",
                }}
              />
            </div>
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
              {stats.resolvedCount} / {stats.total} cases
            </span>
          </div>

          {/* ═══ Charts Row ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Status Breakdown (Pie) ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col" style={{ minHeight: 380 }}>
              <h3 className="text-base font-bold text-navy mb-4">Status Breakdown</h3>
              {(stats.statusData?.length ?? 0) === 0 ? (
                <EmptyChart message="No grievances filed yet." />
              ) : (
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={stats.statusData.length > 1 ? 4 : 0}
                        dataKey="value"
                      >
                        {stats.statusData.map((d: any, i: number) => (
                          <Cell key={i} fill={STATUS_COLORS[d.key] || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Category Distribution (Horizontal Bar) ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col" style={{ minHeight: 380 }}>
              <h3 className="text-base font-bold text-navy mb-4">Category Distribution</h3>
              {(stats.categoryData?.length ?? 0) === 0 ? (
                <EmptyChart message="No categories to show." />
              ) : (
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={stats.categoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                      <Bar dataKey="value" name="Grievances" radius={[0, 6, 6, 0]}>
                        {stats.categoryData.map((_: any, i: number) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Officer Workload Chart ═══ */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-navy mb-4">Officer Workload</h3>
            {(stats.workloadData?.length ?? 0) === 0 ? (
              <EmptyChart message="No cases have been assigned to officers yet. Assign grievances to see workload distribution." />
            ) : (
              <div style={{ height: Math.max(300, stats.workloadData.length * 45) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.workloadData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12, fill: "#334155" }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      formatter={(value: any, name: string) => [value, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="active" name="Active Cases" stackId="stack" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" stackId="stack" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ═══ Leaderboard ═══ */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-navy mb-4">Officer Performance Leaderboard</h3>
            {!stats.leaderboard?.length || stats.leaderboard.every((o: any) => o.total === 0) ? (
              <EmptyChart message="No officer has handled any cases yet. The leaderboard will populate once cases are assigned." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs uppercase text-text-muted font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg w-14">Rank</th>
                      <th className="px-4 py-3">Officer Name</th>
                      <th className="px-4 py-3 text-center">Active</th>
                      <th className="px-4 py-3 text-center">Resolved</th>
                      <th className="px-4 py-3 text-center rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.leaderboard
                      .filter((o: any) => o.total > 0)
                      .map((officer: any, index: number) => (
                      <tr key={officer.name} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-text-primary">{officer.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            {officer.active}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            {officer.resolved}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-text-primary">{officer.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ─── reusable components ─── */

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-1">
      <span className="text-[11px] uppercase font-semibold text-text-muted tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-text-muted mb-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path d="M9 10h.01M15 10h.01M9.5 15.5a3.5 3.5 0 015 0" />
        </svg>
      </div>
      <p className="text-sm text-text-muted max-w-xs">{message}</p>
    </div>
  );
}
