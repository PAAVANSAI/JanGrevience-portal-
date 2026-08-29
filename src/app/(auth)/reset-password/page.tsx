"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage() {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("same password") ||
          error.message.toLowerCase().includes("should be different")
        ) {
          setApiError(
            "Your new password must be different from your current password."
          );
        } else if (
          error.message.toLowerCase().includes("session") ||
          error.message.toLowerCase().includes("expired") ||
          error.message.toLowerCase().includes("not authenticated")
        ) {
          setApiError(
            "This reset link has expired. Please request a new one."
          );
        } else {
          setApiError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {success ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AuthCard
            title="Password updated!"
            subtitle="Your password has been changed successfully"
          >
            <div className="space-y-5">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="flex justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-success-bg flex items-center justify-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-success"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </motion.div>

              <p className="text-sm text-text-secondary text-center leading-relaxed">
                Your password has been changed. You can now sign in with your new
                password.
              </p>

              <Link href="/login">
                <AuthButton variant="primary" type="button">
                  Sign In
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
            title="Set a new password"
            subtitle="Choose a strong password for your account"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {apiError && <FormAlert variant="error" message={apiError} />}

              <PasswordInput
                label="New password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                showStrength={true}
                value={passwordValue}
                error={errors.password?.message}
                {...register("password")}
              />

              <PasswordInput
                label="Confirm new password"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <div className="pt-2">
                <AuthButton
                  type="submit"
                  loading={loading}
                  loadingText="Updating…"
                >
                  Update Password
                </AuthButton>
              </div>
            </form>
          </AuthCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
