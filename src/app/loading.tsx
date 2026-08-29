import React from "react";
import Header from "@/components/layout/Header";

export default function Loading() {
  return (
    <div className="min-h-screen bg-bg flex flex-col w-full">
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue/20 border-t-blue rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-text-secondary animate-pulse">Loading...</p>
        </div>
      </div>
    </div>
  );
}
