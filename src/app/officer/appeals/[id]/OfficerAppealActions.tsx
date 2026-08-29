"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Appeal } from "@/types/database";
import AuthButton from "@/components/auth/AuthButton";

interface OfficerAppealActionsProps {
  appeal: Appeal;
}

export default function OfficerAppealActions({ appeal }: OfficerAppealActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For decision making
  const [isMakingDecision, setIsMakingDecision] = useState(false);
  const [decisionOutcome, setDecisionOutcome] = useState<"UPHELD" | "OVERTURNED" | "">("");
  const [decisionNotes, setDecisionNotes] = useState("");

  const handleStartReview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: updateError } = await supabase
        .from("appeals")
        .update({ status: "UNDER_REVIEW" })
        .eq("id", appeal.id);
        
      if (updateError) throw updateError;
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to start review");
      setLoading(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionOutcome || !decisionNotes.trim()) {
      setError("Outcome and explanation notes are required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Move to DECISION_MADE
      const { error: updateError } = await supabase
        .from("appeals")
        .update({ 
          status: "DECISION_MADE",
          decision_outcome: decisionOutcome,
          decision_notes: decisionNotes.trim(),
          reviewed_by: user.id
        })
        .eq("id", appeal.id);
        
      if (updateError) throw updateError;

      // 2. Immediately close the appeal as DECISION_MADE is a transient state leading to CLOSED
      await supabase
        .from("appeals")
        .update({ status: "CLOSED" })
        .eq("id", appeal.id);

      // If Overturned, we reopen the original grievance to IN_PROGRESS
      if (decisionOutcome === "OVERTURNED") {
        await supabase
          .from("grievances")
          .update({ status: "IN_PROGRESS" })
          .eq("id", appeal.grievance_id);
      }

      setIsMakingDecision(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit decision");
      setLoading(false);
    }
  };

  if (appeal.status === "DECISION_MADE" || appeal.status === "CLOSED") {
    return null; // Actions no longer available once closed
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-border bg-bg/50">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Appeal Actions</h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-[var(--radius-md)] text-sm border border-red-200">
            {error}
          </div>
        )}

        {appeal.status === "APPEAL_SUBMITTED" && (
          <div>
            <p className="text-sm text-text-secondary mb-4">This appeal is currently unassigned. Claim it to begin your review.</p>
            <AuthButton onClick={handleStartReview} loading={loading} className="w-full">
              Start Reviewing Appeal
            </AuthButton>
          </div>
        )}

        {appeal.status === "UNDER_REVIEW" && !isMakingDecision && (
          <div>
            <p className="text-sm text-text-secondary mb-4">You are currently reviewing this appeal. Once you have reached a conclusion, record your decision.</p>
            <AuthButton onClick={() => setIsMakingDecision(true)} type="button" className="w-full">
              Record Final Decision
            </AuthButton>
          </div>
        )}

        {appeal.status === "UNDER_REVIEW" && isMakingDecision && (
          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Decision Outcome *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionOutcome("UPHELD")}
                  className={`p-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors text-left flex items-start gap-2 ${decisionOutcome === "UPHELD" ? "bg-red-50 border-red-200 text-red-900 ring-1 ring-red-500" : "bg-surface border-border text-text-primary hover:bg-bg"}`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${decisionOutcome === "UPHELD" ? "border-red-500" : "border-gray-300"}`}>
                    {decisionOutcome === "UPHELD" && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                  </div>
                  <div>
                    <div className="font-bold">Uphold Original</div>
                    <div className="text-xs font-normal opacity-80">The grievance resolution was correct.</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDecisionOutcome("OVERTURNED")}
                  className={`p-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors text-left flex items-start gap-2 ${decisionOutcome === "OVERTURNED" ? "bg-green-50 border-green-200 text-green-900 ring-1 ring-green-500" : "bg-surface border-border text-text-primary hover:bg-bg"}`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${decisionOutcome === "OVERTURNED" ? "border-green-500" : "border-gray-300"}`}>
                    {decisionOutcome === "OVERTURNED" && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                  <div>
                    <div className="font-bold">Overturn</div>
                    <div className="text-xs font-normal opacity-80">Reopen the original grievance.</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Explanation Notes *</label>
              <p className="text-xs text-text-secondary mb-2">This will be visible to the citizen.</p>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-blue bg-surface text-text-primary resize-y"
                placeholder="Explain the reasoning behind your decision..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMakingDecision(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-md)] hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <AuthButton loading={loading} type="submit" className="flex-1">
                Confirm Decision
              </AuthButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
