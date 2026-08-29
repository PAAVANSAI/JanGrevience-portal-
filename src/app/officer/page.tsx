import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { calculateSlaStatus } from "@/lib/utils/sla";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default async function OfficerDashboard({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const resolvedParams = await searchParams;
  const filter = resolvedParams.filter || "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile to verify role and department
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["OFFICER", "DEPT_ADMIN", "SUPER_ADMIN"].includes(profile.role)) {
    redirect("/"); // Not an officer
  }

  if (!profile.department_id) {
    // If officer isn't assigned a department yet, show a polite error
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-8 rounded-2xl text-center max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-2">No Department Assigned</h2>
            <p className="text-sm text-text-secondary">Your account has officer privileges, but you haven't been assigned to a department yet. Please contact an administrator.</p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch ONLY grievances assigned to this officer
  let query = supabase
    .from("grievances")
    .select(`
      id,
      grievance_number,
      subject,
      status,
      due_date,
      created_at,
      escalation_level,
      categories (name, sla_rules(target_days, reminder_threshold_percent)),
      grievance_assignments!inner (officer_id)
    `)
    .eq("grievance_assignments.officer_id", user.id)
    .order("created_at", { ascending: false });

  const { data: allGrievances } = await query;
  const grievancesList = allGrievances || [];

  // Compute stats
  let inProgress = 0;
  let urgentCount = 0;
  let escalatedCount = 0;

  grievancesList.forEach((g: any) => {
    if (g.status === "IN_PROGRESS") inProgress++;
    if (g.status !== 'RESOLVED' && g.status !== 'CLOSED' && g.status !== 'REJECTED') {
      if (g.due_date) urgentCount++;
      if (g.escalation_level > 0) escalatedCount++;
    }
  });

  let displayGrievances = grievancesList;
  if (filter === "urgent") {
    displayGrievances = grievancesList
      .filter((g: any) => g.status !== 'RESOLVED' && g.status !== 'CLOSED' && g.status !== 'REJECTED' && g.due_date)
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  } else if (filter === "escalated") {
    displayGrievances = grievancesList.filter((g: any) => g.escalation_level > 0 && g.status !== 'RESOLVED' && g.status !== 'CLOSED' && g.status !== 'REJECTED');
  } else if (filter === "in_progress") {
    displayGrievances = grievancesList.filter((g: any) => g.status === 'IN_PROGRESS');
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Welcome back, <span className="gradient-text">{profile.full_name?.split(' ')[0] || "Officer"}</span> 👋
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Officer Dashboard &bull; {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <Link href="/officer?filter=all" className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover stat-card-blue transition-all ${filter === 'all' ? 'ring-2 ring-blue/20 bg-blue/5' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">My Grievances</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue bg-blue/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              <AnimatedCounter value={grievancesList.length} />
            </div>
          </Link>
          <Link href="/officer?filter=in_progress" className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover stat-card-amber transition-all ${filter === 'in_progress' ? 'ring-2 ring-amber-500/20 bg-amber-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">In Progress</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-warning bg-warning-bg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-text-primary">
              <AnimatedCounter value={inProgress} />
            </div>
          </Link>
          <Link href="/officer?filter=urgent" className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover stat-card-orange transition-all ${filter === 'urgent' ? 'ring-2 ring-orange-500/20 bg-orange-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Urgent</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-600 bg-orange-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-orange-600">
              <AnimatedCounter value={urgentCount} />
            </div>
          </Link>
          <Link href="/officer?filter=escalated" className={`bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 card-hover stat-card-purple transition-all ${filter === 'escalated' ? 'ring-2 ring-rose-500/20 bg-rose-50' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Escalated</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-error bg-error-bg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-error">
              <AnimatedCounter value={escalatedCount} />
            </div>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 animate-fade-in-up">
          <h2 className="text-lg font-bold text-text-primary">
            {filter === "in_progress" ? "In Progress" : filter === "urgent" ? "Urgent Grievances" : filter === "escalated" ? "Escalated Grievances" : "My Assigned Grievances"}
          </h2>
          <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link href="/officer?filter=all" className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${filter === 'all' ? 'bg-blue text-white shadow-sm' : 'bg-surface text-text-secondary hover:bg-surface-2 border border-border'}`}>All</Link>
            <Link href="/officer?filter=in_progress" className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${filter === 'in_progress' ? 'bg-blue text-white shadow-sm' : 'bg-surface text-text-secondary hover:bg-surface-2 border border-border'}`}>In Progress</Link>
            <Link href="/officer?filter=urgent" className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${filter === 'urgent' ? 'bg-orange-500 text-white shadow-sm' : 'bg-surface text-text-secondary hover:bg-surface-2 border border-border'}`}>
              Urgent
            </Link>
            <Link href="/officer?filter=escalated" className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${filter === 'escalated' ? 'bg-rose-600 text-white shadow-sm' : 'bg-surface text-text-secondary hover:bg-surface-2 border border-border'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Escalated
            </Link>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Grievance ID</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                      No grievances found for this filter.
                    </td>
                  </tr>
                ) : (
                  displayGrievances.map((g: any) => {
                    const isUnassigned = !g.grievance_assignments || g.grievance_assignments.length === 0;
                    
                    return (
                      <tr key={g.id} className="hover:bg-bg/50 transition-colors group">
                        <td className="px-6 py-4 font-mono font-medium">
                          <Link href={`/officer/grievances/${g.id}`} className="text-blue hover:underline group-hover:text-blue-hover">
                            {g.grievance_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-primary max-w-[150px] sm:max-w-[250px] truncate" title={g.subject}>
                            <Link href={`/officer/grievances/${g.id}`} className="hover:text-blue transition-colors">
                              {g.subject}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="text-text-primary truncate max-w-[150px]">{g.categories?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <StatusBadge status={g.status} />
                            {g.escalation_level > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase tracking-wider">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                L{g.escalation_level} Escalated
                              </span>
                            )}
                            {g.status !== 'RESOLVED' && g.status !== 'CLOSED' && g.status !== 'REJECTED' && (
                              <SlaBadge 
                                sla={calculateSlaStatus(g as any, g.categories?.sla_rules?.[0])} 
                                role="OFFICER" 
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-text-secondary hidden sm:table-cell">
                          {new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isUnassigned ? (
                            <Link 
                              href={`/officer/grievances/${g.id}`}
                              className="text-xs font-semibold text-blue bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              Assign
                            </Link>
                          ) : (
                            <Link 
                              href={`/officer/grievances/${g.id}`}
                              className="text-xs font-medium text-text-secondary hover:text-blue transition-colors"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
