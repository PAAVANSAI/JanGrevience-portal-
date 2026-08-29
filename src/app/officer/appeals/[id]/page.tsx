import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import GrievanceTimeline from "@/components/ui/GrievanceTimeline";
import OfficerAppealActions from "./OfficerAppealActions";

export default async function OfficerAppealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile for role/dept check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["OFFICER", "DEPARTMENT_ADMIN", "SUPER_ADMIN"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch Appeal with relationships
  const { data: appeal, error: appealError } = await supabase
    .from("appeals")
    .select(`
      *,
      grievances!inner (
        id, 
        grievance_number, 
        subject, 
        status, 
        department_id,
        created_at,
        citizen_id,
        departments (name),
        categories (name)
      )
    `)
    .eq("id", id)
    .single();

  if (appealError || !appeal) {
    notFound();
  }

  const g = appeal.grievances as any;

  // Enforce department access
  if (profile.role !== "SUPER_ADMIN" && profile.department_id !== g.department_id) {
    notFound();
  }

  // Fetch Citizen Profile
  const { data: citizenProfile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", g.citizen_id)
    .single();

  // Fetch Appeal Status History
  const { data: history } = await supabase
    .from("appeal_status_history")
    .select("*")
    .eq("appeal_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Back Link */}
        <Link 
          href="/officer/appeals" 
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-blue transition-colors mb-6"
        >
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Appeals Queue
        </Link>

        {/* Header */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight font-mono flex items-center gap-2">
                <svg width="24" height="24" className="text-purple-600 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                {appeal.appeal_number}
              </h1>
              <StatusBadge status={appeal.status as any} className="px-3 py-1 text-sm" />
            </div>
            <h2 className="text-lg font-medium text-text-primary">Appeal against {g.grievance_number}</h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
              <span>Submitted on {new Date(appeal.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Citizen: {citizenProfile?.full_name || "Unknown"}</span>
              <span>•</span>
              <span>Ph: {citizenProfile?.phone || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Appeal Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Appeal Details Card */}
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-bg/50">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Appeal Details</h3>
              </div>
              <div className="p-6 sm:p-8">
                <h4 className="text-lg font-bold text-navy mb-4">{appeal.reason}</h4>
                <div className="prose prose-sm sm:prose-base max-w-none text-text-primary leading-relaxed whitespace-pre-wrap">
                  {appeal.description}
                </div>
              </div>
            </div>

            {/* Compact Reference Card for Original Grievance */}
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-bg/50">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Original Grievance Context</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <Link href={`/officer/grievances/${g.id}`} className="text-lg font-bold text-blue hover:underline mb-1 inline-block">
                      {g.grievance_number}
                    </Link>
                    <p className="font-medium text-text-primary">{g.subject}</p>
                    <div className="text-sm text-text-muted mt-2 space-y-1">
                      <p>Category: <span className="font-medium text-text-secondary">{g.categories?.name}</span></p>
                    </div>
                  </div>
                  <StatusBadge status={g.status as any} />
                </div>
              </div>
            </div>
            
            {/* Decision Outcome Card (If DECISION_MADE or CLOSED) */}
            {(appeal.status === 'DECISION_MADE' || appeal.status === 'CLOSED') && (
              <div className={`border rounded-2xl shadow-sm overflow-hidden ${appeal.decision_outcome === 'UPHELD' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className={`px-6 py-4 border-b ${appeal.decision_outcome === 'UPHELD' ? 'border-red-200 bg-red-100/50' : 'border-green-200 bg-green-100/50'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${appeal.decision_outcome === 'UPHELD' ? 'text-red-900' : 'text-green-900'}`}>
                    Decision Recorded
                  </h3>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    {appeal.decision_outcome === 'UPHELD' ? (
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg text-text-primary">
                        {appeal.decision_outcome === 'UPHELD' ? 'Original Decision Upheld' : 'Appeal Overturned (Grievance Reopened)'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 border border-black/5">
                    <span className="font-semibold text-text-primary block mb-2">Reviewer Notes:</span>
                    <span className="text-text-secondary whitespace-pre-wrap">{appeal.decision_notes}</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Actions & Status Timeline */}
          <div className="lg:col-span-1 space-y-6">
            <OfficerAppealActions appeal={appeal as any} />
            
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-6">
                Appeal Timeline
              </h3>
              <GrievanceTimeline history={history || []} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
