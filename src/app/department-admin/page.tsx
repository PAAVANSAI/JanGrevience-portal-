"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { useUserRole } from "@/lib/context/UserContext";
import StatusBadge from "@/components/ui/StatusBadge";
import SignOutButton from "@/components/auth/SignOutButton";
import GrievanceCalendar from "@/components/analytics/GrievanceCalendar";

export default function DepartmentAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentGrievances, setRecentGrievances] = useState<any[]>([]);
  const [officerCount, setOfficerCount] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [deptName, setDeptName] = useState("");

  const supabase = createClient();
  const { profile } = useUserRole();
  const adminName = profile?.full_name || "Admin";

  useEffect(() => {
    if (!profile?.department_id) {
      setLoading(false);
      return;
    }
    loadDashboardData();
  }, [profile?.department_id]);

  async function loadDashboardData() {
    try {
      const deptId = profile!.department_id;

      const [
        { data: summaryData },
        { data: deptData },
        { data: officersData },
        { data: grievancesData },
      ] = await Promise.all([
        supabase.rpc("get_analytics_summary", { p_department_id: deptId }),
        supabase.from("departments").select("name").eq("id", deptId).single(),
        supabase
          .from("profiles")
          .select("id")
          .eq("department_id", deptId)
          .eq("role", "OFFICER"),
        supabase
          .from("grievances")
          .select(
            `id, grievance_number, subject, status, created_at, 
             grievance_assignments(officer_id, profiles:officer_id(full_name)),
             categories(name)`
          )
          .eq("department_id", deptId)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (summaryData && summaryData.length > 0) setStats(summaryData[0]);
      if (deptData) setDeptName(deptData.name);
      if (officersData) setOfficerCount(officersData.length);

      if (grievancesData) {
        setRecentGrievances(grievancesData);
        const unassigned = grievancesData.filter(
          (g: any) =>
            (!g.grievance_assignments || g.grievance_assignments.length === 0) &&
            !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status)
        ).length;
        // Re-fetch a full count for unassigned
        const { count } = await supabase
          .from("grievances")
          .select("id", { count: "exact", head: true })
          .eq("department_id", profile!.department_id)
          .not("status", "in", '("RESOLVED","CLOSED","REJECTED")');
        
        // Count those without assignments
        const { data: allActiveGrievances } = await supabase
          .from("grievances")
          .select("id, grievance_assignments(officer_id)")
          .eq("department_id", profile!.department_id)
          .not("status", "in", '("RESOLVED","CLOSED","REJECTED")');

        const totalUnassigned = allActiveGrievances?.filter(
          (g: any) => !g.grievance_assignments || g.grievance_assignments.length === 0
        ).length || 0;
        setUnassignedCount(totalUnassigned);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  // No department assigned
  if (!loading && !profile?.department_id) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-surface border border-border rounded-2xl p-10 text-center max-w-md shadow-sm">
            <div className="w-16 h-16 bg-warning-bg text-warning rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No Department Assigned</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your account has Department Admin privileges, but you haven't been assigned to a department yet. Please contact a Super Admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-80 bg-surface-2 rounded-lg mb-2" />
          <div className="h-4 w-52 bg-surface-2 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
              <div className="h-8 w-16 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-2 rounded-lg" />
                <div>
                  <div className="h-4 w-28 bg-surface-2 rounded mb-2" />
                  <div className="h-3 w-36 bg-surface-2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Grievances",
          count: Number(stats.total_grievances) || 0,
          accent: "stat-card-blue",
          iconColor: "text-blue bg-blue/10",
          icon: (
            <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </>
          ),
        },
        {
          label: "Pending",
          count: Number(stats.pending_grievances) || 0,
          accent: "stat-card-amber",
          iconColor: "text-warning bg-warning-bg",
          icon: (
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          ),
        },
        {
          label: "Resolved",
          count: Number(stats.resolved_grievances) || 0,
          accent: "stat-card-green",
          iconColor: "text-success bg-success-bg",
          icon: <polyline points="20 6 9 17 4 12" />,
        },
        {
          label: "Overdue",
          count: Number(stats.overdue_grievances) || 0,
          accent: "stat-card-purple",
          iconColor: "text-error bg-error-bg",
          icon: (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          ),
        },
      ]
    : [];

  const quickLinks = [
    {
      title: "All Grievances",
      desc: "View & manage all department grievances",
      href: "/department-admin/grievances",
      iconColor: "text-blue bg-blue/10",
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </>
      ),
    },
    {
      title: "Unassigned",
      desc: `${unassignedCount} grievance${unassignedCount !== 1 ? "s" : ""} need assignment`,
      href: "/department-admin/grievances?filter=unassigned",
      iconColor: "text-amber-600 bg-amber-50",
      badge: unassignedCount > 0 ? unassignedCount : undefined,
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </>
      ),
    },
    {
      title: "Manage Officers",
      desc: `${officerCount} officer${officerCount !== 1 ? "s" : ""} in department`,
      href: "/department-admin/officers",
      iconColor: "text-emerald-600 bg-emerald-50",
      icon: (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
    {
      title: "Analytics",
      desc: "Charts & performance metrics",
      href: "/department-admin/analytics",
      iconColor: "text-indigo-600 bg-indigo-50",
      icon: (
        <>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </>
      ),
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Welcome, <span className="gradient-text">{adminName}</span> 🏢
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {deptName && <><span className="font-medium text-text-primary">{deptName}</span> &bull; </>}
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/department-admin/grievances?filter=unassigned"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-surface text-text-primary border border-border hover:bg-surface-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-all card-hover"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Unassigned ({unassignedCount})
          </Link>
          <Link
            href="/department-admin/grievances"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover focus:ring-2 focus:ring-offset-2 focus:ring-blue shadow-sm hover:shadow-md transition-all card-hover"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            All Grievances
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          {statCards.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover ${stat.accent}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconColor}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {stat.icon}
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-text-primary">
                <AnimatedCounter value={stat.count} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unassigned Alert Banner */}
      {unassignedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <Link
            href="/department-admin/grievances?filter=unassigned"
            className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100/70 transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {unassignedCount} grievance{unassignedCount !== 1 ? "s" : ""} awaiting assignment
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Click to review and assign to officers</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 group-hover:text-amber-700 transition-colors flex-shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link, i) => (
            <Link
              key={link.title}
              href={link.href}
              className="flex items-center gap-3.5 p-4 bg-surface rounded-xl border border-border shadow-sm hover:shadow-card-hover hover:border-blue/30 transition-all group card-hover relative"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${link.iconColor} transition-transform group-hover:scale-110`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {link.icon}
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-text-primary group-hover:text-blue transition-colors">{link.title}</h3>
                <p className="text-xs text-text-muted truncate">{link.desc}</p>
              </div>
              {link.badge && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-white bg-amber-500 w-5 h-5 rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Grievance Calendar */}
      {profile?.department_id && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <GrievanceCalendar departmentId={profile.department_id} />
        </motion.div>
      )}

      {/* Recent Grievances Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Grievances</h2>
          <Link href="/department-admin/grievances" className="text-sm font-medium text-blue hover:text-blue-hover transition-colors">
            View all →
          </Link>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-2 border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Assigned To</th>
                  <th className="px-5 py-3.5 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-text-muted">
                      No grievances found in your department.
                    </td>
                  </tr>
                ) : (
                  recentGrievances.map((g: any) => {
                    const assignedOfficer =
                      g.grievance_assignments?.[0]?.profiles?.full_name || null;
                    const isUnassigned =
                      !g.grievance_assignments || g.grievance_assignments.length === 0;

                    return (
                      <tr key={g.id} className="hover:bg-surface-2 transition-colors group">
                        <td className="px-5 py-3.5 font-mono text-xs font-medium">
                          <Link
                            href={`/department-admin/grievances/${g.id}`}
                            className="text-blue hover:text-blue-hover hover:underline underline-offset-2"
                          >
                            {g.grievance_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-text-primary max-w-[160px] sm:max-w-[240px] truncate">
                            <Link href={`/department-admin/grievances/${g.id}`} className="hover:text-blue transition-colors">
                              {g.subject}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-text-secondary text-sm">{g.categories?.name || "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={g.status} />
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {isUnassigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              Unassigned
                            </span>
                          ) : (
                            <span className="text-sm text-text-primary">{assignedOfficer}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-text-muted text-xs hidden sm:table-cell">
                          {new Date(g.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
