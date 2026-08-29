"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { OnboardingFormData } from "@/lib/validations/profile";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

interface Props {
  onNext: () => void;
}

export default function StepIdentity({ onNext }: Props) {
  const { register, formState: { errors } } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <AuthInput
          label="Full name *"
          placeholder="Enter your full name"
          autoComplete="name"
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
      </div>

      <div className="pt-4">
        <AuthButton type="button" onClick={onNext} className="w-full">
          Next Step
        </AuthButton>
      </div>
    </div>
  );
}
