import React from "react";
import Logo from "@/components/ui/Logo";

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#1B2A4A] relative overflow-hidden items-center justify-center">
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#243556]/30 via-transparent to-[#111D33]/50" />

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <Logo size={56} variant="light" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          JanGrievance
        </h2>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          Your voice matters. We listen.
          <br />
          <span className="text-white/50">
            Raise, track, and resolve grievances with transparency.
          </span>
        </p>

        {/* Trust indicators */}
        <div className="mt-10 flex items-center justify-center gap-6 text-white/40">
          <div className="flex items-center gap-1.5 text-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Fast
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Transparent
          </div>
        </div>
      </div>
    </div>
  );
}
