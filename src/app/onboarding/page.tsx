"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/lib/context/UserContext";
import { completeOnboarding } from "@/app/actions/onboarding";
import { onboardingSchema, type OnboardingFormData, stepIdentitySchema } from "@/lib/validations/profile";
import AuthCard from "@/components/auth/AuthCard";
import FormAlert from "@/components/auth/FormAlert";

import StepIdentity from "./StepIdentity";
import StepAddressContact from "./StepAddressContact";

const STEPS = [
  { id: "identity", title: "Identity", subtitle: "Tell us a bit about yourself" },
  { id: "contact", title: "Address & Contact", subtitle: "Where can we reach you?" }
];

export default function OnboardingPage() {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for forward, -1 for backward
  
  const router = useRouter();
  const { profile, refreshProfile } = useUserRole();

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      country: "India",
      captchaToken: "",
    },
  });

  const { handleSubmit, setValue, trigger } = methods;

  // Pre-fill full name if it exists from registration
  useEffect(() => {
    if (profile?.full_name) {
      setValue("fullName", profile.full_name);
    }
    if (profile?.phone) {
      setValue("phone", profile.phone);
    }
  }, [profile, setValue]);

  const handleNext = async () => {
    let isStepValid = false;
    
    if (currentStep === 0) {
      isStepValid = await trigger(["fullName", "gender"]);
    }
    
    if (isStepValid) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setApiError("");
    setLoading(true);

    try {
      const result = await completeOnboarding(data);

      if (!result.success) {
        setApiError(result.error || "Something went wrong.");
        return;
      }

      await refreshProfile();
      router.push("/");
      router.refresh();
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-bg py-12">
      <div className="w-full max-w-2xl">
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      index <= currentStep
                        ? "bg-blue text-white"
                        : "bg-surface border-2 border-border text-text-muted"
                    }`}
                  >
                    {index < currentStep ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${index <= currentStep ? "text-text-primary" : "text-text-muted"}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 h-1 mb-6 rounded-full transition-colors ${index < currentStep ? "bg-blue" : "bg-border"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <AuthCard
          title={STEPS[currentStep].title}
          subtitle={STEPS[currentStep].subtitle}
        >
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 overflow-hidden relative"
              noValidate
            >
              {apiError && <FormAlert variant="error" message={apiError} />}

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-full"
                >
                  {currentStep === 0 && <StepIdentity onNext={handleNext} />}
                  {currentStep === 1 && <StepAddressContact onPrev={handlePrev} loading={loading} />}
                </motion.div>
              </AnimatePresence>
            </form>
          </FormProvider>
        </AuthCard>
      </div>
    </div>
  );
}
