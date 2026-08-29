"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/UserContext";
import StatusBadge from "@/components/ui/StatusBadge";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { calculateSlaStatus } from "@/lib/utils/sla";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";

export default function DepartmentGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrievances, setSelectedGrievances] = useState<Set<string>>(new Set());
  const [officers, setOfficers] = useState<any[]>([]);
  const [bulkOfficer, setBulkOfficer] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const supabase = createClient();
  const { profile } = useUserRole();

  useEffect(() => {
    if (profile?.department_id) {
      loadGrievances();
      loadOfficers();
    } else {
      setLoading(false);
    }
  }, [profile?.department_id]);

  async function loadOfficers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_on_leave")
      .eq("department_id", profile!.department_id)
      .in("role", ["OFFICER", "DEPT_ADMIN"])
      .order("full_name");
    if (data) setOfficers(data);
  }

  async function loadGrievances() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("grievances")
        .select(`
          *,
          categories(name, sla_rules(target_days, reminder_threshold_percent)),
          grievance_assignments(officer_id, profiles:officer_id(full_name))
        `)
        .eq("department_id", profile!.department_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setGrievances(data);
    } catch (err) {
      console.error("Error loading grievances:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkAssign() {
    if (!bulkOfficer || selectedGrievances.size === 0 || !profile?.id) return;
    setBulkAssigning(true);

    try {
      // 1. Clear any existing assignments for these grievances
      await supabase
        .from("grievance_assignments")
        .delete()
        .in("grievance_id", Array.from(selectedGrievances));

      // 2. Insert new assignments
      const assignments = Array.from(selectedGrievances).map(id => ({
        grievance_id: id,
        officer_id: bulkOfficer,
        assigned_by: profile.id
      }));

      const { error: assignError } = await supabase
        .from("grievance_assignments")
        .insert(assignments);

      if (assignError) throw assignError;

      // 3. Update grievance statuses to ASSIGNED (only if currently SUBMITTED or ACKNOWLEDGED)
      const { error: updateError } = await supabase
        .from("grievances")
        .update({ status: "ASSIGNED" })
        .in("id", Array.from(selectedGrievances))
        .in("status", ["SUBMITTED", "ACKNOWLEDGED"]);

      if (updateError) throw updateError;

      // Reset selection and refresh list
      setSelectedGrievances(new Set());
      setBulkOfficer("");
      await loadGrievances();
      
    } catch (err: any) {
      console.error("Bulk assign failed:", err);
      alert("Failed to assign some grievances: " + err.message);
    } finally {
      setBulkAssigning(false);
    }
  }

  // Derived filtered lists
  const filteredGrievances = grievances.filter((g) => {
    // 1. Text Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesId = g.grievance_number?.toLowerCase().includes(q);
      const matchesSubject = g.subject?.toLowerCase().includes(q);
      if (!matchesId && !matchesSubject) return false;
    }

    // 2. Tab Filter
    const isUnassigned = !g.grievance_assignments || g.grievance_assignments.length === 0;
    
    if (filter === "unassigned") return isUnassigned && !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status);
    if (filter === "in_progress") return g.status === "IN_PROGRESS";
    if (filter === "resolved") return g.status === "RESOLVED" || g.status === "CLOSED";
    if (filter === "escalated") return g.escalation_level > 0 && !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status);

    return true; // "all"
  });

  const unassignedCount = grievances.filter(g => (!g.grievance_assignments || g.grievance_assignments.length === 0) && !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status)).length;
  const inProgressCount = grievances.filter(g => g.status === "IN_PROGRESS").length;
  const escalatedCount = grievances.filter(g => g.escalation_level > 0 && !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status)).length;


  if (!loading && !profile?.department_id) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <p className="text-text-muted">You are not assigned to a department.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Department Grievances"
        description="View and assign all grievances within your department."
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "all" ? "bg-blue text-white shadow-sm" : "bg-surface text-text-secondary hover:bg-surface-2 border border-border"
            }`}
          >
            All Grievances
          </button>
          <button
            onClick={() => setFilter("unassigned")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === "unassigned" ? "bg-amber-500 text-white shadow-sm" : "bg-surface text-text-secondary hover:bg-surface-2 border border-border"
            }`}
          >
            Unassigned
            {unassignedCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === "unassigned" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                {unassignedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === "in_progress" ? "bg-blue text-white shadow-sm" : "bg-surface text-text-secondary hover:bg-surface-2 border border-border"
            }`}
          >
            In Progress
            {inProgressCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === "in_progress" ? "bg-white/20 text-white" : "bg-blue/10 text-blue"}`}>
                {inProgressCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "resolved" ? "bg-green-600 text-white shadow-sm" : "bg-surface text-text-secondary hover:bg-surface-2 border border-border"
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setFilter("escalated")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === "escalated" ? "bg-error text-white shadow-sm" : "bg-surface text-text-secondary hover:bg-surface-2 border border-border"
            }`}
          >
            Escalated
            {escalatedCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === "escalated" ? "bg-white/20 text-white" : "bg-error-bg text-error"}`}>
                {escalatedCount}
              </span>
            )}
          </button>
        </div>
        
        <div className="relative flex-shrink-0 w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search grievances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-2 border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-border text-blue focus:ring-blue"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGrievances(new Set(filteredGrievances.map(g => g.id)));
                      } else {
                        setSelectedGrievances(new Set());
                      }
                    }}
                    checked={filteredGrievances.length > 0 && selectedGrievances.size === filteredGrievances.length}
                  />
                </th>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4 hidden sm:table-cell">Category</th>
                <th className="px-5 py-4">Status & SLA</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredGrievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p className="text-text-primary font-medium">No grievances found</p>
                    <p className="text-text-muted text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredGrievances.map((g) => {
                  const assignedOfficer = g.grievance_assignments?.[0]?.profiles?.full_name || null;
                  const isUnassigned = !g.grievance_assignments || g.grievance_assignments.length === 0;
                  const isSelected = selectedGrievances.has(g.id);

                  return (
                    <tr key={g.id} className={`transition-colors group ${isSelected ? 'bg-blue/5' : 'hover:bg-surface-2'}`}>
                      <td className="px-5 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-border text-blue focus:ring-blue"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedGrievances);
                            if (e.target.checked) newSet.add(g.id);
                            else newSet.delete(g.id);
                            setSelectedGrievances(newSet);
                          }}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-medium">
                        <Link href={`/department-admin/grievances/${g.id}`} className="text-blue hover:text-blue-hover hover:underline underline-offset-2">
                          {g.grievance_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary max-w-[160px] sm:max-w-[240px] truncate">
                          <Link href={`/department-admin/grievances/${g.id}`} className="hover:text-blue transition-colors">
                            {g.subject}
                          </Link>
                        </div>
                        <div className="text-xs text-text-muted mt-1 hidden sm:block">
                          Filed: {new Date(g.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-text-secondary text-sm">{g.categories?.name || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={g.status} />
                          {g.status !== "RESOLVED" && g.status !== "CLOSED" && g.status !== "REJECTED" && (
                            <SlaBadge sla={calculateSlaStatus(g, g.categories?.sla_rules?.[0])} role="DEPT_ADMIN" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isUnassigned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Needs Assignment
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue/10 text-blue flex items-center justify-center text-xs font-bold">
                              {assignedOfficer?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-text-primary">{assignedOfficer}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/department-admin/grievances/${g.id}`}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            isUnassigned 
                              ? "bg-blue text-white hover:bg-blue-hover shadow-sm" 
                              : "bg-surface-2 text-text-primary hover:bg-border border border-border"
                          }`}
                        >
                          {isUnassigned ? "Assign Officer" : "View Details"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bulk Action Bar */}
      {selectedGrievances.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-2xl rounded-xl p-4 flex items-center gap-4 z-50 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue text-white text-xs font-bold">
              {selectedGrievances.size}
            </span>
            <span className="text-sm font-semibold text-text-primary">Selected</span>
          </div>
          
          <div className="h-6 w-px bg-border mx-2"></div>
          
          <select
            value={bulkOfficer}
            onChange={(e) => setBulkOfficer(e.target.value)}
            disabled={bulkAssigning}
            className="w-48 p-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-colors"
          >
            <option value="" disabled>Choose Officer...</option>
            {officers.map(o => (
              <option key={o.id} value={o.id} disabled={o.is_on_leave}>
                {o.full_name} {o.is_on_leave ? '(On Leave)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleBulkAssign}
            disabled={!bulkOfficer || bulkAssigning}
            className="px-4 py-2 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-hover transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {bulkAssigning ? "Assigning..." : "Assign to Selected"}
          </button>
        </div>
      )}
    </div>
  );
}
