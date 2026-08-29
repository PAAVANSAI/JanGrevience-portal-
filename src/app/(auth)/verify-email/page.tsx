"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { motion } from "framer-motion";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const supabase = createClient();

  const handleResend = async () => {
    setResendLoading(true);
    setResendStatus("idle");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) {
        setResendStatus("error");
      } else {
        setResendStatus("success");
      }
    } catch {
      setResendStatus("error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthCard
      title="Check your email"
      subtitle="We need to verify your email address"
    >
      <div className="space-y-5">
        {/* Email icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, type: "spring" }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <p className="text-sm text-text-secondary leading-relaxed">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-text-primary">{email}</span>.
            Click the link in the email to activate your account.
          </p>
        </div>

        {resendStatus === "success" && (
          <FormAlert
            variant="success"
            message="Verification email sent! Check your inbox."
          />
        )}

        {resendStatus === "error" && (
          <FormAlert
            variant="error"
            message="Couldn't resend the email. Please try again in a moment."
          />
        )}

        <div className="text-center">
          <p className="text-xs text-text-muted mb-3">
            Didn&apos;t receive the email? Check your spam folder or
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm font-medium text-blue hover:text-blue-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
        </div>

        <div className="pt-2">
          <Link href="/login">
            <AuthButton variant="secondary" type="button">
              Back to Sign In
            </AuthButton>
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Check your email" subtitle="Loading...">
          <div />
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
