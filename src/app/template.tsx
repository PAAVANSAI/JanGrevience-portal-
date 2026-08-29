"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Admin/Dept-admin layouts handle their own transitions via their own template.tsx
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/department-admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 25,
        mass: 0.6,
        opacity: { duration: 0.2, ease: "easeOut" },
      }}
      className="flex-1 flex flex-col w-full h-full"
    >
      {children}
    </motion.div>
  );
}
