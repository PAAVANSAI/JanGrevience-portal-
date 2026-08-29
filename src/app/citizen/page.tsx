import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { calculateSlaStatus } from "@/lib/utils/sla";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import AutoSubmitSelect from "@/components/ui/AutoSubmitSelect";

interface PageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export default async function CitizenHomePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";
  const sort = searchParams?.sort || "newest";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Build the grievance query dynamically
  let query = supabase
    .from("grievances")
    .select(`
      id,
      grievance_number,
      subject,
      status,
      due_date,
      created_at,
      departments (name),
      categories (name, sla_rules(target_days, reminder_threshold_percent))
    `)
    .eq("citizen_id", user?.id);

  if (q) {
    query = query.or(`subject.ilike.%${q}%,grievance_number.ilike.%${q}%`);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "status") {
    query = query.order("status", { ascending: true });
  } else {
    // default to newest
    query = query.order("created_at", { ascending: false });
  }

  // Use Promise.all to fetch all user-dependent data concurrently
  const [
    { data: profile },
    { data: allStatuses },
    { data: recentGrievances }
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user?.id)
      .single(),
    
    supabase
      .from("grievances")
      .select("status")
      .eq("citizen_id", user?.id),
      
    query
  ]);

  const fullName = profile?.full_name || "Citizen";

  // Compute Summary Counts
  const total = allStatuses?.length || 0;
  const pending = allStatuses?.filter((g) => g.status === "SUBMITTED").length || 0;
  const inProgress = allStatuses?.filter((g) => g.status === "IN_PROGRESS").length || 0;
  const resolved = allStatuses?.filter((g) => g.status === "RESOLVED").length || 0;

  const hasGrievances = total > 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header userEmail={user?.email} userName={fullName} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Greeting & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Welcome back, <span className="gradient-text">{fullName}</span> 👋
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Here's what's happening with your complaints.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link 
              href="/track"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-surface text-text-primary border border-border hover:bg-surface-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-all card-hover"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Track ID
            </Link>
            <Link 
              href="/grievances/new"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover focus:ring-2 focus:ring-offset-2 focus:ring-blue shadow-sm hover:shadow-md transition-all card-hover"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              File Grievance
            </Link>
          </div>
        </div>

        {!hasGrievances ? (
          /* Enhanced Empty State */
          <div className="animate-fade-in-up bg-surface border border-border rounded-3xl p-12 text-center max-w-2xl mx-auto mt-4 shadow-sm relative overflow-hidden card-hover">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue to-transparent opacity-60" />
            <div className="mx-auto w-20 h-20 bg-blue/10 text-blue rounded-2xl flex items-center justify-center mb-6 border border-blue/20">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">No grievances yet</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto leading-relaxed text-sm">
              When you submit a complaint about public services or infrastructure, you can track its progress right here.
            </p>
            <Link 
              href="/grievances/new"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 py-3 text-base font-semibold bg-blue text-white hover:bg-blue-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus:ring-4 focus:ring-blue/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Submit your first grievance
            </Link>
          </div>
        ) : (
          /* Populated Dashboard */
          <>
            {/* Premium Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
              {[
                { 
                  label: "Total Filed", count: total, 
                  accent: "stat-card-blue",
                  iconColor: "text-blue bg-blue/10",
                  icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
                },
                { 
                  label: "Pending Review", count: pending, 
                  accent: "stat-card-amber",
                  iconColor: "text-warning bg-warning-bg",
                  icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
                },
                { 
                  label: "In Progress", count: inProgress, 
                  accent: "stat-card-purple",
                  iconColor: "text-info bg-info-bg",
                  icon: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>
                },
                { 
                  label: "Resolved", count: resolved, 
                  accent: "stat-card-green",
                  iconColor: "text-success bg-success-bg",
                  icon: <><polyline points="20 6 9 17 4 12"/></>
                },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover ${stat.accent}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stat.label}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconColor}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {stat.icon}
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-text-primary">
                    <AnimatedCounter value={stat.count} />
                  </div>
                </div>
              ))}
            </div>

            {/* Grievances List */}
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-text-primary">Your Grievances</h2>
                
                <form className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text"
                      name="q"
                      defaultValue={q}
                      placeholder="Search by ID or subject…"
                      className="pl-9 pr-3 py-2 border border-border rounded-[var(--radius-md)] text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue w-full sm:w-56"
                    />
                  </div>
                  <AutoSubmitSelect
                    name="sort"
                    defaultValue={sort}
                    className="px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="status">By Status</option>
                  </AutoSubmitSelect>
                  <button type="submit" className="sr-only">Search</button>
                </form>
              </div>
              
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-2 border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Grievance ID</th>
                        <th className="px-5 py-3.5">Subject</th>
                        <th className="px-5 py-3.5 hidden sm:table-cell">Department</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right hidden sm:table-cell">Filed On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentGrievances?.map((g: any) => (
                        <tr key={g.id} className="hover:bg-surface-2 transition-colors group">
                          <td className="px-5 py-3.5 font-mono text-xs font-medium">
                            <Link href={`/grievances/${g.id}`} className="text-blue hover:text-blue-hover hover:underline underline-offset-2">
                              {g.grievance_number}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-text-primary max-w-[140px] sm:max-w-[240px] truncate" title={g.subject}>
                              <Link href={`/grievances/${g.id}`} className="hover:text-blue transition-colors">
                                {g.subject}
                              </Link>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <div className="text-text-primary truncate max-w-[140px] text-sm">{g.departments?.name}</div>
                            <div className="text-xs text-text-muted truncate max-w-[140px]">{g.categories?.name}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col items-start gap-1.5">
                              <StatusBadge status={g.status} />
                              {g.status !== 'RESOLVED' && g.status !== 'CLOSED' && g.status !== 'REJECTED' && (
                                <SlaBadge 
                                  sla={calculateSlaStatus(g as any, g.categories?.sla_rules?.[0])} 
                                  role="CITIZEN" 
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right text-text-muted text-xs hidden sm:table-cell">
                            {new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

