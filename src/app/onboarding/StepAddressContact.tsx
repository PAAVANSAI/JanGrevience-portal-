"use client";

import React, { useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { OnboardingFormData } from "@/lib/validations/profile";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import StateDistrictSelect from "@/components/ui/StateDistrictSelect";

interface Props {
  onPrev: () => void;
  loading: boolean;
}

export default function StepAddressContact({ onPrev, loading }: Props) {
  const { register, setValue, formState: { errors } } = useFormContext<OnboardingFormData>();
  const turnstileRef = useRef<TurnstileInstance>(null);

  // You can pass the site key from env. Defaulting to dummy key for testing if not set.
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      setValue("captchaToken", "dummy-token-dev", { shouldValidate: true });
    }
  }, [isDev, setValue]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        
        {/* Address Fields */}
        <AuthInput
          label="Address Line (Premise/Name) *"
          placeholder="E.g. Flat 101, Building A"
          error={errors.addressLine?.message}
          {...register("addressLine")}
        />

        <AuthInput
          label="Locality / Sub-locality (Optional)"
          placeholder="E.g. Sector 4, Kothrud"
          error={errors.subLocality?.message}
          {...register("subLocality")}
        />

        {/* State and District */}
        <StateDistrictSelect stateFieldName="stateId" districtFieldName="districtId" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AuthInput
            label="Pincode (Optional)"
            placeholder="6-digit pincode"
            error={errors.pincode?.message}
            {...register("pincode")}
          />
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Country *</label>
            <div className="relative">
              <select
                className={`w-full px-4 py-2.5 bg-bg border border-border rounded-[var(--radius-md)] text-text-primary text-sm focus:outline-none appearance-none`}
                {...register("country")}
              >
                <option value="India">India</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <AuthInput
            label="Mobile Number *"
            placeholder="10-digit number"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <AuthInput
            label="Landline (Optional)"
            placeholder="With STD code"
            error={errors.landlinePhone?.message}
            {...register("landlinePhone")}
          />
        </div>
      </div>

      {/* Captcha */}
      {!isDev && (
        <div className="pt-2 flex flex-col items-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => setValue("captchaToken", token, { shouldValidate: true })}
            onError={() => setValue("captchaToken", "", { shouldValidate: true })}
            onExpire={() => setValue("captchaToken", "", { shouldValidate: true })}
          />
          {errors.captchaToken && (
            <p className="text-xs text-error font-medium mt-2">{errors.captchaToken.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <AuthButton type="button" variant="ghost" onClick={onPrev} className="w-auto px-6">
          Back
        </AuthButton>
        <AuthButton type="submit" loading={loading} loadingText="Saving…" className="w-auto px-8">
          Complete Profile
        </AuthButton>
      </div>
    </div>
  );
}
