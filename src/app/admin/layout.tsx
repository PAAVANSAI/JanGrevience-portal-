import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto h-full overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
}
