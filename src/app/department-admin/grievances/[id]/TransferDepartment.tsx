"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit";
import PopupSelect from "@/components/ui/PopupSelect";

interface TransferDepartmentProps {
  grievanceId: string;
  currentDepartmentId: string;
  grievanceNumber?: string;
  grievanceSubject?: string;
}

export default function TransferDepartment({ grievanceId, currentDepartmentId, grievanceNumber, grievanceSubject }: TransferDepartmentProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase
        .from("departments")
        .select("id, name, description")
        .neq("id", currentDepartmentId)
        .order("name");
      if (data) setDepartments(data);
    }
    loadDepts();
  }, [currentDepartmentId, supabase]);

  const handleTransfer = async () => {
    if (!selectedDept) return;
    setTransferring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newDeptName = departments.find(d => d.id === selectedDept)?.name || "another department";

      // 0. Add an internal note before transferring (so it's marked in history)
      await supabase
        .from("internal_notes")
        .insert({
          grievance_id: grievanceId,
          author_id: user?.id,
          note: `Issue transferred to ${newDeptName}.`
        });

      // 1. Unassign any existing officer
      await supabase
        .from("grievance_assignments")
        .delete()
        .eq("grievance_id", grievanceId);

      // 2. Change department and reset status to SUBMITTED if it was ASSIGNED/IN_PROGRESS
      const { data: g } = await supabase.from("grievances").select("status").eq("id", grievanceId).single();
      let newStatus = g?.status;
      if (g && ["ASSIGNED", "IN_PROGRESS"].includes(g.status)) {
        newStatus = "SUBMITTED";
      }

      await supabase
        .from("grievances")
        .update({ 
          department_id: selectedDept,
          status: newStatus
        })
        .eq("id", grievanceId);

      // 3. Log Audit
      await logAuditEvent(supabase, {
        action_type: "REASSIGNED",
        resource_type: "grievance",
        resource_id: grievanceId,
        previous_value: { department_id: currentDepartmentId },
        new_value: { department_id: selectedDept, transferred_by: user?.id }
      });

      setShowConfirmModal(false);
      setIsOpen(false);
      alert("Grievance successfully transferred.");
      router.push("/department-admin/grievances");
      
    } catch (err: any) {
      alert("Error transferring department: " + err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <>
      <div className="relative mt-4">
        {!isOpen ? (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between p-3 bg-surface border border-border rounded-xl hover:bg-surface-2 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary group-hover:text-blue transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3l4 4-4 4"></path>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <path d="M7 21l-4-4 4-4"></path>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Misrouted?</p>
                <p className="text-sm font-semibold text-text-primary">Transfer Department</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        ) : (
          <div className="p-4 bg-surface border border-border rounded-xl shadow-sm animate-fade-in-up">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Select New Department</h4>
            <div className="space-y-3">
              <PopupSelect
                options={departments.map(d => ({ value: d.id, label: d.name, description: d.description }))}
                value={selectedDept}
                onChange={setSelectedDept}
                placeholder="Choose a department..."
                disabled={transferring}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={transferring}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={transferring || !selectedDept}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue text-white rounded-md hover:bg-blue-hover transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-text-primary">Confirm Transfer</h3>
              <p className="text-sm text-text-secondary mt-1">Please review the details before transferring.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-bg p-4 rounded-xl border border-border space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Grievance</span>
                  <span className="text-sm font-medium text-text-primary mt-1">{grievanceNumber} - {grievanceSubject}</span>
                </div>
                <div className="h-px bg-border my-2"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">Transferring To</span>
                  <span className="text-sm font-bold text-blue mt-1">
                    {departments.find(d => d.id === selectedDept)?.name}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p className="text-xs font-medium leading-relaxed">
                  Warning: Once transferred, this grievance will be completely removed from your department's view. You will no longer be able to access it.
                </p>
              </div>
            </div>
            <div className="p-6 bg-bg border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={transferring}
                className="px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-2 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring}
                className="px-5 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                {transferring ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeLinecap="round" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                    Transferring...
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
