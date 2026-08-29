"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ResolutionConfirmationProps {
  grievanceId: string;
  disputeCount: number;
}

export default function ResolutionConfirmation({ grievanceId, disputeCount }: ResolutionConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleConfirm = async (isFixed: boolean) => {
    if (!isFixed && !showReasonInput) {
      setShowReasonInput(true);
      return;
    }

    if (!isFixed && !reason.trim()) {
      setError("Please briefly explain what is still wrong.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let newStatus = "CLOSED";
      let isConfirmed = true;
      let nextDisputeCount = disputeCount;

      if (!isFixed) {
        isConfirmed = false;
        nextDisputeCount = disputeCount + 1;
        // Escalation threshold: if it's the 2nd dispute, escalate.
        newStatus = nextDisputeCount >= 2 ? "ESCALATED" : "REOPENED";
      }

      // Update Grievance
      const { error: updateError } = await supabase
        .from("grievances")
        .update({
          status: newStatus,
          resolution_confirmed: isConfirmed,
          resolution_dispute_count: nextDisputeCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", grievanceId);

      if (updateError) throw updateError;

      // Add status history
      await supabase.from("grievance_status_history").insert({
        grievance_id: grievanceId,
        status: newStatus,
      });

      // If there's a reason (reopened/escalated), add a comment
      if (!isFixed && reason.trim()) {
        await supabase.from("grievance_comments").insert({
          grievance_id: grievanceId,
          author_id: user.id,
          author_role: "CITIZEN",
          comment_text: `[Citizen Disputed Resolution]: ${reason}`,
          is_visible_to_citizen: true,
        });
      }

      router.refresh();
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Has this issue actually been fixed?
          </h3>
          <p className="text-green-800/80 text-sm max-w-lg">
            Your grievance has been marked as resolved by the assigned officer. Please confirm if the issue is completely fixed, or let us know if it persists.
          </p>
        </div>

        {!showReasonInput && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleConfirm(true)}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              Yes, it's resolved
            </button>
            <button
              onClick={() => handleConfirm(false)}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              No, issue persists
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReasonInput && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/60 rounded-xl p-4 sm:p-5 border border-red-100">
              <label className="block text-sm font-semibold text-red-900 mb-2">
                Tell us what's still wrong
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why this issue is not resolved..."
                className="w-full bg-white border border-red-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none mb-3"
                rows={3}
                disabled={loading}
              />
              
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setReason("");
                    setError("");
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Submit Dispute
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
