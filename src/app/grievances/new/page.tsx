"use client";

import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { grievanceFormSchema, type GrievanceFormData } from "@/lib/validations/grievance";
import Header from "@/components/layout/Header";

import StepBasicInfo from "./StepBasicInfo";
import StepClassification from "./StepClassification";
import StepDocuments from "./StepDocuments";
import StepReview from "./StepReview";
import StepAiAssistant from "./StepAiAssistant";

const STEPS = ["Basic Info", "Classification", "Documents", "Review"];

export default function NewGrievancePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const methods = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceFormSchema),
    mode: "onTouched",
    defaultValues: {
      subject: "",
      description: "",
      departmentId: "",
      categoryId: "",
      state: "",
      district: "",
      attachments: [],
      priority: "MEDIUM",
    },
  });

  React.useEffect(() => {
    async function checkMaintenance() {
      const { data } = await supabase.from("system_settings").select("value").eq("key", "maintenance_mode").single();
      if (data && (data.value === "true" || data.value === true)) {
        setIsMaintenanceMode(true);
      } else {
        setIsMaintenanceMode(false);
      }
    }
    checkMaintenance();
  }, [supabase]);

  // Scroll to top whenever the step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const nextStep0 = async (useAi: boolean) => {
    const isStepValid = await methods.trigger(["subject", "description"]);
    if (isStepValid) {
      if (useAi) {
        setCurrentStep(0.5);
      } else {
        setCurrentStep(1);
      }
    }
  };

  const nextStep = async (stepFields: (keyof GrievanceFormData)[]) => {
    const isStepValid = await methods.trigger(stepFields);
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(Math.floor(prev) + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => {
      if (prev === 0.5) return 0;
      return Math.max(Math.floor(prev) - 1, 0);
    });
  };

  const onSubmit = async (data: GrievanceFormData) => {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // Insert Grievance
      const { data: grievanceData, error: grievanceError } = await supabase
        .from("grievances")
        .insert({
          citizen_id: user.id,
          subject: data.subject,
          description: data.description,
          department_id: data.departmentId,
          category_id: data.categoryId,
          state: data.state,
          district: data.district,
          priority: data.priority,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        })
        .select()
        .single();

      if (grievanceError) {
        console.error("Grievance insert error:", grievanceError);
        throw grievanceError;
      }

      if (data.aiClassificationId) {
        // Link the classification log to the new grievance
        await supabase.from("grievance_ai_classifications").update({
          grievance_id: grievanceData.id,
          was_accepted: true,
        }).eq("id", data.aiClassificationId);
      }

      // Insert Attachments if any
      if (data.attachments.length > 0) {
        const attachmentInserts = data.attachments.map((file) => ({
          grievance_id: grievanceData.id,
          file_name: file.fileName,
          file_path: file.filePath,
          file_type: file.fileType,
          file_size: file.fileSize,
        }));

        const { error: attachmentError } = await supabase
          .from("grievance_attachments")
          .insert(attachmentInserts);

        if (attachmentError) {
          console.error("Attachment insert error:", attachmentError);
          throw attachmentError;
        }
      }

      // Redirect to confirmation
      router.push(`/grievances/${grievanceData.id}/confirmation`);
    } catch (err: any) {
      console.error("Submit error details:", err);
      // Try to extract a useful message from the Supabase error object
      let errorMsg = err.message || "Failed to submit grievance. Please try again.";
      if (err.details) errorMsg += ` (${err.details})`;
      if (err.hint) errorMsg += ` Hint: ${err.hint}`;
      
      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0.5) {
      return (
        <StepAiAssistant
          description={methods.getValues("description")}
          onAccept={() => setCurrentStep(2)}
          onModify={() => setCurrentStep(1)}
        />
      );
    }

    switch (Math.floor(currentStep)) {
      case 0:
        return <StepBasicInfo onNext={nextStep0} />;
      case 1:
        return <StepClassification onNext={() => nextStep(["departmentId", "categoryId", "state", "district"])} onPrev={prevStep} />;
      case 2:
        // Attachments are optional in schema, so no specific fields required to validate except the array max length
        return <StepDocuments onNext={() => nextStep(["attachments"])} onPrev={prevStep} />;
      case 3:
        return (
          <StepReview 
            onEditStep={(stepIndex) => setCurrentStep(stepIndex)} 
            onSubmit={methods.handleSubmit(onSubmit)} 
            onPrev={prevStep} 
            isSubmitting={isSubmitting} 
            error={submitError} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {isMaintenanceMode === null ? (
          <div className="p-8 text-center text-text-muted mt-20">Checking system status...</div>
        ) : isMaintenanceMode ? (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-error/10 border border-error/20 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-error mb-4">Under Maintenance</h2>
            <p className="text-text-secondary">
              The grievance submission system is currently undergoing scheduled maintenance. Please check back later.
            </p>
            <button onClick={() => router.push("/")} className="mt-6 px-6 py-2 bg-bg text-text-primary border border-border rounded-lg hover:bg-surface transition-colors">
              Return Home
            </button>
          </div>
        ) : (
          <>
            {/* Step Indicator */}
        <div className="bg-surface border-b border-border py-4 px-4 sticky top-16 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${Math.floor(currentStep) > index ? 'bg-blue text-white' : Math.floor(currentStep) === index ? 'bg-blue-50 text-blue border-2 border-blue' : 'bg-bg text-text-muted border border-border'}`}
                >
                  {Math.floor(currentStep) > index ? "✓" : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-1 mx-2 rounded transition-colors ${Math.floor(currentStep) > index ? 'bg-blue' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto mt-2 text-center text-sm font-medium text-text-secondary">
            Step {Math.floor(currentStep) + 1} of {STEPS.length}: <span className="text-text-primary">{STEPS[Math.floor(currentStep)]}</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
          <FormProvider {...methods}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </FormProvider>
        </div>
        </>
        )}
      </main>
    </div>
  );
}
