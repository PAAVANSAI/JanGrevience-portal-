"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { GrievanceFormData } from "@/lib/validations/grievance";
import type { Department, Category } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";

interface Props {
  onEditStep: (stepIndex: number) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  error?: string;
}

export default function StepReview({ onEditStep, onSubmit, onPrev, isSubmitting, error }: Props) {
  const { getValues, formState } = useFormContext<GrievanceFormData>();
  const values = getValues();
  const [deptName, setDeptName] = useState("Loading...");
  const [catName, setCatName] = useState("Loading...");
  const supabase = createClient();

  useEffect(() => {
    async function fetchNames() {
      if (values.departmentId) {
        const { data } = await supabase.from("departments").select("name").eq("id", values.departmentId).single();
        if (data) setDeptName(data.name);
      }
      if (values.categoryId) {
        const { data } = await supabase.from("categories").select("name").eq("id", values.categoryId).single();
        if (data) setCatName(data.name);
      }
    }
    fetchNames();
  }, [values.departmentId, values.categoryId, supabase]);

  const ReviewSection = ({ title, stepIndex, children }: { title: string, stepIndex: number, children: React.ReactNode }) => (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-bg border-b border-border">
        <h3 className="font-semibold text-sm text-text-primary uppercase tracking-wide">{title}</h3>
        <button 
          onClick={() => onEditStep(stepIndex)}
          disabled={isSubmitting}
          className="text-xs font-medium text-blue hover:text-blue-hover transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="p-5 text-sm space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Review & Submit</h2>
        <p className="text-text-secondary text-sm mt-1">Please review your grievance details before sending.</p>
      </div>

      <div className="space-y-4">
        {error && <FormAlert variant="error" message={error} />}
        {Object.keys(formState.errors).length > 0 && (
          <FormAlert variant="error" message={`Validation failed for: ${Object.keys(formState.errors).join(", ")}`} />
        )}
      </div>

      <div className="space-y-4">
        <ReviewSection title="Basic Info" stepIndex={0}>
          <div>
            <span className="block text-xs font-medium text-text-muted mb-1">Subject</span>
            <span className="text-text-primary font-medium">{values.subject}</span>
          </div>
          <div>
            <span className="block text-xs font-medium text-text-muted mb-1">Description</span>
            <span className="text-text-primary whitespace-pre-wrap">{values.description}</span>
          </div>
        </ReviewSection>

        <ReviewSection title="Classification" stepIndex={1}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">Department</span>
              <span className="text-text-primary">{deptName}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">Category</span>
              <span className="text-text-primary">{catName}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">State</span>
              <span className="text-text-primary">{values.state}</span>
            </div>
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">District</span>
              <span className="text-text-primary">{values.district}</span>
            </div>
          </div>
        </ReviewSection>

        <ReviewSection title="Documents" stepIndex={2}>
          {values.attachments && values.attachments.length > 0 ? (
            <ul className="space-y-2">
              {values.attachments.map((file, idx) => (
                <li key={idx} className="flex items-center gap-2 text-text-primary">
                  <svg className="text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  <span className="truncate">{file.fileName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-text-muted italic">No documents attached</span>
          )}
        </ReviewSection>
      </div>

      <div className="flex justify-between pt-4">
        <AuthButton type="button" variant="ghost" onClick={onPrev} className="w-auto px-6" disabled={isSubmitting}>
          Back
        </AuthButton>
        <AuthButton type="button" onClick={onSubmit} className="w-auto px-8" loading={isSubmitting} loadingText="Submitting…">
          Submit Grievance
        </AuthButton>
      </div>
    </div>
  );
}
