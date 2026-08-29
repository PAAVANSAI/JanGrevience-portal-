"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsData } from "@/types/analytics";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { useUserRole } from "@/lib/context/UserContext";
import StatusBadge from "@/components/ui/StatusBadge";
import SignOutButton from "@/components/auth/SignOutButton";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [escalated, setEscalated] = useState<any[]>([]);
  const [recentGrievances, setRecentGrievances] = useState<any[]>([]);
  const [userCounts, setUserCounts] = useState({ total: 0, officers: 0, citizens: 0, admins: 0 });
  const supabase = createClient();
  const { profile } = useUserRole();

  const adminName = profile?.full_name || "Admin";

  useEffect(() => {
    async function loadData() {
      try {
        const [
          { data: result, error },
          { data: escData },
          { data: recentData },
          { data: profilesData }
        ] = await Promise.all([
          supabase.rpc("get_analytics_summary"),
          supabase
            .from("grievances")
            .select("id, grievance_number, subject, status, created_at, departments(name)")
            .eq("escalation_level", 2)
            .in("status", ["SUBMITTED", "IN_PROGRESS"])
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("grievances")
            .select("id, grievance_number, subject, status, created_at, departments(name)")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("profiles")
            .select("role")
        ]);

        if (error) throw error;
        setData(result);
        if (escData) setEscalated(escData);
        if (recentData) setRecentGrievances(recentData);
        if (profilesData) {
          setUserCounts({
            total: profilesData.length,
            officers: profilesData.filter((p: any) => p.role === "OFFICER").length,
            citizens: profilesData.filter((p: any) => p.role === "CITIZEN").length,
            admins: profilesData.filter((p: any) => p.role === "SUPER_ADMIN" || p.role === "DEPT_ADMIN").length,
          });
        }
      } catch (err: any) {
        console.error("Failed to load analytics", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const summary = data && data.length > 0 ? data[0] : null;

  const statCards = summary
    ? [
        {
          label: "Total Grievances",
          count: Number(summary.total_grievances) || 0,
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
          label: "Pending Review",
          count: Number(summary.pending_grievances) || 0,
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
          count: Number(summary.resolved_grievances) || 0,
          accent: "stat-card-green",
          iconColor: "text-success bg-success-bg",
          icon: <polyline points="20 6 9 17 4 12" />,
        },
        {
          label: "Overdue",
          count: Number(summary.overdue_grievances) || 0,
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
      title: "Manage Users",
      desc: "Roles, access & accounts",
      href: "/admin/users",
      iconColor: "text-blue bg-blue/10",
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
      title: "Departments",
      desc: "Create & edit departments",
      href: "/admin/departments",
      iconColor: "text-emerald-600 bg-emerald-50",
      icon: (
        <>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </>
      ),
    },
    {
      title: "Categories",
      desc: "Organize grievance types",
      href: "/admin/categories",
      iconColor: "text-violet-600 bg-violet-50",
      icon: (
        <>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </>
      ),
    },
    {
      title: "Dept. Contacts",
      desc: "Public nodal officers",
      href: "/admin/department-contacts",
      iconColor: "text-sky-600 bg-sky-50",
      icon: (
        <>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </>
      ),
    },
    {
      title: "SLA Rules",
      desc: "Resolution deadlines",
      href: "/admin/sla-rules",
      iconColor: "text-amber-600 bg-amber-50",
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      ),
    },
    {
      title: "Services",
      desc: "Citizen services directory",
      href: "/admin/services",
      iconColor: "text-teal-600 bg-teal-50",
      icon: (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      ),
    },
    {
      title: "Analytics",
      desc: "Charts & performance data",
      href: "/admin/analytics",
      iconColor: "text-indigo-600 bg-indigo-50",
      icon: (
        <>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </>
      ),
    },
    {
      title: "Audit Logs",
      desc: "Track all system changes",
      href: "/admin/audit-logs",
      iconColor: "text-rose-600 bg-rose-50",
      icon: (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </>
      ),
    },
    {
      title: "System Settings",
      desc: "Global configuration",
      href: "/admin/settings",
      iconColor: "text-gray-600 bg-gray-100",
      icon: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      ),
    },
  ];

  // Skeleton loader
  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-72 bg-surface-2 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-surface-2 rounded-lg" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
              <div className="h-3 w-20 bg-surface-2 rounded mb-4" />
              <div className="h-8 w-16 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
        {/* Quick actions skeleton */}
        <div className="h-5 w-32 bg-surface-2 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Greeting & System Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Welcome, <span className="gradient-text">{adminName}</span> 🛡️
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            System-wide performance overview &bull;{" "}
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
            href="/admin/analytics"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-surface text-text-primary border border-border hover:bg-surface-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-all card-hover"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            View Analytics
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover focus:ring-2 focus:ring-offset-2 focus:ring-blue shadow-sm hover:shadow-md transition-all card-hover"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Manage Users
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Premium Stat Cards */}
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

      {/* User Stats Mini-Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-surface border border-border rounded-xl p-5 mb-8 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Registered Users</h2>
          <Link href="/admin/users" className="text-xs font-medium text-blue hover:text-blue-hover transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: userCounts.total, color: "text-text-primary" },
            { label: "Citizens", value: userCounts.citizens, color: "text-blue" },
            { label: "Officers", value: userCounts.officers, color: "text-emerald-600" },
            { label: "Admins", value: userCounts.admins, color: "text-violet-600" },
          ].map((item, i) => (
            <div key={i} className="text-center sm:text-left">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>
                <AnimatedCounter value={item.value} />
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Two-Column Layout: Quick Actions + Escalations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions — takes 2 columns */}
        <div className="xl:col-span-2">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-3.5 p-4 bg-surface rounded-xl border border-border shadow-sm hover:shadow-card-hover hover:border-blue/30 transition-all h-full group card-hover"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${link.iconColor} transition-transform group-hover:scale-110`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {link.icon}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-text-primary group-hover:text-blue transition-colors">{link.title}</h3>
                    <p className="text-xs text-text-muted truncate">{link.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* State Level Escalations — takes 1 column */}
        <div className="xl:col-span-1">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Escalations</span>
            {escalated.length > 0 && (
              <span className="ml-auto text-xs font-bold text-white bg-error px-2 py-0.5 rounded-full">
                {escalated.length}
              </span>
            )}
          </h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm h-[calc(100%-2.5rem)]">
            {escalated.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-12 h-12 bg-success-bg text-success rounded-xl flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-primary">All clear!</p>
                <p className="text-xs text-text-muted mt-1">No Level 2 escalations at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {escalated.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <Link
                      href={`/officer/grievances/${g.id}`}
                      className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-mono text-xs font-semibold text-error mb-0.5">{g.grievance_number}</p>
                        <p className="text-sm text-text-primary truncate">{g.subject}</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-blue transition-colors flex-shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Grievances Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">Recent Grievances</h2>
          <Link href="/admin/analytics" className="text-sm font-medium text-blue hover:text-blue-hover transition-colors">
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
                  <th className="px-5 py-3.5 hidden sm:table-cell">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right hidden sm:table-cell">Filed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                      No grievances found.
                    </td>
                  </tr>
                ) : (
                  recentGrievances.map((g: any) => (
                    <tr key={g.id} className="hover:bg-surface-2 transition-colors group">
                      <td className="px-5 py-3.5 font-mono text-xs font-medium">
                        <Link href={`/officer/grievances/${g.id}`} className="text-blue hover:text-blue-hover hover:underline underline-offset-2">
                          {g.grievance_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-text-primary max-w-[180px] sm:max-w-[280px] truncate">
                          <Link href={`/officer/grievances/${g.id}`} className="hover:text-blue transition-colors">
                            {g.subject}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-text-secondary text-sm">{g.departments?.name || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-text-muted text-xs hidden sm:table-cell">
                        {new Date(g.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
