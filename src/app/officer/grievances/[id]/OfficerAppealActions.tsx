"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppealStatus } from "@/types/database";
import { logAuditEvent } from "@/lib/audit";

interface OfficerAppealActionsProps {
  appealId: string;
  grievanceId: string;
  currentStatus: AppealStatus;
  isAssignedToMe: boolean;
}

export default function OfficerAppealActions({ appealId, grievanceId, currentStatus, isAssignedToMe }: OfficerAppealActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleStatusUpdate = async (newStatus: AppealStatus) => {
    setLoading(true);
    try {
      // 1. Update Appeal Status
      const { error: updateError } = await supabase
        .from("appeals")
        .update({ status: newStatus })
        .eq("id", appealId);
      
      if (updateError) throw updateError;

      // If closed, we might want to also ensure the grievance is closed
      if (newStatus === "CLOSED") {
        await supabase.from("grievances").update({ status: "CLOSED" }).eq("id", grievanceId);
      }

      await logAuditEvent(supabase, {
        action_type: "APPEAL_DECISION",
        resource_type: "appeal",
        resource_id: appealId,
        previous_value: { status: currentStatus },
        new_value: { status: newStatus }
      });

      router.refresh();
    } catch (err: any) {
      console.error("Status update error details:", err);
      alert("Failed to update appeal status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAssignedToMe) return null;

  return (
    <div className="mt-6 pt-6 border-t border-red-200/50">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Appeal Actions</h4>
      <div className="flex flex-col gap-3">
        {currentStatus === "APPEAL_SUBMITTED" && (
          <button 
            onClick={() => handleStatusUpdate("UNDER_REVIEW")} 
            disabled={loading}
            className="bg-blue text-white hover:bg-blue-hover px-4 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Mark as Under Review
          </button>
        )}

        {currentStatus === "UNDER_REVIEW" && (
          <button 
            onClick={() => handleStatusUpdate("DECISION_MADE")} 
            disabled={loading}
            className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Record Decision Made
          </button>
        )}

        {currentStatus === "DECISION_MADE" && (
          <button 
            onClick={() => handleStatusUpdate("CLOSED")} 
            disabled={loading}
            className="bg-gray-800 text-white hover:bg-gray-900 px-4 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Close Appeal & Grievance
          </button>
        )}
      </div>
    </div>
  );
}
