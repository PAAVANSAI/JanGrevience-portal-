"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Department } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ManageDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  
  const supabase = createClient();

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    const { data, error } = await supabase.from("departments").select("*").order("name");
    if (!error && data) {
      setDepartments(data);
    }
    setLoading(false);
  }

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, description: dept.description || "", is_active: dept.is_active });
    } else {
      setEditingDept(null);
      setFormData({ name: "", description: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        // Update
        const { error } = await supabase
          .from("departments")
          .update({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active
          })
          .eq("id", editingDept.id);

        if (error) throw error;
        
        await logAuditEvent(supabase, {
          action_type: "DEPARTMENT_UPDATED",
          resource_type: "department",
          resource_id: editingDept.id,
          previous_value: editingDept,
          new_value: formData
        });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("departments")
          .insert({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (error) throw error;

        await logAuditEvent(supabase, {
          action_type: "DEPARTMENT_CREATED",
          resource_type: "department",
          resource_id: data.id,
          previous_value: null,
          new_value: data
        });
      }

      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const columns: Column<Department>[] = [
    { key: "name", header: "Department Name" },
    { key: "description", header: "Description", render: (d) => d.description || "-" },
    {
      key: "is_active",
      header: "Status",
      render: (d) => <StatusBadge status={d.is_active ? "ACTIVE" : "INACTIVE"} />
    },
    { key: "created_at", header: "Created", render: (d) => new Date(d.created_at).toLocaleDateString() }
  ];

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dept.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortOption) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
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
        title="Manage Departments" 
        description="Create and manage government departments handling grievances."
        action={
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors"
          >
            + New Department
          </button>
        }
      />
      
      {/* Toolbar: Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6 border-b border-border pb-4">
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-bg placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue sm:text-sm transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-text-secondary whitespace-nowrap">Sort by:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-bg focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
          </select>
        </div>
      </div>

      <AdminTable 
        data={filteredDepartments} 
        columns={columns} 
        isLoading={loading}
        onRowClick={handleOpenModal}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-navy mb-4">
              {editingDept ? "Edit Department" : "New Department"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border text-blue focus:ring-blue-light"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-navy">
                  Active (visible to citizens)
                </label>
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
                  className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
