"use client";

import React from "react";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";

interface HomeContentProps {
  userName: string | null;
  userEmail: string | null;
}

export default function HomeContent({ userName, userEmail }: HomeContentProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header userName={userName || undefined} userEmail={userEmail || undefined} />

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Logo size={44} variant="dark" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="mt-2 text-text-secondary text-sm leading-relaxed">
            Your account is all set up. The dashboard and grievance features
            are coming soon in the next update.
          </p>

          <div className="mt-8 p-4 rounded-[var(--radius-lg)] bg-surface border border-border">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                <strong className="text-text-primary">Phase 2</strong> will add
                your grievance dashboard, profile settings, and department
                routing.
              </span>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="py-4 text-center text-xs text-text-muted">
        JanGrievance · Your voice matters
      </footer>
    </div>
  );
}
