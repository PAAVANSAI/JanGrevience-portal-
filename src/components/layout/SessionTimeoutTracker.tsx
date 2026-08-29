"use client";

import React from "react";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useUserRole } from "@/lib/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionTimeoutTracker() {
  const { profile } = useUserRole();
  const { isWarningModalOpen, remainingSeconds, resetTimer } = useIdleTimeout(30 * 60 * 1000, 25 * 60 * 1000);

  // Only run for logged-in citizens
  if (!profile || profile.role !== "CITIZEN") {
    return null;
  }

  return (
    <AnimatePresence>
      {isWarningModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-surface border border-border p-6 rounded-2xl shadow-xl max-w-sm w-full"
          >
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <h3 className="text-lg font-bold">Session Expiring</h3>
            </div>
            
            <p className="text-text-secondary text-sm mb-6">
              You've been inactive for a while. For your security, you will be automatically signed out in{" "}
              <strong className="text-text-primary font-mono bg-bg px-2 py-1 rounded">
                {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
              </strong>
            </p>
            
            <button
              onClick={resetTimer}
              className="w-full py-2.5 bg-blue text-white font-semibold rounded-[var(--radius-md)] hover:bg-blue-hover transition-colors"
            >
              Stay Signed In
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
