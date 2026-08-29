"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";

interface Service {
  id: string;
  title: string;
  agency: string;
  category: string;
  description: string;
  modality: string;
  timeframe: string;
  apply_url: string;
  is_active: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState<Partial<Service>>({
    title: "",
    agency: "",
    category: "Identity & Records",
    description: "",
    modality: "Online",
    timeframe: "",
    apply_url: "",
    is_active: true
  });

  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, [supabase]);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        title: "",
        agency: "",
        category: "Identity & Records",
        description: "",
        modality: "Online",
        timeframe: "",
        apply_url: "",
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      await supabase.from("services").update(formData).eq("id", editingService.id);
    } else {
      await supabase.from("services").insert(formData);
    }
    setIsModalOpen(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      await supabase.from("services").delete().eq("id", id);
      fetchServices();
    }
  };

  return (
    <div className="p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        <AdminPageHeader 
          title="Manage Services"
          description="Add or update services displayed in the Citizen Directory."
          action={
            <button 
              onClick={() => handleOpenModal()}
              className="bg-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-hover transition-colors shadow-sm"
            >
              + Add Service
            </button>
          }
        />

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Agency</th>
                      <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading services...</td></tr>
                    ) : services.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No services found.</td></tr>
                    ) : (
                      services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-navy">{service.title}</div>
                            <div className="text-xs text-text-muted truncate max-w-xs">{service.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">{service.category}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{service.agency}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-3">
                            <button onClick={() => handleOpenModal(service)} className="text-blue hover:text-blue-hover font-medium text-sm">Edit</button>
                            <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-700 font-medium text-sm">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-navy">{editingService ? "Edit Service" : "Add New Service"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-navy text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Service Title</label>
                <input required type="text" className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Agency/Department</label>
                  <input required type="text" className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                  <select required className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Identity & Records">Identity & Records</option>
                    <option value="Certificates">Certificates</option>
                    <option value="Transport">Transport</option>
                    <option value="Revenue & Property">Revenue & Property</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea required rows={3} className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Modality</label>
                  <input required type="text" placeholder="e.g., Online + Office visit" className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.modality} onChange={e => setFormData({...formData, modality: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Timeframe</label>
                  <input required type="text" placeholder="e.g., usually 15-30 days" className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.timeframe} onChange={e => setFormData({...formData, timeframe: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Official Apply URL</label>
                <input type="url" placeholder="https://" className="w-full px-4 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.apply_url} onChange={e => setFormData({...formData, apply_url: e.target.value})} />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-blue focus:ring-blue" />
                <label htmlFor="isActive" className="text-sm font-medium text-text-primary">Service is Active</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-navy font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue text-white rounded-lg font-medium hover:bg-blue-hover">Save Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
