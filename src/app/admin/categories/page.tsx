"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, Department } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";
import StatusBadge from "@/components/ui/StatusBadge";

interface CategoryWithDept extends Category {
  departments?: { name: string };
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithDept[]>([]);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryWithDept | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "", 
    department_id: "", 
    is_active: true 
  });
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [catsRes, deptsRes] = await Promise.all([
      supabase.from("categories").select("*, departments(name)").order("name"),
      supabase.from("departments").select("id, name").order("name")
    ]);
    
    if (!catsRes.error && catsRes.data) setCategories(catsRes.data);
    if (!deptsRes.error && deptsRes.data) setDepartments(deptsRes.data);
    setLoading(false);
  }

  const handleOpenModal = (cat?: CategoryWithDept) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({ 
        name: cat.name, 
        description: cat.description || "", 
        department_id: cat.department_id,
        is_active: cat.is_active 
      });
    } else {
      setEditingCat(null);
      setFormData({ name: "", description: "", department_id: departments[0]?.id || "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id) {
      alert("Please select a department");
      return;
    }

    try {
      if (editingCat) {
        // Update
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description,
            department_id: formData.department_id,
            is_active: formData.is_active
          })
          .eq("id", editingCat.id);

        if (error) throw error;
        
        await logAuditEvent(supabase, {
          action_type: "CATEGORY_UPDATED",
          resource_type: "category",
          resource_id: editingCat.id,
          previous_value: editingCat,
          new_value: formData
        });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("categories")
          .insert({
            name: formData.name,
            description: formData.description,
            department_id: formData.department_id,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (error) throw error;

        await logAuditEvent(supabase, {
          action_type: "CATEGORY_CREATED",
          resource_type: "category",
          resource_id: data.id,
          previous_value: null,
          new_value: data
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const columns: Column<CategoryWithDept>[] = [
    { key: "name", header: "Category Name" },
    { key: "department", header: "Department", render: (c) => c.departments?.name || "Unknown" },
    {
      key: "is_active",
      header: "Status",
      render: (c) => <StatusBadge status={c.is_active ? "ACTIVE" : "INACTIVE"} />
    }
  ];

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.departments?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortOption) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "dept_asc":
        return (a.departments?.name || "").localeCompare(b.departments?.name || "");
      case "dept_desc":
        return (b.departments?.name || "").localeCompare(a.departments?.name || "");
      default:
        return 0;
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader 
        title="Manage Categories" 
        description="Configure specific issue types under each department."
        action={
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors"
          >
            + New Category
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
            placeholder="Search categories..."
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
            <option value="name_asc">Category Name (A-Z)</option>
            <option value="name_desc">Category Name (Z-A)</option>
            <option value="dept_asc">Department (A-Z)</option>
            <option value="dept_desc">Department (Z-A)</option>
          </select>
        </div>
      </div>

      <AdminTable 
        data={filteredCategories} 
        columns={columns} 
        isLoading={loading}
        onRowClick={handleOpenModal}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-navy mb-4">
              {editingCat ? "Edit Category" : "New Category"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Department</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                >
                  <option value="" disabled>Select a department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
