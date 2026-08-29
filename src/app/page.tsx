import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import PublicLanding from "@/components/public/PublicLanding";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicLanding />;
  }

  // Fetch profile to check onboarding and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .single();

  let dashboardPath = "/citizen";
  if (!profile || !profile.full_name || !profile.phone) {
    dashboardPath = "/onboarding";
  } else if (profile.role === "OFFICER") {
    dashboardPath = "/officer";
  } else if (profile.role === "DEPT_ADMIN") {
    dashboardPath = "/department-admin";
  } else if (profile.role === "SUPER_ADMIN") {
    dashboardPath = "/admin";
  }

  redirect(dashboardPath);
}
