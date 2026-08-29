"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingFormData } from "@/lib/validations/profile";

interface OnboardingResponse {
  success: boolean;
  error?: string;
}

export async function completeOnboarding(data: OnboardingFormData): Promise<OnboardingResponse> {
  try {
    // 1. Validate data
    const validatedData = onboardingSchema.parse(data);

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
          body: `secret=${secretKey}&response=${validatedData.captchaToken}`,
        }
      );
      
      const captchaResult = await captchaResponse.json();
      
      if (!captchaResult.success) {
        return { success: false, error: "Security check failed. Please try again." };
      }
    }

    // 3. Update Profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: validatedData.fullName,
        gender: validatedData.gender,
        address_line: validatedData.addressLine,
        sub_locality: validatedData.subLocality || null,
        country: validatedData.country,
        state_id: validatedData.stateId,
        district_id: validatedData.districtId,
        pincode: validatedData.pincode || null,
        phone: validatedData.phone,
        landline_phone: validatedData.landlinePhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      return { success: false, error: "Failed to update profile: " + error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Onboarding action error:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
