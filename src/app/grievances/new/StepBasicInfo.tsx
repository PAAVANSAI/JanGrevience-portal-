"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import type { GrievanceFormData } from "@/lib/validations/grievance";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

interface Props {
  onNext: (useAi: boolean) => void;
}

export default function StepBasicInfo({ onNext }: Props) {
  const { register, formState: { errors } } = useFormContext<GrievanceFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">What happened?</h2>
        <p className="text-text-secondary text-sm mt-1">Provide a brief summary and a detailed description of your grievance.</p>
      </div>

      <div className="space-y-5 bg-surface p-6 rounded-xl border border-border">
        <AuthInput
          label="Subject"
          placeholder="E.g., No water supply in Sector 4"
          error={errors.subject?.message}
          {...register("subject")}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            rows={5}
            placeholder="Tell us what happened in detail..."
            className={`w-full px-4 py-2.5 bg-bg border rounded-[var(--radius-md)] text-text-primary text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue/20 placeholder:text-text-muted resize-none
              ${errors.description ? 'border-error focus:border-error' : 'border-border focus:border-blue'}`}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-error font-medium">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => onNext(false)}
          className="px-6 py-2.5 bg-surface text-text-primary text-sm font-semibold rounded-md border border-border shadow-sm hover:bg-bg transition-colors"
        >
          Manual Selection
        </button>
        <button
          type="button"
          onClick={() => onNext(true)}
          className="px-6 py-2.5 bg-blue text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-hover transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Suggest Classification with AI
        </button>
      </div>
    </div>
  );
}
