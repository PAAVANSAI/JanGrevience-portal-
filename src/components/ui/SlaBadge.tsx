"use client";

import React from "react";
import { motion } from "framer-motion";
import { SlaStatus } from "@/lib/utils/sla";

interface SlaBadgeProps {
  sla: SlaStatus | null;
  role: "CITIZEN" | "OFFICER";
  className?: string;
  size?: "small" | "large";
}

export function SlaBadge({ sla, role, className = "", size = "small" }: SlaBadgeProps) {
  if (!sla) return null;

  const { daysRemaining, urgencyLevel, isOverdue } = sla;

  // Determine colors based on urgency
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const currentColor = colors[urgencyLevel];
  
  // Determine text based on role and urgency
  let text = "";
  if (role === "CITIZEN") {
    if (isOverdue) {
      text = `Resolution overdue by ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'day' : 'days'}`;
    } else {
      text = `Expected resolution in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    }
  } else {
    // OFFICER
    if (isOverdue) {
      text = `OVERDUE by ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'day' : 'days'}`;
    } else if (urgencyLevel === "amber") {
      text = `⚠ ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
    } else {
      text = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`;
    }
  }

  const sizeClasses = size === "small" 
    ? "px-2 py-0.5 text-xs border"
    : "px-3 py-1 text-sm border font-medium";

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center rounded-full ${currentColor} ${sizeClasses} ${className}`}
    >
      {text}
    </motion.span>
  );
}
