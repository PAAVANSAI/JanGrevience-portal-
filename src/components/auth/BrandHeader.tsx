import React from "react";
import Logo from "@/components/ui/Logo";

export default function BrandHeader() {
  return (
    <div className="lg:hidden bg-[#1B2A4A] px-4 py-3.5 flex items-center gap-2.5">
      <Logo size={28} variant="light" />
      <span className="text-white font-semibold text-lg tracking-tight">
        JanGrievance
      </span>
    </div>
  );
}
