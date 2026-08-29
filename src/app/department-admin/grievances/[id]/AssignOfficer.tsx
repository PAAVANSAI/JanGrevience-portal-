"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit";
import PopupSelect from "@/components/ui/PopupSelect";

interface AssignOfficerProps {
  grievanceId: string;
  departmentId: string;
  currentOfficerId?: string | null;
}

export default function AssignOfficer({ grievanceId, departmentId, currentOfficerId }: AssignOfficerProps) {
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>(currentOfficerId || "");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchOfficers() {
      if (!departmentId) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("department_id", departmentId)
          .in("role", ["OFFICER", "DEPT_ADMIN"])
          .order("full_name");
        
        if (error) throw error;
        if (data) setOfficers(data);
      } catch (err) {
        console.error("Failed to load officers", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOfficers();
  }, [departmentId, supabase]);

  const handleAssign = async () => {
    if (!selectedOfficer) return;
    setAssigning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (selectedOfficer === "UNASSIGNED") {
        if (currentOfficerId) {
          await supabase
            .from("grievance_assignments")
            .delete()
            .eq("grievance_id", grievanceId);
            
          const { data: g } = await supabase.from("grievances").select("status").eq("id", grievanceId).single();
          if (g && g.status === "ASSIGNED") {
            await supabase.from("grievances").update({ status: "SUBMITTED" }).eq("id", grievanceId);
          }

          await logAuditEvent(supabase, {
            action_type: "UNASSIGNED" as any,
            resource_type: "grievance",
            resource_id: grievanceId,
            previous_value: { assigned_to: currentOfficerId },
            new_value: { assigned_to: null, unassigned_by: user.id }
          });
        }
      } else {
        // We handle reassignment by deleting existing assignments and inserting a new one
        // We handle reassignment by unconditionally deleting existing assignments and inserting a new one
        await supabase
          .from("grievance_assignments")
          .delete()
          .eq("grievance_id", grievanceId);

        const { error: assignError } = await supabase
          .from("grievance_assignments")
          .insert({
            grievance_id: grievanceId,
            officer_id: selectedOfficer,
            assigned_by: user.id
          });

        if (assignError) throw assignError;

        // Update grievance status to ASSIGNED if it's currently SUBMITTED or ACKNOWLEDGED
        const { data: g } = await supabase.from("grievances").select("status").eq("id", grievanceId).single();
        if (g && (g.status === "SUBMITTED" || g.status === "ACKNOWLEDGED")) {
          await supabase.from("grievances").update({ status: "ASSIGNED" }).eq("id", grievanceId);
        }

        await logAuditEvent(supabase, {
          action_type: currentOfficerId ? "REASSIGNED" : "ASSIGNED",
          resource_type: "grievance",
          resource_id: grievanceId,
          previous_value: currentOfficerId ? { assigned_to: currentOfficerId } : null,
          new_value: { assigned_to: selectedOfficer, assigned_by: user.id }
        });
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Assignment failed:", err);
      alert("Failed to assign officer: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const currentOfficerName = officers.find(o => o.id === currentOfficerId)?.full_name || "Unassigned";

  if (loading) {
    return <div className="h-10 w-full bg-surface-2 animate-pulse rounded-lg"></div>;
  }

  return (
    <div className="relative">
      {!isOpen ? (
        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentOfficerId ? "bg-blue/10 text-blue" : "bg-amber-100 text-amber-700"
            }`}>
              {currentOfficerId ? currentOfficerName.charAt(0).toUpperCase() : "!"}
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Assigned Officer</p>
              <p className={`text-sm font-semibold ${currentOfficerId ? "text-text-primary" : "text-amber-700"}`}>
                {currentOfficerId ? currentOfficerName : "Needs Assignment"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-blue hover:text-blue-hover hover:bg-blue/5 rounded-md transition-colors border border-transparent hover:border-blue/20"
          >
            {currentOfficerId ? "Reassign" : "Assign"}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-surface border border-blue/30 rounded-xl shadow-sm animate-fade-in-up">
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Select Officer
          </h4>
          <div className="space-y-3">
            <PopupSelect
              options={[
                ...(currentOfficerId ? [{ value: "UNASSIGNED", label: "-- Unassign Officer --" }] : []),
                ...officers.map(o => ({ value: o.id, label: `${o.full_name} (${o.role})` }))
              ]}
              value={selectedOfficer}
              onChange={setSelectedOfficer}
              placeholder="Choose an officer from your department..."
              disabled={assigning}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedOfficer(currentOfficerId || "");
                }}
                disabled={assigning}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedOfficer || (selectedOfficer !== "UNASSIGNED" && selectedOfficer === currentOfficerId)}
                className="px-4 py-1.5 text-xs font-semibold bg-blue text-white rounded-md hover:bg-blue-hover transition-colors disabled:opacity-50"
              >
                {assigning ? "Updating..." : selectedOfficer === "UNASSIGNED" ? "Unassign" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
