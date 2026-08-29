"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { State, District } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";

interface DistrictWithState extends District {
  states?: { name: string };
}

export default function ManageLocationsPage() {
  const [activeTab, setActiveTab] = useState<"STATES" | "DISTRICTS">("STATES");
  
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<DistrictWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [stateForm, setStateForm] = useState({ name: "", country: "India" });

  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<DistrictWithState | null>(null);
  
  const [sortOption, setSortOption] = useState("name_asc");

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [statesRes, districtsRes] = await Promise.all([
      supabase.from("states").select("*").order("name"),
      supabase.from("districts").select("*, states(name)").order("name")
    ]);
    
    if (!statesRes.error && statesRes.data) setStates(statesRes.data);
    if (!districtsRes.error && districtsRes.data) setDistricts(districtsRes.data);
    setLoading(false);
  }

  // --- STATE LOGIC ---
  const handleOpenStateModal = (st?: State) => {
    if (st) {
      setEditingState(st);
      setStateForm({ name: st.name, country: st.country });
    } else {
      setEditingState(null);
      setStateForm({ name: "", country: "India" });
    }
    setIsStateModalOpen(true);
  };

  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingState) {
        const { error } = await supabase
          .from("states")
          .update({ name: stateForm.name, country: stateForm.country })
          .eq("id", editingState.id);
        if (error) throw error;
        
        await logAuditEvent(supabase, {
          action_type: "STATE_UPDATED",
          resource_type: "state",
          resource_id: editingState.id,
          previous_value: editingState,
          new_value: stateForm
        });
      } else {
        const { data, error } = await supabase
          .from("states")
          .insert({ name: stateForm.name, country: stateForm.country })
          .select()
          .single();
        if (error) throw error;

        await logAuditEvent(supabase, {
          action_type: "STATE_CREATED",
          resource_type: "state",
          resource_id: data.id,
          previous_value: null,
          new_value: data
        });
      }
      setIsStateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteState = async (st: State) => {
    if (!confirm(`Are you sure you want to delete ${st.name}? This might cascade and delete attached districts.`)) return;
    try {
      const { error } = await supabase.from("states").delete().eq("id", st.id);
      if (error) throw error;
      
      await logAuditEvent(supabase, {
        action_type: "STATE_DELETED",
        resource_type: "state",
        resource_id: st.id,
        previous_value: st,
        new_value: null
      });
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // --- DISTRICT LOGIC ---
  const handleOpenDistrictModal = (dist?: DistrictWithState) => {
    if (dist) {
      setEditingDistrict(dist);
      setDistrictForm({ name: dist.name, state_id: dist.state_id });
    } else {
      setEditingDistrict(null);
      setDistrictForm({ name: "", state_id: states[0]?.id || "" });
    }
    setIsDistrictModalOpen(true);
  };

  const handleSaveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtForm.state_id) return alert("Please select a state.");
    try {
      if (editingDistrict) {
        const { error } = await supabase
          .from("districts")
          .update({ name: districtForm.name, state_id: districtForm.state_id })
          .eq("id", editingDistrict.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("districts")
          .insert({ name: districtForm.name, state_id: districtForm.state_id });
        if (error) throw error;
      }
      setIsDistrictModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteDistrict = async (dist: DistrictWithState) => {
    if (!confirm(`Are you sure you want to delete ${dist.name}?`)) return;
    try {
      const { error } = await supabase.from("districts").delete().eq("id", dist.id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const stateColumns: Column<State>[] = [
    { key: "name", header: "State Name" },
    { key: "country", header: "Country" },
    { key: "created_at", header: "Created", render: (s) => new Date(s.created_at).toLocaleDateString() }
  ];

  const districtColumns: Column<DistrictWithState>[] = [
    { key: "name", header: "District Name" },
    { key: "state_id", header: "State", render: (d) => d.states?.name || "Unknown" },
    { key: "created_at", header: "Created", render: (d) => new Date(d.created_at).toLocaleDateString() }
  ];

  const filteredStates = states.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.country.toLowerCase().includes(searchQuery.toLowerCase())
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

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.states?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
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
        title="Manage Locations" 
        description="Configure states and districts for geographic categorization."
        action={
          <button 
            onClick={() => activeTab === "STATES" ? handleOpenStateModal() : handleOpenDistrictModal()}
            className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors"
          >
            + New {activeTab === "STATES" ? "State" : "District"}
          </button>
        }
      />
      
      {/* Search and Tabs Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-border gap-4 pb-2">
        {/* Tabs */}
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("STATES")}
            className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 -mb-[9px] ${
              activeTab === "STATES" ? "border-blue text-blue" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            States / UTs
          </button>
          <button
            onClick={() => setActiveTab("DISTRICTS")}
            className={`py-2 px-4 font-medium text-sm transition-colors border-b-2 -mb-[9px] ${
              activeTab === "DISTRICTS" ? "border-blue text-blue" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            Districts
          </button>
        </div>

        {/* Toolbar: Search and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === "STATES" ? "states" : "districts"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-bg placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue sm:text-sm transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm text-text-secondary whitespace-nowrap hidden sm:inline">Sort:</label>
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
      </div>

      {activeTab === "STATES" ? (
        <AdminTable 
          data={filteredStates} 
          columns={stateColumns} 
          loading={loading}
          onEdit={handleOpenStateModal}
          onDelete={handleDeleteState}
        />
      ) : (
        <AdminTable 
          data={filteredDistricts} 
          columns={districtColumns} 
          loading={loading}
          onEdit={handleOpenDistrictModal}
          onDelete={handleDeleteDistrict}
        />
      )}

      {/* State Modal */}
      {isStateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg">
              <h3 className="font-semibold text-lg text-text-primary">
                {editingState ? "Edit State" : "Add New State"}
              </h3>
              <button onClick={() => setIsStateModalOpen(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleSaveState} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">State Name</label>
                <input 
                  autoFocus
                  required
                  value={stateForm.name}
                  onChange={e => setStateForm({...stateForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue bg-bg"
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Country</label>
                <input 
                  required
                  value={stateForm.country}
                  onChange={e => setStateForm({...stateForm, country: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue bg-bg"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsStateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue text-white text-sm font-medium rounded shadow-sm hover:bg-blue-hover">Save State</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* District Modal */}
      {isDistrictModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg">
              <h3 className="font-semibold text-lg text-text-primary">
                {editingDistrict ? "Edit District" : "Add New District"}
              </h3>
              <button onClick={() => setIsDistrictModalOpen(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleSaveDistrict} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">District Name</label>
                <input 
                  autoFocus
                  required
                  value={districtForm.name}
                  onChange={e => setDistrictForm({...districtForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue bg-bg"
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">State</label>
                <select
                  required
                  value={districtForm.state_id}
                  onChange={e => setDistrictForm({...districtForm, state_id: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue bg-bg"
                >
                  <option value="" disabled>Select a State</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDistrictModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue text-white text-sm font-medium rounded shadow-sm hover:bg-blue-hover">Save District</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
