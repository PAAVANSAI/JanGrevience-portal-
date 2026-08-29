"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      disabled={signingOut}
      className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-bold text-error bg-error-bg/50 hover:bg-error-bg border border-transparent hover:border-error/20 transition-all disabled:opacity-50 flex-shrink-0"
    >
      {signingOut ? (
        <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      )}
      <span className="hidden sm:inline">{signingOut ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
