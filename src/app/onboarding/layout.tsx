import React from "react";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      <Header userEmail={user?.email} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
