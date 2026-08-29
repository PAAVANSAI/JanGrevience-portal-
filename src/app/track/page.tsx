"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import FormAlert from "@/components/auth/FormAlert";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { trackGuestGrievance } from "@/app/actions/track";
import GrievanceDetailView from "@/components/grievance/GrievanceDetailView";
import Link from "next/link";

export default function TrackGrievancePage() {
  const [grievanceId, setGrievanceId] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGuest, setIsGuest] = useState(true);
  
  const [trackingResult, setTrackingResult] = useState<any>(null);
  
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();
  const supabase = createClient();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsGuest(!data.session);
    });
    
    if (isDev) {
      setCaptchaToken("dummy-token-dev");
    }
  }, [supabase.auth, isDev]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceId.trim()) return;

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Authenticated flow
        const { data, error: fetchError } = await supabase
          .from("grievances")
          .select("id")
          .eq("grievance_number", grievanceId.trim().toUpperCase())
          .eq("citizen_id", user.id)
          .single();

        if (fetchError || !data) {
          throw new Error("We couldn't find a grievance with that ID linked to your account. Please check the ID and try again.");
        }

        router.push(`/grievances/${data.id}`);
        return;
      }

      // Guest flow
      if (!contactInfo.trim() || !captchaToken) {
        throw new Error("Please provide your email/mobile and complete the security check.");
      }

      const res = await trackGuestGrievance(grievanceId, contactInfo, captchaToken);
      if (!res.success) {
        throw new Error(res.error || "Verification failed");
      }

      setTrackingResult(res.data);
    } catch (err: any) {
      setError(err.message);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
        setCaptchaToken("");
      }
    } finally {
      setLoading(false);
    }
  };

  if (trackingResult) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 -mb-8">
          <button 
            onClick={() => setTrackingResult(null)}
            className="inline-flex items-center text-sm font-medium text-text-muted hover:text-blue transition-colors mb-2"
          >
            <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Search
          </button>
        </main>

        <GrievanceDetailView 
          grievance={trackingResult.grievance}
          attachmentsWithUrls={trackingResult.attachments || []}
          combinedHistory={[...(trackingResult.history || []), ...(trackingResult.appealHistory || [])]}
          comments={trackingResult.comments || []}
          appeal={trackingResult.appeal}
          hasFeedback={!!trackingResult.feedback}
          isGuest={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Track Grievance
            </h1>
            <p className="text-sm text-text-secondary mt-2">
              Enter your Grievance ID to check its current status.
            </p>
          </div>

          <div className="bg-surface border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
            {error && (
              <div className="mb-6">
                <FormAlert variant="error" message={error} />
              </div>
            )}
            
            <form onSubmit={handleTrack} className="space-y-6">
              <AuthInput
                label="Grievance ID"
                placeholder="E.g., GRV-2026-000001"
                value={grievanceId}
                onChange={(e) => setGrievanceId(e.target.value)}
                autoComplete="off"
                required
              />
              
              {isGuest && (
                <>
                  <AuthInput
                    label="Email or Mobile Number"
                    placeholder="Enter the email/mobile used to file"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  
                  {!isDev && (
                    <div className="flex justify-center my-4 min-h-[65px]">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={siteKey}
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setError("");
                        }}
                        onError={() => setError("Security check failed. Please try again.")}
                        onExpire={() => {
                          setCaptchaToken("");
                          setError("Security check expired. Please try again.");
                        }}
                        options={{
                          theme: "light",
                          size: "normal",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
              
              <AuthButton type="submit" loading={loading} loadingText="Searching…">
                Track Status
              </AuthButton>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
