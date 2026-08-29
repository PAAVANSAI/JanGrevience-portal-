"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [sortOption, setSortOption] = useState("name_asc");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  async function loadDepartments() {
    const { data } = await supabase.from("departments").select("id, name").order("name");
    if (data) setDepartments(data);
  }

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  }

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to change ${selectedUser.full_name}'s role to ${newRole}?`)) return;

    try {
      const { error } = await supabase.rpc("admin_change_user_role", {
        p_user_id: selectedUser.id,
        p_new_role: newRole
      });

      if (error) throw error;

      await logAuditEvent(supabase, {
        action_type: "ROLE_CHANGED",
        resource_type: "profile",
        resource_id: selectedUser.id,
        previous_value: { role: selectedUser.role },
        new_value: { role: newRole }
      });

      alert("Role updated successfully.");
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDepartmentChange = async (newDeptId: string) => {
    if (!selectedUser) return;
    const deptName = departments.find(d => d.id === newDeptId)?.name || "Unknown";
    if (!confirm(`Are you sure you want to transfer ${selectedUser.full_name} to ${deptName}?`)) return;

    try {
      const { error } = await supabase.rpc("admin_change_user_department", {
        p_user_id: selectedUser.id,
        p_new_department_id: newDeptId
      });

      if (error) throw error;

      await logAuditEvent(supabase, {
        action_type: "DEPARTMENT_CHANGED" as any,
        resource_type: "profile",
        resource_id: selectedUser.id,
        previous_value: { department_id: selectedUser.department_id },
        new_value: { department_id: newDeptId }
      });

      alert("Department transferred successfully.");
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!selectedUser) return;
    
    // Prevent deactivating oneself
    const { data: { user } } = await supabase.auth.getUser();
    if (selectedUser.id === user?.id && !isActive) {
      alert("You cannot deactivate your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to ${isActive ? "reactivate" : "deactivate"} this user?`)) return;

    try {
      const { error } = await supabase.rpc("admin_toggle_user_active", {
        p_user_id: selectedUser.id,
        p_is_active: isActive
      });

      if (error) throw error;

      await logAuditEvent(supabase, {
        action_type: "STATUS_CHANGED",
        resource_type: "profile",
        resource_id: selectedUser.id,
        previous_value: { is_active: !isActive },
        new_value: { is_active: isActive }
      });

      alert(`User ${isActive ? "reactivated" : "deactivated"} successfully.`);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const columns: Column<Profile>[] = [
    { key: "full_name", header: "Name" },
    { key: "phone", header: "Phone", render: (u) => u.phone || "-" },
    { 
      key: "role", 
      header: "Role", 
      render: (u) => <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{u.role}</span>
    },
    {
      key: "is_active",
      header: "Status",
      render: (u) => <StatusBadge status={u.is_active ? "ACTIVE" : "INACTIVE"} />
    },
    { key: "created_at", header: "Joined", render: (u) => new Date(u.created_at).toLocaleDateString() }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                          (user.phone || "").includes(searchQuery) ||
                          (user.role?.toLowerCase() || "").includes(searchQuery.toLowerCase());
                          
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    
    let matchesDepartment = true;
    if (departmentFilter === "NONE") {
      matchesDepartment = !user.department_id;
    } else if (departmentFilter !== "ALL") {
      matchesDepartment = user.department_id === departmentFilter;
    }

    return matchesSearch && matchesRole && matchesDepartment;
  }).sort((a, b) => {
    switch (sortOption) {
      case "name_asc":
        return (a.full_name || "").localeCompare(b.full_name || "");
      case "name_desc":
        return (b.full_name || "").localeCompare(a.full_name || "");
      case "role":
        return (a.role || "").localeCompare(b.role || "");
      case "date_desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader 
        title="Manage Users" 
        description="View all registered users and manage their roles and access."
      />
      
      {/* Toolbar: Search, Filter, and Sort */}
      <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-bg placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue sm:text-sm transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-bg focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="ALL">All Roles</option>
            <option value="CITIZEN">Citizen</option>
            <option value="OFFICER">Officer</option>
            <option value="DEPT_ADMIN">Dept Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-bg focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue transition-colors appearance-none cursor-pointer max-w-[200px] truncate"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
            <option value="NONE">Unassigned</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary whitespace-nowrap hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-bg focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="role">Role</option>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <AdminTable 
        data={filteredUsers} 
        columns={columns} 
        isLoading={loading}
        onRowClick={(user) => setSelectedUser(user)}
      />

      {/* Quick Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-navy mb-4">Edit User: {selectedUser.full_name}</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Current Role</p>
                <div className="flex gap-2 flex-wrap">
                  {["CITIZEN", "OFFICER", "DEPT_ADMIN", "SUPER_ADMIN"].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      disabled={r === selectedUser.role}
                      className={`px-3 py-1.5 text-sm font-medium rounded border ${
                        r === selectedUser.role 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-surface text-text-secondary border-border hover:bg-bg"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedUser.role === "OFFICER" || selectedUser.role === "DEPT_ADMIN") && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">Department</p>
                  <select
                    value={selectedUser.department_id || ""}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="block w-full pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-bg focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-sm text-text-secondary mb-2">Account Status</p>
                {selectedUser.is_active ? (
                  <button 
                    onClick={() => handleToggleActive(false)}
                    className="px-4 py-2 bg-error-bg text-error border border-error-border rounded hover:bg-error hover:text-white transition-colors"
                  >
                    Deactivate Account
                  </button>
                ) : (
                  <button 
                    onClick={() => handleToggleActive(true)}
                    className="px-4 py-2 bg-success-bg text-success border border-success-border rounded hover:bg-success hover:text-white transition-colors"
                  >
                    Reactivate Account
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-text-secondary hover:bg-bg rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
