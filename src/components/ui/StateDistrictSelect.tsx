"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import type { State, District } from "@/types/database";
import PopupSelect from "@/components/ui/PopupSelect";

interface StateDistrictSelectProps {
  stateFieldName?: string;
  districtFieldName?: string;
}

export default function StateDistrictSelect({ 
  stateFieldName = "stateId", 
  districtFieldName = "districtId" 
}: StateDistrictSelectProps) {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext();
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const supabase = createClient();

  const selectedStateId = watch(stateFieldName);

  // Fetch states on mount
  useEffect(() => {
    async function fetchStates() {
      const { data } = await supabase.from("states").select("*").order("name");
      if (data) setStates(data as State[]);
      setLoadingStates(false);
    }
    fetchStates();
  }, [supabase]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!selectedStateId) {
      setDistricts([]);
      return;
    }
    async function fetchDistricts() {
      setLoadingDistricts(true);
      const { data } = await supabase
        .from("districts")
        .select("*")
        .eq("state_id", selectedStateId)
        .order("name");
      if (data) setDistricts(data as District[]);
      setLoadingDistricts(false);
    }
    fetchDistricts();
  }, [selectedStateId, supabase]);

  // Reset district if state changes and the current district is not in the new state
  useEffect(() => {
    if (districts.length > 0) {
      const currentDistrict = watch(districtFieldName);
      if (currentDistrict && !districts.find(d => d.id === currentDistrict)) {
        setValue(districtFieldName, "");
      }
    }
  }, [districts, setValue, watch, districtFieldName]);

  const stateError = errors[stateFieldName]?.message as string;
  const districtError = errors[districtFieldName]?.message as string;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* State Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text-primary">State / UT *</label>
        <Controller
          name={stateFieldName}
          control={control}
          render={({ field }) => (
            <PopupSelect
              options={states.map((st) => ({ value: st.id, label: st.name }))}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={loadingStates ? "Loading states..." : "Select your state"}
              disabled={loadingStates}
              error={!!stateError}
            />
          )}
        />
        {stateError && <p className="text-xs text-error font-medium">{stateError}</p>}
      </div>

      {/* District Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text-primary">District *</label>
        <Controller
          name={districtFieldName}
          control={control}
          render={({ field }) => (
            <PopupSelect
              options={districts.map((dist) => ({ value: dist.id, label: dist.name }))}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={
                !selectedStateId 
                  ? "Select a state first" 
                  : loadingDistricts 
                  ? "Loading districts..." 
                  : "Select your district"
              }
              disabled={!selectedStateId || loadingDistricts}
              error={!!districtError}
            />
          )}
        />
        {districtError && <p className="text-xs text-error font-medium">{districtError}</p>}
      </div>
    </div>
  );
}
