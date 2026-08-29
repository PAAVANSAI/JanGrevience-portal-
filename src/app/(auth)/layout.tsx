import React from "react";
import BrandPanel from "@/components/auth/BrandPanel";
import BrandHeader from "@/components/auth/BrandHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop: left brand panel */}
      <BrandPanel />

      {/* Mobile: top brand header */}
      <BrandHeader />

      {/* Form area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 bg-surface">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
