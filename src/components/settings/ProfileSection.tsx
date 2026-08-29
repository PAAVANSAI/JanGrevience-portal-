"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile";
import { useUserRole } from "@/lib/context/UserContext";
import Header from "@/components/layout/Header";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { motion, AnimatePresence } from "framer-motion";
import StateDistrictSelect from "@/components/ui/StateDistrictSelect";
import type { State, District } from "@/types/database";

export default function ProfileSection() {
  const { profile, isLoading, refreshProfile } = useUserRole();
  const [isEditing, setIsEditing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stateName, setStateName] = useState<string>("");
  const [districtName, setDistrictName] = useState<string>("");
  const supabase = createClient();

  React.useEffect(() => {
    async function fetchLocationNames() {
      if (profile?.state_id) {
        const { data: stateData } = await supabase.from("states").select("name").eq("id", profile.state_id).single();
        if (stateData) setStateName(stateData.name);
      }
      if (profile?.district_id) {
        const { data: distData } = await supabase.from("districts").select("name").eq("id", profile.district_id).single();
        if (distData) setDistrictName(distData.name);
      }
    }
    fetchLocationNames();
  }, [profile?.state_id, profile?.district_id, supabase]);

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.full_name || "",
      gender: (profile?.gender as any) || undefined,
      phone: profile?.phone || "",
      landlinePhone: profile?.landline_phone || "",
      addressLine: profile?.address_line || "",
      subLocality: profile?.sub_locality || "",
      country: profile?.country || "India",
      stateId: profile?.state_id || "",
      districtId: profile?.district_id || "",
      pincode: profile?.pincode || "",
    },
  });
  
  const { register, handleSubmit, formState: { errors } } = methods;

  const onSubmit = async (data: ProfileFormData) => {
    setApiError("");
    setSaveSuccess(false);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          gender: data.gender,
          phone: data.phone,
          landline_phone: data.landlinePhone || null,
          address_line: data.addressLine,
          sub_locality: data.subLocality || null,
          country: data.country,
          state_id: data.stateId,
          district_id: data.districtId,
          pincode: data.pincode || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        setApiError(error.message);
        return;
      }

      await refreshProfile();
      setSaveSuccess(true);
      setIsEditing(false);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-text-muted">Loading profile...</div>
          ) : (
            <div className="p-6">
              {saveSuccess && !isEditing && (
                <div className="mb-6">
                  <FormAlert variant="success" message="Profile updated successfully!" />
                </div>
              )}
              {apiError && (
                <div className="mb-6">
                  <FormAlert variant="error" message={apiError} />
                </div>
              )}

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className=""
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border py-3">
                      <div className="text-sm font-medium text-text-secondary">Full Name</div>
                      <div className="sm:col-span-2 text-sm text-text-primary font-medium">{profile?.full_name || "—"}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border py-3">
                      <div className="text-sm font-medium text-text-secondary">Gender</div>
                      <div className="sm:col-span-2 text-sm text-text-primary font-medium">{profile?.gender || "—"}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border py-3">
                      <div className="text-sm font-medium text-text-secondary">Phone Number</div>
                      <div className="sm:col-span-2 text-sm text-text-primary font-medium">{profile?.phone || "—"}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border py-3">
                      <div className="text-sm font-medium text-text-secondary">Address</div>
                      <div className="sm:col-span-2 text-sm text-text-primary font-medium">
                        {profile?.address_line ? (
                          <>
                            {profile.address_line}
                            {profile.sub_locality && <>, {profile.sub_locality}</>}
                            <br />
                            {districtName && `${districtName}, `}{stateName && `${stateName} `}
                            {profile.pincode && `- ${profile.pincode}`}
                            <br />
                            {profile.country}
                          </>
                        ) : "—"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border py-3">
                      <div className="text-sm font-medium text-text-secondary">Role</div>
                      <div className="sm:col-span-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue border border-blue-light">
                          {profile?.role || "UNKNOWN"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <AuthButton variant="secondary" onClick={() => setIsEditing(true)} className="w-auto px-6">
                        Edit Profile
                      </AuthButton>
                    </div>
                  </motion.div>
                ) : (
                  <FormProvider {...methods}>
                    <form
                      key="edit"
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-5"
                      noValidate
                    >
                      <AuthInput
                        label="Full name *"
                        placeholder="Enter your full name"
                        error={errors.fullName?.message}
                        {...register("fullName")}
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                          Gender *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {["Male", "Female", "Transgender"].map((gender) => (
                            <label 
                              key={gender} 
                              className="flex items-center justify-center p-3 border border-border rounded-[var(--radius-md)] cursor-pointer hover:bg-surface transition-colors has-[:checked]:border-blue has-[:checked]:bg-blue/5"
                            >
                              <input
                                type="radio"
                                value={gender}
                                className="sr-only"
                                {...register("gender")}
                              />
                              <span className="text-sm font-medium text-text-primary">{gender}</span>
                            </label>
                          ))}
                        </div>
                        {errors.gender && <p className="text-xs text-error font-medium">{errors.gender.message}</p>}
                      </div>

                      <AuthInput
                        label="Mobile Number *"
                        placeholder="10-digit number"
                        error={errors.phone?.message}
                        {...register("phone")}
                      />

                      <AuthInput
                        label="Address Line *"
                        placeholder="Flat, Building"
                        error={errors.addressLine?.message}
                        {...register("addressLine")}
                      />

                      <StateDistrictSelect />

                      <div className="pt-4 flex gap-3 justify-end">
                        <AuthButton 
                          type="button" 
                          variant="ghost" 
                          className="w-auto px-6"
                          onClick={() => setIsEditing(false)}
                          disabled={saving}
                        >
                          Cancel
                        </AuthButton>
                        <AuthButton 
                          type="submit" 
                          variant="primary" 
                          className="w-auto px-6"
                          loading={saving} 
                          loadingText="Saving…"
                        >
                          Save Changes
                        </AuthButton>
                      </div>
                    </form>
                  </FormProvider>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
    </>
  );
}
