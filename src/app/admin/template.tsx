"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.5,
        opacity: { duration: 0.18, ease: "easeOut" },
      }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}
