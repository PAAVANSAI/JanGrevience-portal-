"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SlaRule, Category } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { AdminTable, Column } from "@/components/ui/AdminTable";
import { logAuditEvent } from "@/lib/audit";

interface SlaRuleWithCategory extends SlaRule {
  categories?: { name: string; department_id: string };
}

export default function ManageSlaRulesPage() {
  const [rules, setRules] = useState<SlaRuleWithCategory[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SlaRuleWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("category_asc");
  
  const [formData, setFormData] = useState({ 
    category_id: "", 
    target_days: 7, 
    reminder_threshold_percent: 80, 
    is_active: true 
  });
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [rulesRes, catsRes] = await Promise.all([
      supabase.from("sla_rules").select("*, categories(name, department_id)"),
      supabase.from("categories").select("*").eq("is_active", true)
    ]);
    
    if (!rulesRes.error && rulesRes.data) setRules(rulesRes.data);
    if (!catsRes.error && catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }

  const handleOpenModal = (rule?: SlaRuleWithCategory) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({ 
        category_id: rule.category_id, 
        target_days: rule.target_days, 
        reminder_threshold_percent: rule.reminder_threshold_percent,
        is_active: rule.is_active 
      });
    } else {
      setEditingRule(null);
      setFormData({ 
        category_id: categories[0]?.id || "", 
        target_days: 7, 
        reminder_threshold_percent: 80, 
        is_active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      alert("Please select a category");
      return;
    }

    try {
      if (editingRule) {
        // Update
        const { error } = await supabase
          .from("sla_rules")
          .update({
            target_days: formData.target_days,
            reminder_threshold_percent: formData.reminder_threshold_percent,
            is_active: formData.is_active
          })
          .eq("id", editingRule.id);

        if (error) throw error;
        
        await logAuditEvent(supabase, {
          action_type: "SLA_RULE_UPDATED",
          resource_type: "sla_rule",
          resource_id: editingRule.id,
          previous_value: editingRule,
          new_value: formData
        });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("sla_rules")
          .insert({
            category_id: formData.category_id,
            target_days: formData.target_days,
            reminder_threshold_percent: formData.reminder_threshold_percent,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (error) throw error;

        await logAuditEvent(supabase, {
          action_type: "SLA_RULE_CREATED",
          resource_type: "sla_rule",
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

  const columns: Column<SlaRuleWithCategory>[] = [
    { key: "category", header: "Category", render: (r) => r.categories?.name || "Unknown" },
    { key: "target_days", header: "Target Days", render: (r) => `${r.target_days} days` },
    { key: "reminder_threshold_percent", header: "Reminder Threshold", render: (r) => `${r.reminder_threshold_percent}%` },
    { key: "is_active", header: "Status", render: (r) => r.is_active ? "Active" : "Inactive" }
  ];

  // Filter out categories that already have rules for the New Rule dropdown
  const availableCategories = categories.filter(c => !rules.some(r => r.category_id === c.id));

  const filteredRules = rules.filter(rule => 
    (rule.categories?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortOption) {
      case "category_asc":
        return (a.categories?.name || "").localeCompare(b.categories?.name || "");
      case "category_desc":
        return (b.categories?.name || "").localeCompare(a.categories?.name || "");
      case "target_asc":
        return a.target_days - b.target_days;
      case "target_desc":
        return b.target_days - a.target_days;
      default:
        return 0;
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <AdminPageHeader 
        title="SLA Rules" 
        description="Configure target resolution days for each category."
        action={
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue text-white rounded font-medium hover:bg-blue-hover transition-colors"
          >
            + New SLA Rule
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
            placeholder="Search SLA rules..."
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
            <option value="category_asc">Category (A-Z)</option>
            <option value="category_desc">Category (Z-A)</option>
            <option value="target_asc">Target Days (Low to High)</option>
            <option value="target_desc">Target Days (High to Low)</option>
          </select>
        </div>
      </div>

      <AdminTable 
        data={filteredRules} 
        columns={columns} 
        isLoading={loading}
        onRowClick={handleOpenModal}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-navy mb-4">
              {editingRule ? "Edit SLA Rule" : "New SLA Rule"}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Category</label>
                {editingRule ? (
                  <input
                    type="text"
                    disabled
                    value={editingRule.categories?.name || ""}
                    className="w-full p-2 bg-bg border border-border rounded text-text-secondary"
                  />
                ) : (
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                  >
                    <option value="" disabled>Select a category</option>
                    {availableCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Target Resolution (Days)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={365}
                  value={formData.target_days}
                  onChange={(e) => setFormData({ ...formData, target_days: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Reminder Threshold (%)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={99}
                  value={formData.reminder_threshold_percent}
                  onChange={(e) => setFormData({ ...formData, reminder_threshold_percent: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                />
                <p className="text-xs text-text-secondary mt-1">E.g. 80% means a reminder is triggered when 20% of the time remains.</p>
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
                  Active
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
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
