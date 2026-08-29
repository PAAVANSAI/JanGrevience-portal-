"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Simple in-memory rate limiting map
// Key: IP address, Value: { count: number, resetAt: number }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    // New or expired
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false; // Rate limited
  }

  record.count += 1;
  return true;
}

export async function trackGuestGrievance(grievanceId: string, contactInfo: string, captchaToken: string) {
  try {
    // 1. Check Rate Limit
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown-ip";
    
    if (!checkRateLimit(ip)) {
      return { success: false, error: "Too many attempts. Please try again later." };
    }

    if (!grievanceId || !contactInfo || !captchaToken) {
      return { success: false, error: "Missing required fields." };
    }

    // 2. Verify Captcha
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn("TURNSTILE_SECRET_KEY is not set. Skipping real captcha verification.");
    } else {
      const captchaResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `secret=${secretKey}&response=${captchaToken}`,
        }
      );
      
      const captchaResult = await captchaResponse.json();
      
      if (!captchaResult.success) {
        return { success: false, error: "Security check failed. Please try again." };
      }
    }

    // 3. Database Lookup (Bypass RLS using Service Role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase Service Role Key");
      return { success: false, error: "Internal Server Error" };
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // We use a safe generic error for any mismatch to avoid leaking IDs
    const genericError = "We couldn't verify these details — please check and try again";

    // Find the grievance
    const { data: grievance, error: grievanceError } = await adminClient
      .from("grievances")
      .select(`
        *,
        departments (name),
        categories (name, sla_rules(target_days, reminder_threshold_percent)),
        profiles!grievances_citizen_id_fkey (email, phone)
      `)
      .eq("grievance_number", grievanceId.trim().toUpperCase())
      .single();

    if (grievanceError || !grievance || !grievance.profiles) {
      return { success: false, error: genericError };
    }

    // Check if email or phone matches contactInfo (case insensitive, trim spaces)
    const cleanContact = contactInfo.trim().toLowerCase();
    const matchesEmail = grievance.profiles.email?.toLowerCase() === cleanContact;
    const matchesPhone = grievance.profiles.phone?.includes(cleanContact); // Very basic check

    if (!matchesEmail && !matchesPhone) {
      return { success: false, error: genericError };
    }

    // 4. Fetch related data (attachments, history, comments, appeal, feedback)
    // We do this in parallel
    const id = grievance.id;

    const [
      { data: attachments },
      { data: history },
      { data: comments },
      { data: appeal },
      { data: feedback }
    ] = await Promise.all([
      adminClient.from("grievance_attachments").select("*").eq("grievance_id", id).order("uploaded_at", { ascending: true }),
      adminClient.from("grievance_status_history").select("*").eq("grievance_id", id).order("created_at", { ascending: false }),
      adminClient.from("grievance_comments").select(`*, profiles!grievance_comments_author_id_fkey (full_name)`).eq("grievance_id", id).eq("is_visible_to_citizen", true).order("created_at", { ascending: true }),
      adminClient.from("appeals").select("*").eq("grievance_id", id).maybeSingle(),
      adminClient.from("feedback").select("*").eq("grievance_id", id).maybeSingle(),
    ]);

    let appealHistory = null;
    if (appeal) {
      const { data } = await adminClient.from("appeal_status_history").select("*").eq("appeal_id", appeal.id).order("created_at", { ascending: false });
      appealHistory = data;
    }

    // Generate signed URLs for attachments
    let attachmentsWithUrls = [];
    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map(a => a.file_path);
      const { data: urlData } = await adminClient.storage
        .from("grievance_attachments")
        .createSignedUrls(filePaths, 3600); // 1 hour expiry

      attachmentsWithUrls = attachments.map((a, index) => ({
        ...a,
        signedUrl: urlData?.[index]?.signedUrl || null,
      }));
    }

    // Prepare full data payload (excluding sensitive profile info of the citizen)
    delete grievance.profiles;

    const fullData = {
      grievance,
      attachments: attachmentsWithUrls,
      history,
      comments,
      appeal,
      appealHistory,
      feedback
    };

    return { success: true, data: fullData };

  } catch (err: any) {
    console.error("Track error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
