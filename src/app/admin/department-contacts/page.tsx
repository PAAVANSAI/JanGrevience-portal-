"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminTable } from "@/components/ui/AdminTable";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import { useForm } from "react-hook-form";
import { DepartmentContact } from "@/types/database";

interface DepartmentContactForm {
  department_id: string;
  officer_name: string;
  designation: string;
  dealing_with: string;
  phone: string;
  email: string;
  address: string;
}

export default function DepartmentContactsAdmin() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DepartmentContactForm>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: deptData } = await supabase.from("departments").select("id, name").eq("is_active", true).order("name");
    if (deptData) setDepartments(deptData);

    const { data: contactData } = await supabase
      .from("department_contacts")
      .select(`
        *,
        departments (name)
      `)
      .order("updated_at", { ascending: false });
    
    if (contactData) setContacts(contactData);
    setLoading(false);
  };

  const handleOpenModal = (contact?: any) => {
    if (contact) {
      setEditingContact(contact);
      reset({
        department_id: contact.department_id || "",
        officer_name: contact.officer_name,
        designation: contact.designation,
        dealing_with: contact.dealing_with || "",
        phone: contact.phone || "",
        email: contact.email || "",
        address: contact.address || ""
      });
    } else {
      setEditingContact(null);
      reset({
        department_id: "",
        officer_name: "",
        designation: "",
        dealing_with: "",
        phone: "",
        email: "",
        address: ""
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DepartmentContactForm) => {
    try {
      const payload = {
        department_id: data.department_id ? data.department_id : null,
        officer_name: data.officer_name,
        designation: data.designation,
        dealing_with: data.dealing_with || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        updated_at: new Date().toISOString()
      };

      if (editingContact) {
        const { error } = await supabase
          .from("department_contacts")
          .update(payload)
          .eq("id", editingContact.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("department_contacts")
          .insert(payload);
        
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert("Error saving contact: " + error.message);
    }
  };

  const handleDelete = async (contact: any) => {
    if (confirm(`Are you sure you want to delete the contact for ${contact.officer_name}?`)) {
      await supabase.from("department_contacts").delete().eq("id", contact.id);
      fetchData();
    }
  };

  const columns = [
    { 
      key: "department_id", 
      header: "Department",
      render: (item: any) => item.departments?.name || <span className="text-text-muted italic">General Contact</span>
    },
    { key: "officer_name", header: "Officer Name" },
    { key: "designation", header: "Designation" },
    { key: "dealing_with", header: "Dealing With" },
    { key: "phone", header: "Phone" },
    { 
      key: "updated_at", 
      header: "Last Updated",
      render: (item: any) => new Date(item.updated_at).toLocaleDateString()
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} 
            className="text-blue hover:underline text-sm font-medium"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
            className="text-red-500 hover:underline text-sm font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const filteredContacts = contacts.filter(contact => 
    contact.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.dealing_with?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.departments?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone?.includes(searchQuery)
  ).sort((a, b) => {
    switch (sortOption) {
      case "name_asc":
        return a.officer_name.localeCompare(b.officer_name);
      case "name_desc":
        return b.officer_name.localeCompare(a.officer_name);
      case "dept_asc":
        return (a.departments?.name || "").localeCompare(b.departments?.name || "");
      case "dept_desc":
        return (b.departments?.name || "").localeCompare(a.departments?.name || "");
      case "designation":
        return a.designation.localeCompare(b.designation);
      default:
        return 0;
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Public Contacts Directory</h1>
          <p className="text-sm text-text-secondary">Manage officers listed on the public Contact Us page</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors whitespace-nowrap"
        >
          + Add Contact
        </button>
      </div>

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
            placeholder="Search contacts..."
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
            <option value="name_asc">Officer Name (A-Z)</option>
            <option value="name_desc">Officer Name (Z-A)</option>
            <option value="dept_asc">Department (A-Z)</option>
            <option value="dept_desc">Department (Z-A)</option>
            <option value="designation">Designation</option>
          </select>
        </div>
      </div>

      <AdminTable 
        data={filteredContacts}
        columns={columns}
        isLoading={loading}
        onRowClick={handleOpenModal}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-navy mb-4">
              {editingContact ? "Edit Contact" : "Add Contact"}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Department</label>
                <select 
                  {...register("department_id")}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-blue bg-surface text-text-primary"
                >
                  <option value="">General Contact (No specific department)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <AuthInput 
                label="Officer Name *"
                {...register("officer_name", { required: "Officer name is required" })}
                error={errors.officer_name?.message}
              />
              
              <AuthInput 
                label="Designation *"
                {...register("designation", { required: "Designation is required" })}
                error={errors.designation?.message}
              />

              <AuthInput 
                label="Dealing With (Subject Area) *"
                {...register("dealing_with", { required: "Subject area is required" })}
                error={errors.dealing_with?.message}
              />

              <AuthInput 
                label="Phone"
                {...register("phone")}
              />

              <AuthInput 
                label="Email"
                type="email"
                {...register("email")}
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Address</label>
                <textarea 
                  {...register("address")}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-blue bg-surface text-text-primary resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg rounded-[var(--radius-md)] transition-colors"
                >
                  Cancel
                </button>
                <AuthButton 
                  type="submit" 
                  loading={isSubmitting}
                  className="w-auto px-6"
                >
                  {editingContact ? "Save Changes" : "Add Contact"}
                </AuthButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
