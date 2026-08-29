"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";
import { useUserRole } from "@/lib/context/UserContext";

export default function ManageDeptOfficersPage() {
  const [officers, setOfficers] = useState<Profile[]>([]);
  const [allOfficers, setAllOfficers] = useState<Profile[]>([]); // To select from
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  
  const { profile } = useUserRole();
  const supabase = createClient();

  useEffect(() => {
    if (profile !== undefined) {
      if (profile?.department_id) {
        loadOfficers();
      } else {
        setLoading(false);
      }
    }
  }, [profile]);

  async function loadOfficers() {
    setLoading(true);
    // Get officers currently in this department
    const { data: deptOfficers } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["OFFICER", "DEPT_ADMIN"])
      .eq("department_id", profile!.department_id)
      .order("full_name");

    // Fetch active grievances to compute workload
    const { data: activeGrievances } = await supabase
      .from("grievances")
      .select("id, status, grievance_assignments(officer_id)")
      .eq("department_id", profile!.department_id)
      .not("status", "in", '("RESOLVED","CLOSED","REJECTED")');

    const workloadMap: Record<string, number> = {};
    if (activeGrievances) {
      activeGrievances.forEach((g: any) => {
        if (g.grievance_assignments) {
          g.grievance_assignments.forEach((a: any) => {
            if (a.officer_id) {
              workloadMap[a.officer_id] = (workloadMap[a.officer_id] || 0) + 1;
            }
          });
        }
      });
    }

    if (deptOfficers) {
      // @ts-ignore - we are adding dynamic fields
      setOfficers(deptOfficers.map(o => ({ ...o, active_workload: workloadMap[o.id] || 0 })));
    }

    // Get officers NOT in this department (or unassigned)
    const { data: otherOfficers } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["OFFICER", "DEPT_ADMIN"])
      .neq("department_id", profile!.department_id || "00000000-0000-0000-0000-000000000000") // using dummy if null
      .order("full_name");
      
    if (otherOfficers) setAllOfficers(otherOfficers);

    setLoading(false);
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      const { error } = await supabase.rpc("admin_assign_user_department", {
        p_user_id: selectedUserId,
        p_department_id: profile!.department_id
      });

      if (error) throw error;

      await logAuditEvent(supabase, {
        action_type: "ROLE_CHANGED", // reusing or we could make DEPARTMENT_ASSIGNED
        resource_type: "profile",
        resource_id: selectedUserId,
        previous_value: null,
        new_value: { department_id: profile!.department_id }
      });

      alert("Officer assigned successfully.");
      setIsModalOpen(false);
      setSelectedUserId("");
      loadOfficers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this officer from your department?")) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: null })
        .eq("id", userId);

      if (error) throw error;

      await logAuditEvent(supabase, {
        action_type: "ROLE_CHANGED",
        resource_type: "profile",
        resource_id: userId,
        previous_value: { department_id: profile!.department_id },
        new_value: { department_id: null }
      });

      alert("Officer removed from department.");
      loadOfficers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleLeave = async (userId: string, is_on_leave: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_on_leave })
        .eq("id", userId);

      if (error) throw error;
      
      await logAuditEvent(supabase, {
        action_type: "STATUS_CHANGED",
        resource_type: "profile",
        resource_id: userId,
        previous_value: { is_on_leave: !is_on_leave },
        new_value: { is_on_leave }
      });

      loadOfficers();
    } catch (err: any) {
      alert("Error updating leave status: " + err.message);
    }
  };

  const columns: Column<Profile>[] = [
    { key: "full_name", header: "Name" },
    { key: "role", header: "Role" },
    { 
      key: "status", 
      header: "Status",
      render: (u: any) => (
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${u.is_on_leave ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
          {u.is_on_leave ? 'On Leave' : 'Active'}
        </span>
      )
    },
    { 
      key: "workload", 
      header: "Active Workload",
      render: (u: any) => (
        <div className="flex items-center gap-3">
          <div className="w-full bg-surface-2 rounded-full h-2 max-w-[80px] overflow-hidden">
            <div className={`h-2 rounded-full transition-all ${u.active_workload > 5 ? 'bg-error' : u.active_workload > 2 ? 'bg-amber-500' : 'bg-blue'}`} style={{ width: `${Math.min((u.active_workload / 10) * 100, 100)}%` }}></div>
          </div>
          <span className="text-sm font-semibold text-text-primary">{u.active_workload}</span>
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: any) => (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleToggleLeave(u.id, !u.is_on_leave)}
            className="text-text-secondary hover:text-navy text-sm font-medium transition-colors"
          >
            {u.is_on_leave ? "Mark Active" : "Mark on Leave"}
          </button>
          <div className="w-px h-4 bg-border"></div>
          <button 
            onClick={() => handleRemove(u.id)}
            className="text-error hover:text-error-hover text-sm font-medium transition-colors"
            disabled={u.id === profile?.id}
          >
            {u.id === profile?.id ? "Current User" : "Remove"}
          </button>
        </div>
      )
    }
  ];

  if (!loading && !profile?.department_id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <AdminPageHeader 
          title="Department Officers" 
          description="Assign or remove officers for your department."
        />
        <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-lg mt-4">
          You are not currently assigned to any department. Please contact a Super Admin to assign you to a department first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader 
        title="Department Officers" 
        description="Assign or remove officers for your department."
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors"
          >
            + Assign Officer
          </button>
        }
      />
      
      <AdminTable 
        data={officers} 
        columns={columns} 
        isLoading={loading}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-navy mb-4">Assign Officer</h3>
            
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Select Officer</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                >
                  <option value="" disabled>Choose an officer</option>
                  {allOfficers.map(o => (
                    <option key={o.id} value={o.id}>{o.full_name} ({o.role})</option>
                  ))}
                </select>
                {allOfficers.length === 0 && (
                  <p className="text-sm text-text-muted mt-1">No other unassigned officers available.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-text-secondary hover:bg-bg rounded font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedUserId}
                  className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
