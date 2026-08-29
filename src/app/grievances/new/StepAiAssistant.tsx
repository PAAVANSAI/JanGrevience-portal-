"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import type { GrievanceFormData } from "@/lib/validations/grievance";
import type { AiClassificationSuggestion } from "@/types/ai";
import { createClient } from "@/lib/supabase/client";
import AuthInput from "@/components/auth/AuthInput";
import StateDistrictSelect from "@/components/ui/StateDistrictSelect";

interface StepAiAssistantProps {
  onAccept: () => void;
  onModify: () => void;
  description: string;
}

export default function StepAiAssistant({ onAccept, onModify, description }: StepAiAssistantProps) {
  const { setValue, register, trigger, formState: { errors } } = useFormContext<GrievanceFormData>();
  const [isLoading, setIsLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<AiClassificationSuggestion | null>(null);
  const [error, setError] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let isMounted = true;
    
    async function fetchClassification() {
      try {
        const res = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });

        if (!res.ok) {
          throw new Error("Failed to get AI classification.");
        }

        const data = await res.json();
        
        // Check if the API returned an error response (status 200 but with error field)
        if (data.error || !data.suggestedDepartmentId) {
          throw new Error(data.reasoning || data.error || "AI could not classify this grievance.");
        }

        const suggestion: AiClassificationSuggestion = data;
        
        if (isMounted) {
          setSuggestion(suggestion);
          
          // Pre-fill the form so if they modify, it's already there
          if (suggestion.suggestedDepartmentId) setValue("departmentId", suggestion.suggestedDepartmentId);
          if (suggestion.suggestedCategoryId) setValue("categoryId", suggestion.suggestedCategoryId);

          // Fetch names for display
          if (suggestion.suggestedDepartmentId) {
            const { data: d } = await supabase.from("departments").select("name").eq("id", suggestion.suggestedDepartmentId).single();
            if (d) setDepartmentName(d.name);
          }
          if (suggestion.suggestedCategoryId) {
            const { data: c } = await supabase.from("categories").select("name").eq("id", suggestion.suggestedCategoryId).single();
            if (c) setCategoryName(c.name);
          }

          // Log the classification to DB
          try {
            const { data: authData } = await supabase.auth.getUser();
            if (authData.user) {
              const { data: loggedRec } = await supabase.from("grievance_ai_classifications").insert({
                citizen_id: authData.user.id,
                input_text: description,
                suggested_department_id: suggestion.suggestedDepartmentId,
                suggested_category_id: suggestion.suggestedCategoryId,
                suggested_priority: suggestion.suggestedPriority,
                confidence: suggestion.confidence,
                reasoning: suggestion.reasoning,
                was_accepted: false, // Updated later upon submission
              }).select("id").single();
              
              if (loggedRec) {
                setValue("aiClassificationId", loggedRec.id);
              }
            }
          } catch (logErr) {
            console.error("Failed to log AI classification", logErr);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "An error occurred during AI analysis.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchClassification();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, setValue]);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 shadow-sm text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="mx-auto w-16 h-16 bg-blue-50 text-blue rounded-full flex items-center justify-center mb-6"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Analyzing your issue...</h2>
        <p className="text-sm text-text-secondary">Our AI is determining the best department for your grievance.</p>
      </div>
    );
  }

  if (error || !suggestion || !suggestion.suggestedDepartmentId) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm text-center">
        <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">We need your help</h2>
        <p className="text-sm text-text-secondary mb-6">
          We couldn't confidently classify your issue automatically. Please select the category manually.
        </p>
        <button
          type="button"
          onClick={onModify}
          className="px-6 py-2.5 bg-blue text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-hover"
        >
          Continue to Manual Selection
        </button>
      </div>
    );
  }

  const handleAccept = async () => {
    const isValid = await trigger(["state", "district"]);
    if (isValid) {
      onAccept();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">AI Suggestion</h2>
        <p className="text-sm text-text-secondary">We've identified the appropriate routing for your issue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-xl bg-bg">
          <p className="text-xs font-semibold text-text-muted uppercase mb-1">Department</p>
          <p className="text-base font-medium text-text-primary">{departmentName || "Loading..."}</p>
        </div>
        <div className="p-4 border border-border rounded-xl bg-bg">
          <p className="text-xs font-semibold text-text-muted uppercase mb-1">Category</p>
          <p className="text-base font-medium text-text-primary">{categoryName || "Loading..."}</p>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-blue-800 uppercase mb-2">Why this suggestion?</h3>
        <p className="text-sm text-blue-900 leading-relaxed">{suggestion.reasoning}</p>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Please provide location details to continue:</h3>
        <StateDistrictSelect stateFieldName="state" districtFieldName="district" />
      </div>

      <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={onModify}
          className="px-5 py-2.5 bg-surface text-text-primary text-sm font-semibold rounded-md border border-border shadow-sm hover:bg-bg"
        >
          Change Manually
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="px-5 py-2.5 bg-blue text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-hover"
        >
          Accept & Continue
        </button>
      </div>
    </motion.div>
  );
}
