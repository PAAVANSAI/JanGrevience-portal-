import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the grievance to verify ownership and get the generated number
  const { data: grievance, error } = await supabase
    .from("grievances")
    .select("grievance_number, created_at")
    .eq("id", id)
    .eq("citizen_id", user.id)
    .single();

  if (error || !grievance) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
            <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">
            Grievance Submitted
          </h1>
          <p className="text-text-secondary text-sm mb-8">
            Your grievance has been successfully recorded. We will notify you when its status changes.
          </p>

          <div className="bg-surface border border-border p-6 rounded-xl shadow-sm mb-8">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Your Grievance ID
            </p>
            <div className="text-2xl font-mono font-bold text-navy tracking-tight bg-bg py-3 px-4 rounded-lg inline-block border border-border">
              {grievance.grievance_number}
            </div>
            <p className="text-xs text-text-muted mt-4">
              Submitted on {new Date(grievance.created_at).toLocaleDateString()}
            </p>
          </div>

          <Link
            href="/citizen"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover focus:ring-2 focus:ring-offset-2 focus:ring-blue shadow-sm hover:shadow-md transition-all duration-[var(--transition-fast)]"
          >
            Go to My Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
