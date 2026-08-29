"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
      });

      if (error) {
        setApiError("Something went wrong. Please try again.");
        return;
      }

      // Always show success — never reveal whether email exists
      setSentEmail(data.email);
      setEmailSent(true);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {emailSent ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AuthCard
            title="Check your email"
            subtitle="Password reset instructions have been sent"
          >
            <div className="space-y-5">
              {/* Email icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="flex justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-success"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </motion.div>

              <p className="text-sm text-text-secondary text-center leading-relaxed">
                If an account exists for{" "}
                <span className="font-medium text-text-primary">
                  {sentEmail}
                </span>
                , we&apos;ve sent a password reset link. It expires in 1 hour.
              </p>

              <Link href="/login">
                <AuthButton variant="primary" type="button">
                  Back to Sign In
                </AuthButton>
              </Link>
            </div>
          </AuthCard>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <AuthCard
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a link to reset it"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {apiError && <FormAlert variant="error" message={apiError} />}

              <AuthInput
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                icon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="pt-2">
                <AuthButton
                  type="submit"
                  loading={loading}
                  loadingText="Sending…"
                >
                  Send Reset Link
                </AuthButton>
              </div>

              <p className="text-center text-sm text-text-secondary">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue hover:text-blue-hover transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </AuthCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
