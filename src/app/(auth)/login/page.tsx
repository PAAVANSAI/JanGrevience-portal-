"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";

function LoginContent() {
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const authCodeError = searchParams.get("error") === "auth-code-error";
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login")) {
          setApiError("Invalid email or password. Please try again.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setApiError(
            "Your email hasn't been verified yet. Please check your inbox for the verification link."
          );
        } else if (error.message.toLowerCase().includes("too many requests")) {
          setApiError(
            "Too many attempts. Please wait a moment and try again."
          );
        } else {
          setApiError(error.message);
        }
        return;
      }

      // Check if user is deleted
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_deleted")
          .eq("id", user.id)
          .single();

        if (profile?.is_deleted) {
          await supabase.auth.signOut();
          setApiError("This account has been deleted.");
          return;
        }

        // Track login activity
        try {
          // Attempt to get IP if possible, else null. For now we just store userAgent.
          await supabase.from("login_activity").insert({
            user_id: user.id,
            device_info: navigator.userAgent
          });
        } catch (e) {
          console.error("Failed to log activity", e);
        }
      }

      // Determine the correct dashboard based on role
      const { data: roleProfile } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", user.id)
        .single();

      let dashboardPath = "/citizen";
      if (!roleProfile || !roleProfile.full_name || !roleProfile.phone) {
        dashboardPath = "/onboarding";
      } else if (roleProfile.role === "OFFICER") {
        dashboardPath = "/officer";
      } else if (roleProfile.role === "DEPT_ADMIN") {
        dashboardPath = "/department-admin";
      } else if (roleProfile.role === "SUPER_ADMIN") {
        dashboardPath = "/admin";
      }

      router.push(dashboardPath);
      router.refresh();
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
    >
      {/* App Feature Highlights */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-3 text-center">Why citizens love JanGrievance</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "✨", label: "Simple & Easy UI", desc: "File in under 2 min" },
            { icon: "📱", label: "Mobile Friendly", desc: "Works on any device" },
            { icon: "🤖", label: "AI-Powered", desc: "Smart dept routing" },
            { icon: "📍", label: "Live Tracking", desc: "Real-time updates" },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-2 p-2 bg-white/70 rounded-lg">
              <span className="text-base leading-none mt-0.5">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-text-primary leading-tight">{f.label}</p>
                <p className="text-[10px] text-text-secondary leading-tight mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {verified && (
          <FormAlert
            variant="success"
            message="Your email has been verified! You can now sign in."
          />
        )}

        {authCodeError && (
          <FormAlert
            variant="error"
            message="The link was invalid or expired. (Note: some email apps auto-click links to scan them. If you just clicked it, you might already be verified—try signing in!)"
          />
        )}

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

        <div>
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-blue hover:text-blue-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={loading} loadingText="Signing in…">
            Sign In
          </AuthButton>
        </div>

        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-blue hover:text-blue-hover transition-colors"
          >
            Create one
          </Link>
        </p>
      </form>

      <div className="mt-8 border-t border-border/50 pt-6">
        <h3 className="text-sm font-semibold text-text mb-3">Test Accounts</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { role: "Citizen", email: "citizen@test.com" },
            { role: "Officer", email: "officer@test.com" },
            { role: "Dept Admin", email: "deptadmin@test.com" },
            { role: "Super Admin", email: "superadmin@test.com" },
          ].map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={() => {
                setValue("email", acc.email);
                setValue("password", "password123");
                handleSubmit(onSubmit)();
              }}
              className="flex flex-col items-start p-2 rounded border border-border bg-surface-hover hover:border-blue/50 hover:bg-blue/5 transition-colors"
            >
              <span className="font-medium text-text">{acc.role}</span>
              <span className="text-text-secondary truncate w-full text-left">{acc.email}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-tertiary mt-2 text-center">
          Click an account to instantly sign in
        </p>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Welcome back" subtitle="Loading...">
          <div />
        </AuthCard>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
