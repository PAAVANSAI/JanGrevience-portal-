"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-error" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-warning" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-blue" };
  return { score: 4, label: "Strong", color: "bg-success" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= strength.score ? strength.color : "bg-border"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: level * 0.05 }}
          />
        ))}
      </div>
      <p
        className={`text-xs ${
          strength.score <= 1
            ? "text-error"
            : strength.score <= 2
            ? "text-warning"
            : strength.score <= 3
            ? "text-blue"
            : "text-success"
        }`}
      >
        {strength.label}
      </p>
    </div>
  );
}
