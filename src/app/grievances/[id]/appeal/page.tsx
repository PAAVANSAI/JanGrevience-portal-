import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import ClientAppealForm from "./ClientAppealForm";

export default async function AppealPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Grievance
  const { data: grievance, error: grievanceError } = await supabase
    .from("grievances")
    .select("id, grievance_number, status, citizen_id")
    .eq("id", id)
    .single();

  if (grievanceError || !grievance || grievance.citizen_id !== user.id) {
    notFound();
  }

  // 2. Check Eligibility (Must be RESOLVED or REJECTED)
  if (grievance.status !== "RESOLVED" && grievance.status !== "REJECTED") {
    // If they already closed it, or it's still in progress, they can't appeal
    redirect(`/grievances/${id}`);
  }

  // 3. Check for existing appeal
  const { data: existingAppeal } = await supabase
    .from("appeals")
    .select("id, status")
    .eq("grievance_id", id)
    .maybeSingle();

  if (existingAppeal) {
    // Already appealed
    redirect(`/grievances/${id}`);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link 
          href={`/grievances/${id}`}
          className="inline-flex items-center text-sm font-medium text-text-muted hover:text-blue transition-colors mb-6"
        >
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Grievance {grievance.grievance_number}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight mb-3">
            File an Appeal
          </h1>
          <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
            If you are dissatisfied with the resolution of your grievance, you can file an appeal. 
            This will escalate the issue for further review by the department.
          </p>
        </div>

        <ClientAppealForm grievanceId={grievance.id} grievanceNumber={grievance.grievance_number} />
      </main>
    </div>
  );
}
