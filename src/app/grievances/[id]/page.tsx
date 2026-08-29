import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import GrievanceDetailView from "@/components/grievance/GrievanceDetailView";
import GrievanceRealtime from "@/components/ui/GrievanceRealtime";

export default async function GrievanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Grievance with relationships
  const { data: grievance, error: grievanceError } = await supabase
    .from("grievances")
    .select(`
      *,
      departments (name),
      categories (name, sla_rules(target_days, reminder_threshold_percent))
    `)
    .eq("id", id)
    .eq("citizen_id", user.id)
    .single();

  if (grievanceError || !grievance) {
    // If it doesn't exist or doesn't belong to the user, show 404
    notFound();
  }

  // Fetch Attachments
  const { data: attachments } = await supabase
    .from("grievance_attachments")
    .select("*")
    .eq("grievance_id", id)
    .order("uploaded_at", { ascending: true });

  // Fetch Status History
  const { data: history } = await supabase
    .from("grievance_status_history")
    .select("*")
    .eq("grievance_id", id)
    .order("created_at", { ascending: false });

  // Fetch Comments
  const { data: comments } = await supabase
    .from("grievance_comments")
    .select(`
      *,
      profiles!grievance_comments_author_id_fkey (full_name)
    `)
    .eq("grievance_id", id)
    .eq("is_visible_to_citizen", true)
    .order("created_at", { ascending: true });

  // Generate signed URLs for attachments
  let attachmentsWithUrls = [];
  if (attachments && attachments.length > 0) {
    const filePaths = attachments.map(a => a.file_path);
    const { data: urlData } = await supabase.storage
      .from("grievance_attachments")
      .createSignedUrls(filePaths, 3600); // 1 hour expiry

    attachmentsWithUrls = attachments.map((a, index) => ({
      ...a,
      signedUrl: urlData?.[index]?.signedUrl || null,
    }));
  }

  // Fetch Feedback
  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .eq("grievance_id", id)
    .maybeSingle();

  const hasFeedback = !!feedback;

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

  // Fetch System Settings for Appeals
  const { data: settingsData } = await supabase.from("system_settings").select("*").in("key", ["allow_appeals", "appeal_deadline_days"]);
  let allowAppeals = true;
  let appealDeadlineDays = 15;
  if (settingsData) {
    const allowSetting = settingsData.find((s: any) => s.key === "allow_appeals");
    const deadlineSetting = settingsData.find((s: any) => s.key === "appeal_deadline_days");
    if (allowSetting && (allowSetting.value === "false" || allowSetting.value === false)) {
      allowAppeals = false;
    }
    if (deadlineSetting && deadlineSetting.value) {
      appealDeadlineDays = Number(deadlineSetting.value);
    }
  }

  // Calculate if deadline passed based on RESOLVED/CLOSED status history
  let appealDeadlinePassed = false;
  if (grievance.status === "RESOLVED" || grievance.status === "CLOSED") {
    const resolvedEvent = history?.find((h: any) => h.status === "RESOLVED");
    if (resolvedEvent) {
      const resolvedDate = new Date(resolvedEvent.created_at);
      const deadlineDate = new Date(resolvedDate);
      deadlineDate.setDate(deadlineDate.getDate() + appealDeadlineDays);
      if (new Date() > deadlineDate) {
        appealDeadlinePassed = true;
      }
    }
  }

  const canAppeal = allowAppeals && !appealDeadlinePassed;

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <GrievanceRealtime grievanceId={grievance.id} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 -mb-8">
        {/* Back Link */}
        <Link 
          href="/citizen" 
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-blue transition-colors mb-2"
        >
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </Link>
      </main>

      <GrievanceDetailView 
        grievance={grievance}
        attachmentsWithUrls={attachmentsWithUrls}
        combinedHistory={combinedHistory}
        comments={comments || []}
        appeal={appeal}
        hasFeedback={hasFeedback}
        isGuest={false}
        canAppeal={canAppeal}
      />
    </div>
  );
}
