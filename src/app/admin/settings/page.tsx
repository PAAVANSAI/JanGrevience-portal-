"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SystemSetting } from "@/types/database";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { logAuditEvent } from "@/lib/audit";
import { motion } from "framer-motion";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data, error } = await supabase.from("system_settings").select("*").order("key");
    if (!error && data) {
      setSettings(data);
    }
    setLoading(false);
  }

  const handleUpdateSetting = async (key: string, newValue: any, originalSetting: SystemSetting) => {
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq("key", key);

      if (error) throw error;
      
      await logAuditEvent(supabase, {
        action_type: "SYSTEM_SETTING_UPDATED",
        resource_type: "system_setting",
        resource_id: key,
        previous_value: originalSetting.value,
        new_value: newValue
      });

      alert("Setting updated successfully.");
      loadSettings();
    } catch (err: any) {
      alert("Error updating setting: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader 
        title="System Settings" 
        description="Global configuration toggles for the platform."
      />
      
      <div className="bg-surface border border-border rounded-lg shadow-sm p-6 space-y-8">
        {settings.map((setting, index) => (
          <motion.div 
            key={setting.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="pb-6 border-b border-border last:border-0 last:pb-0"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-navy text-lg">{setting.key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</h3>
                <p className="text-sm text-text-secondary mt-1">{setting.description || "No description provided."}</p>
              </div>
              
              <div className="w-full md:w-64">
                {typeof setting.value === "boolean" || setting.value === "true" || setting.value === "false" ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateSetting(setting.key, setting.value === "true" || setting.value === true ? false : true, setting)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.value === "true" || setting.value === true ? "bg-blue" : "bg-text-muted"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.value === "true" || setting.value === true ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                    <span className="text-sm font-medium">
                      {(setting.value === "true" || setting.value === true) ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type={typeof setting.value === "number" || !isNaN(Number(setting.value)) ? "number" : "text"}
                      defaultValue={setting.value}
                      className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-light"
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== setting.value?.toString()) {
                          handleUpdateSetting(setting.key, val, setting);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {settings.length === 0 && (
          <p className="text-text-muted">No system settings found.</p>
        )}
      </div>
    </div>
  );
}
