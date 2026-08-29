"use client";

import React, { useEffect, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import type { GrievanceFormData } from "@/lib/validations/grievance";
import type { Department, Category } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import StateDistrictSelect from "@/components/ui/StateDistrictSelect";
import LocationPicker from "@/components/ui/LocationPicker";
import PopupSelect from "@/components/ui/PopupSelect";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function StepClassification({ onNext, onPrev }: Props) {
  const { register, watch, setValue, control, formState: { errors } } = useFormContext<GrievanceFormData>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCats, setLoadingCats] = useState(false);
  const supabase = createClient();

  const selectedDeptId = watch("departmentId");

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      const { data } = await supabase.from("departments").select("*").eq("is_active", true).order("name");
      if (data) setDepartments(data as Department[]);
      setLoadingDepts(false);
    }
    fetchDepartments();
  }, [supabase]);

  // Fetch categories when department changes
  useEffect(() => {
    if (!selectedDeptId) {
      setCategories([]);
      return;
    }
    async function fetchCategories() {
      setLoadingCats(true);
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("department_id", selectedDeptId)
        .eq("is_active", true)
        .order("name");
      if (data) setCategories(data as Category[]);
      setLoadingCats(false);
    }
    fetchCategories();
  }, [selectedDeptId, supabase]);

  // Reset category if department changes
  useEffect(() => {
    // Only reset if the current category doesn't belong to the new department
    if (categories.length > 0) {
      const currentCat = watch("categoryId");
      if (currentCat && !categories.find(c => c.id === currentCat)) {
        setValue("categoryId", "");
      }
    }
  }, [categories, setValue, watch]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Where should we send this?</h2>
        <p className="text-text-secondary text-sm mt-1">Select the appropriate department and location.</p>
      </div>

      <div className="space-y-5 bg-surface p-6 rounded-xl border border-border">
        {/* Department Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">Department</label>
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <PopupSelect
                options={departments.map((dept) => ({ value: dept.id, label: dept.name, description: dept.description }))}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={loadingDepts ? "Loading departments..." : "Select a department"}
                disabled={loadingDepts}
                error={!!errors.departmentId}
              />
            )}
          />
          {errors.departmentId && <p className="text-xs text-error font-medium">{errors.departmentId.message}</p>}
        </div>

        {/* Category Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">Category</label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <PopupSelect
                options={categories.map((cat) => ({ value: cat.id, label: cat.name, description: cat.description }))}
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={
                  !selectedDeptId
                    ? "Select a department first"
                    : loadingCats
                    ? "Loading categories..."
                    : "Select a category"
                }
                disabled={!selectedDeptId || loadingCats}
                error={!!errors.categoryId}
              />
            )}
          />
          {errors.categoryId && <p className="text-xs text-error font-medium">{errors.categoryId.message}</p>}
        </div>

        <div className="pt-2">
          <StateDistrictSelect stateFieldName="state" districtFieldName="district" />
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <LocationPicker />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <AuthButton type="button" variant="ghost" onClick={onPrev} className="w-auto px-6">
          Back
        </AuthButton>
        <AuthButton type="button" onClick={() => onNext()} className="w-auto px-8">
          Next Step
        </AuthButton>
      </div>
    </div>
  );
}
