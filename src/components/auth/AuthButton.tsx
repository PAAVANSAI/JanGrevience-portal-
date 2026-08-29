"use client";

import React from "react";
import { motion } from "framer-motion";
import Spinner from "@/components/ui/Spinner";

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export default function AuthButton({
  children,
  loading = false,
  loadingText,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
  onClick,
}: AuthButtonProps) {
  const baseClasses =
    "w-full flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantClasses = {
    primary:
      "bg-blue text-white hover:bg-blue-hover focus:ring-blue shadow-sm hover:shadow-md",
    secondary:
      "bg-surface text-text-primary border border-border hover:bg-bg hover:border-border-hover focus:ring-blue",
    ghost:
      "text-blue hover:bg-blue-50 focus:ring-blue",
  };

  return (
    <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
      <button
        type={type}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        disabled={disabled || loading}
        onClick={onClick}
      >
        {loading ? (
          <>
            <Spinner size={18} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </button>
    </motion.div>
  );
}
