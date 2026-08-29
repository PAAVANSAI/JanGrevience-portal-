import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { calculateSlaStatus } from "@/lib/utils/sla";
import GrievanceTimeline from "@/components/ui/GrievanceTimeline";
import CommentThread from "@/components/ui/CommentThread";
import GrievanceRealtime from "@/components/ui/GrievanceRealtime";
import OfficerActions from "./OfficerActions";
import OfficerAppealActions from "./OfficerAppealActions";

export default async function OfficerGrievanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch Grievance
  // Since we have RLS, if the grievance isn't in their dept, it will return null/error
  const { data: grievance, error: grievanceError } = await supabase
    .from("grievances")
    .select(`
      *,
      departments (name),
      categories (name, sla_rules(target_days, reminder_threshold_percent))
    `)
    .eq("id", id)
    .single();

  if (grievanceError || !grievance) {
    console.error("Grievance fetch error:", grievanceError);
    notFound();
  }

  // Fetch Citizen Profile separately since the FK points to auth.users, not profiles directly
  const { data: citizenProfile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", grievance.citizen_id)
    .single();

  // Fetch Assignments for this grievance to see who owns it
  const { data: assignments } = await supabase
    .from("grievance_assignments")
    .select("officer_id")
    .eq("grievance_id", id);

  const isUnassigned = !assignments || assignments.length === 0;
  const isAssignedToMe = assignments?.some(a => a.officer_id === user.id) || false;

  // Fetch Comments
  const { data: comments } = await supabase
    .from("grievance_comments")
    .select(`
      *,
      profiles!grievance_comments_author_id_fkey (full_name)
    `)
    .eq("grievance_id", id)
    .order("created_at", { ascending: true });

  // Fetch Attachments
  const { data: attachments } = await supabase
    .from("grievance_attachments")
    .select("*")
    .eq("grievance_id", id)
    .order("uploaded_at", { ascending: true });

  // Generate signed URLs
  let attachmentsWithUrls = [];
  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map(a => a.file_path);
    // Note: ensure officer can access these files in storage policies (usually storage policies check auth.uid(), we may need to open storage policies to officers for Phase 6+ if they fail)
    const { data: urlData } = await supabase.storage
      .from("grievance_attachments")
      .createSignedUrls(filePaths, 3600);

    attachmentsWithUrls = attachments.map((a, index) => ({
      ...a,
      signedUrl: urlData?.[index]?.signedUrl || null,
    }));
  }

  // Fetch Status History
  const { data: history } = await supabase
    .from("grievance_status_history")
    .select("*")
    .eq("grievance_id", id)
    .order("created_at", { ascending: false });

  // Fetch Appeal
  const { data: appeal } = await supabase
    .from("appeals")
    .select("*")
    .eq("grievance_id", id)
    .maybeSingle();

  // Fetch Appeal Status History
  const { data: appealHistory } = await supabase
    .from("appeal_status_history")
    .select("*")
    .in("appeal_id", appeal ? [appeal.id] : [])
    .order("created_at", { ascending: false });

  // Merge histories
  const combinedHistory = [
    ...(history || []),
    ...(appealHistory || []),
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <GrievanceRealtime grievanceId={grievance.id} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link 
          href="/officer" 
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-blue transition-colors mb-6"
        >
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight font-mono">
                {grievance.grievance_number}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={grievance.status} className="px-3 py-1 text-sm" />
                {grievance.status !== 'RESOLVED' && grievance.status !== 'CLOSED' && grievance.status !== 'REJECTED' && (
                  <SlaBadge 
                    sla={calculateSlaStatus(grievance as any, grievance.categories?.sla_rules?.[0])} 
                    role="OFFICER" 
                  />
                )}
              </div>
            </div>
            <h2 className="text-lg font-medium text-text-primary">{grievance.subject}</h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
              <span>Filed on {new Date(grievance.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Citizen: {citizenProfile?.full_name || "Unknown"}</span>
              <span>•</span>
              <span>Ph: {citizenProfile?.phone || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Details & Attachments */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Description</h3>
              <p className="text-text-primary whitespace-pre-wrap text-sm leading-relaxed">
                {grievance.description}
              </p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Supporting Documents</h3>
              {attachmentsWithUrls.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attachmentsWithUrls.map((file) => (
                    <a
                      key={file.id}
                      href={file.signedUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-bg border border-border rounded-[var(--radius-md)] hover:border-blue/30 hover:bg-blue/5 transition-colors group"
                    >
                      <div className="text-text-muted group-hover:text-blue transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{file.file_name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic">No documents attached.</p>
              )}
            </div>

            {/* Comments Thread */}
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Discussion & Notes</h3>
              <CommentThread 
                grievanceId={grievance.id}
                currentStatus={grievance.status}
                comments={comments || []}
                userRole="OFFICER"
                canReply={isAssignedToMe && ["IN_PROGRESS", "ADDITIONAL_INFORMATION_REQUIRED", "ACTION_TAKEN"].includes(grievance.status)}
              />
            </div>
            
            {/* Appeal Context (If exists) */}
            {appeal && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Appeal {appeal.appeal_number}
                  </h3>
                  <StatusBadge status={appeal.status as any} className="px-3 py-1" />
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-red-100/50 space-y-3 text-sm mb-2">
                  <div>
                    <span className="font-semibold text-red-900 block mb-1">Reason for Appeal:</span>
                    <span className="text-red-800">{appeal.reason}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-red-900 block mb-1">Description:</span>
                    <span className="text-red-800 whitespace-pre-wrap">{appeal.description}</span>
                  </div>
                </div>

                <OfficerAppealActions 
                  appealId={appeal.id}
                  grievanceId={grievance.id}
                  currentStatus={appeal.status}
                  isAssignedToMe={isAssignedToMe}
                />
              </div>
            )}

            {/* Officer Action Panel */}
            <OfficerActions 
              grievanceId={grievance.id}
              currentStatus={grievance.status}
              isAssignedToMe={isAssignedToMe}
              isUnassigned={isUnassigned}
              userRole="OFFICER"
            />

          </div>

          {/* Right Column: Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm sticky top-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Status Timeline</h3>
              <GrievanceTimeline history={combinedHistory as any} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
