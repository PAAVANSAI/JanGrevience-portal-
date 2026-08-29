import React from "react";
import { motion } from "framer-motion";
import SignOutButton from "@/components/auth/SignOutButton";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="text-text-secondary mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {action}
        <SignOutButton />
      </div>
    </motion.div>
  );
}
