import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default async function OfficerAppealsQueuePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
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

  if (!profile || !["OFFICER", "DEPARTMENT_ADMIN", "SUPER_ADMIN"].includes(profile.role)) {
    redirect("/"); 
  }

  if (!profile.department_id) {
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

  // Fetch all appeals in this department (using inner join on grievances)
  // We fetch all to get accurate counts for the summary cards
  const { data: allAppeals } = await supabase
    .from("appeals")
    .select(`
      id,
      appeal_number,
      reason,
      status,
      created_at,
      grievances!inner (id, grievance_number, department_id)
    `)
    .eq("grievances.department_id", profile.department_id)
    .order("created_at", { ascending: false });

  const total = allAppeals?.length || 0;
  const submitted = allAppeals?.filter((a) => a.status === "APPEAL_SUBMITTED").length || 0;
  const underReview = allAppeals?.filter((a) => a.status === "UNDER_REVIEW").length || 0;
  const decided = allAppeals?.filter((a) => a.status === "DECISION_MADE" || a.status === "CLOSED").length || 0;

  // Filter for display
  let filteredAppeals = allAppeals || [];
  if (filter === "submitted") {
    filteredAppeals = filteredAppeals.filter(a => a.status === "APPEAL_SUBMITTED");
  } else if (filter === "under_review") {
    filteredAppeals = filteredAppeals.filter(a => a.status === "UNDER_REVIEW");
  } else if (filter === "decided") {
    filteredAppeals = filteredAppeals.filter(a => a.status === "DECISION_MADE" || a.status === "CLOSED");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/officer" className="text-sm font-medium text-text-muted hover:text-blue transition-colors">
                Dashboard
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-sm font-medium text-text-primary">Appeals Queue</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Appeals Queue</h1>
            <p className="text-sm text-text-secondary mt-1">Manage escalated appeals for your department</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Appeals", count: total, color: "text-text-primary", filterVal: "all" },
            { label: "New (Submitted)", count: submitted, color: "text-red-700", filterVal: "submitted" },
            { label: "Under Review", count: underReview, color: "text-purple-700", filterVal: "under_review" },
            { label: "Decided", count: decided, color: "text-green-700", filterVal: "decided" },
          ].map((stat, idx) => {
            const isActive = filter === stat.filterVal;
            return (
              <Link 
                key={idx} 
                href={`/officer/appeals?filter=${stat.filterVal}`}
                className={`bg-surface border rounded-xl p-5 shadow-sm flex flex-col justify-center transition-all ${isActive ? 'border-blue ring-1 ring-blue' : 'border-border hover:border-text-muted'}`}
              >
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {stat.label}
                </span>
                <div className={`text-3xl font-bold tracking-tight ${stat.color}`}>
                  <AnimatedCounter value={stat.count} />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Appeals List */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          {(!filteredAppeals || filteredAppeals.length === 0) ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 text-text-muted mb-4">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">No appeals found</h3>
              <p className="text-sm text-text-secondary">There are no appeals matching this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Appeal ID</th>
                    <th className="px-6 py-4">Original Grievance</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right hidden sm:table-cell">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAppeals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-bg/50 transition-colors group cursor-pointer relative">
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link href={`/officer/appeals/${a.id}`} className="absolute inset-0 z-0">
                          <span className="sr-only">View Appeal {a.appeal_number}</span>
                        </Link>
                        <span className="text-blue group-hover:text-blue-hover relative z-10">{a.appeal_number}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-text-secondary">
                        {a.grievances?.grievance_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary max-w-[200px] truncate" title={a.reason}>
                          {a.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-text-secondary hidden sm:table-cell">
                        {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
