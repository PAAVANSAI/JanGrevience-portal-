import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import FloatingSignOut from "@/components/layout/FloatingSignOut";

export default function DepartmentAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
}
