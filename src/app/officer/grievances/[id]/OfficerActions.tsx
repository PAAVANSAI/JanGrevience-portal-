"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GrievanceStatus } from "@/types/database";
import { getValidNextStatuses } from "@/lib/constants/workflow";
import AuthButton from "@/components/auth/AuthButton";
import { logAuditEvent } from "@/lib/audit";

interface OfficerActionsProps {
  grievanceId: string;
  currentStatus: GrievanceStatus;
  isAssignedToMe: boolean;
  isUnassigned: boolean;
  userRole?: string;
}

export default function OfficerActions({ grievanceId, currentStatus, isAssignedToMe, isUnassigned, userRole }: OfficerActionsProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<GrievanceStatus | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAssignToMe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: assignError } = await supabase
        .from("grievance_assignments")
        .insert({
          grievance_id: grievanceId,
          officer_id: user.id,
        });
      
      if (assignError) throw assignError;

      // Automatically move to ASSIGNED if current is SUBMITTED or ACKNOWLEDGED
      let newCurrentStatus = currentStatus;
      const validNext = getValidNextStatuses(currentStatus);
      if (validNext.includes("ASSIGNED") && currentStatus !== "ASSIGNED") {
        await supabase
          .from("grievances")
          .update({ status: "ASSIGNED" })
          .eq("id", grievanceId);
        newCurrentStatus = "ASSIGNED";
      }

      await logAuditEvent(supabase, {
        action_type: "ASSIGNED",
        resource_type: "grievance",
        resource_id: grievanceId,
        new_value: { assigned_to: user.id }
      });

      router.refresh();
    } catch (err: any) {
      console.error("Assign error details:", err);
      const errMsg = err.message || JSON.stringify(err);
      alert("Failed to assign: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: GrievanceStatus) => {
    // If it's a status that requires a note, open the inline form first
    if (["ADDITIONAL_INFORMATION_REQUIRED", "RESOLVED", "REJECTED"].includes(newStatus) && activeAction !== newStatus) {
      setActiveAction(newStatus);
      setActionNote("");
      return;
    }

    // Execute update
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Update Status
      const { error: updateError } = await supabase
        .from("grievances")
        .update({ status: newStatus })
        .eq("id", grievanceId);
      
      if (updateError) throw updateError;

      // 2. Insert Note if applicable
      if (activeAction && actionNote.trim()) {
        const { error: commentError } = await supabase
          .from("grievance_comments")
          .insert({
            grievance_id: grievanceId,
            author_id: user.id,
            author_role: "OFFICER", // Safely hardcoded for officer view; ideally fetch from context
            comment_text: actionNote.trim(),
            is_visible_to_citizen: true
          });
        if (commentError) console.error("Failed to post note:", commentError);
      }

      // 2.5 Upload Resolution Files if any
      if (activeAction === "RESOLVED" && resolutionFiles.length > 0) {
        for (const file of resolutionFiles) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("grievance_attachments")
            .upload(filePath, file);

          if (!uploadError) {
            await supabase.from("grievance_attachments").insert({
              grievance_id: grievanceId,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
              context: 'after'
            });
          }
        }
      }

      // 3. Log Audit Event
      await logAuditEvent(supabase, {
        action_type: "STATUS_CHANGED",
        resource_type: "grievance",
        resource_id: grievanceId,
        previous_value: { status: currentStatus },
        new_value: { status: newStatus }
      });

      setActiveAction(null);
      setActionNote("");
      setResolutionFiles([]);
      router.refresh();
    } catch (err: any) {
      console.error("Status update error details:", err);
      const errMsg = err.message || JSON.stringify(err);
      alert("Failed to update status: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Determine available action buttons based on Workflow Rules
  const validTransitions = getValidNextStatuses(currentStatus);

  const renderActionButtons = () => {
    return (
      <div className="flex flex-col gap-3">
        {validTransitions.includes("ACKNOWLEDGED") && (
          <AuthButton onClick={() => handleStatusUpdate("ACKNOWLEDGED")} loading={loading}>
            Mark as Acknowledged
          </AuthButton>
        )}

        {validTransitions.includes("ASSIGNED") && (
          <AuthButton onClick={() => handleStatusUpdate("ASSIGNED")} loading={loading}>
            Mark as Assigned (Ready for Work)
          </AuthButton>
        )}
        
        {validTransitions.includes("IN_PROGRESS") && (
          <AuthButton onClick={() => handleStatusUpdate("IN_PROGRESS")} loading={loading}>
            Start Work (In Progress)
          </AuthButton>
        )}



        {validTransitions.includes("ADDITIONAL_INFORMATION_REQUIRED") && (
          <button 
            onClick={() => handleStatusUpdate("ADDITIONAL_INFORMATION_REQUIRED")}
            disabled={loading}
            className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Request Information
          </button>
        )}

        {validTransitions.includes("RESOLVED") && (
          <button 
            onClick={() => handleStatusUpdate("RESOLVED")}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Resolve Grievance
          </button>
        )}



        {validTransitions.includes("CLOSED") && (
          <button 
            onClick={() => handleStatusUpdate("CLOSED")}
            disabled={loading}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors text-center disabled:opacity-50"
          >
            Close Grievance
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Officer Actions</h3>
      
      {isUnassigned && (
        <div>
          <p className="text-sm text-text-secondary mb-4">This grievance is currently unassigned in your department.</p>
          {userRole === "DEPT_ADMIN" ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                Please use the <strong>Assign Officer</strong> dropdown at the top of the page to assign this grievance to anyone in your department.
              </p>
            </div>
          ) : (
            <AuthButton onClick={handleAssignToMe} loading={loading} loadingText="Assigning...">
              Assign to Me
            </AuthButton>
          )}
        </div>
      )}

      {isAssignedToMe && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary mb-4">Update the status or request info:</p>
          
          {/* Active Action Form Overlay */}
          {activeAction ? (
            <div className="bg-bg border border-border p-4 rounded-xl mb-4">
              <h4 className="font-semibold text-text-primary mb-2">
                {activeAction === "ADDITIONAL_INFORMATION_REQUIRED" && "Request Information"}
                {activeAction === "RESOLVED" && "Resolution Note"}
                {activeAction === "REJECTED" && "Reason for Rejection"}
              </h4>
              <p className="text-xs text-text-muted mb-3">
                {activeAction === "ADDITIONAL_INFORMATION_REQUIRED" && "Explain what details you need from the citizen to proceed."}
                {activeAction === "RESOLVED" && "Provide details on how this issue was fixed. The citizen will see this."}
                {activeAction === "REJECTED" && "Explain why this grievance cannot be processed."}
              </p>
              
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={activeAction === "RESOLVED" ? "Describe the actions taken to fix the issue..." : "Explain why..."}
                rows={3}
                disabled={loading}
                className="w-full bg-bg border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-colors resize-none mb-4"
              />

              {activeAction === "RESOLVED" && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-text-primary mb-2">Resolution Proof (Optional but Recommended)</label>
                  <p className="text-xs text-text-muted mb-2">Upload a photo to show the issue has been resolved.</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setResolutionFiles([...resolutionFiles, ...Array.from(e.target.files)]);
                      }
                    }}
                    multiple
                  />
                  <div className="flex flex-wrap gap-2 mb-2">
                    {resolutionFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-lg text-xs">
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button type="button" onClick={() => setResolutionFiles(resolutionFiles.filter((_, idx) => idx !== i))} className="text-green-600 hover:text-green-800">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 bg-green-50/50 hover:bg-green-50 px-3 py-2 rounded-lg border border-green-100 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Attach Before/After Photos
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setActiveAction(null)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(activeAction)}
                  disabled={loading || !actionNote.trim()}
                  className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
                    activeAction === "RESOLVED" ? "bg-green-600 hover:bg-green-700" :
                    activeAction === "REJECTED" ? "bg-red-600 hover:bg-red-700" :
                    "bg-blue hover:bg-blue-hover"
                  }`}
                >
                  Confirm & Update
                </button>
              </div>
            </div>
          ) : (
            renderActionButtons()
          )}

          {validTransitions.length === 0 && (
            <p className="text-xs text-text-muted italic bg-gray-50 p-3 rounded border border-gray-100">
              No further actions available for this grievance.
            </p>
          )}
        </div>
      )}

      {!isUnassigned && !isAssignedToMe && (
        <p className="text-sm text-text-muted italic">This case is assigned to another officer.</p>
      )}
    </div>
  );
}
