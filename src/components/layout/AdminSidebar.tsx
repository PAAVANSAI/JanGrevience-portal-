"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/lib/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useEffect } from "react";
import Logo from "@/components/ui/Logo";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const superAdminNav: NavItem[] = [
  {
    name: "Overview",
    path: "/admin",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    name: "Departments",
    path: "/admin/departments",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: (
      <>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </>
    ),
  },
  {
    name: "Dept. Contacts",
    path: "/admin/department-contacts",
    icon: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </>
    ),
  },
  {
    name: "Locations",
    path: "/admin/locations",
    icon: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    name: "SLA Rules",
    path: "/admin/sla-rules",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
  {
    name: "Services",
    path: "/admin/services",
    icon: (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
  },
  {
    name: "Analytics",
    path: "/admin/analytics",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  {
    name: "Audit Logs",
    path: "/admin/audit-logs",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

const deptAdminNav: NavItem[] = [
  {
    name: "Overview",
    path: "/department-admin",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
  },
  {
    name: "Grievances",
    path: "/department-admin/grievances",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
  },
  {
    name: "Officers",
    path: "/department-admin/officers",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
  },
  {
    name: "Analytics",
    path: "/department-admin/analytics",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, profile } = useUserRole();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();

  // Use actual role as primary check. Fall back to URL path only during initial load before role is available.
  const inAdminRoute = pathname.startsWith("/admin");
  const inDeptAdminRoute = pathname.startsWith("/department-admin");
  
  // Determine sidebar type strictly by current route to prevent mismatched UI
  const isSuperAdmin = inAdminRoute && !inDeptAdminRoute;
  
  // Client-side protection against stale router cache bypassing middleware
  useEffect(() => {
    if (!role) return;
    
    // Strict client-side router cache fallback
    if (inAdminRoute && role !== "SUPER_ADMIN") {
      const dashboard = role === "DEPT_ADMIN" ? "/department-admin" : (role === "OFFICER" ? "/officer" : "/citizen");
      router.replace(dashboard);
    } else if (inDeptAdminRoute && role !== "DEPT_ADMIN" && role !== "SUPER_ADMIN") {
      const dashboard = role === "SUPER_ADMIN" ? "/admin" : (role === "OFFICER" ? "/officer" : "/citizen");
      router.replace(dashboard);
    }
  }, [role, inAdminRoute, inDeptAdminRoute, router]);

  const navItems = isSuperAdmin ? superAdminNav : deptAdminNav;
  const title = isSuperAdmin ? "Super Admin" : "Dept. Admin";
  const adminInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "A";

  const closeMobileMenu = () => setIsMobileOpen(false);

  const renderSidebarContent = (collapsed: boolean) => (
    <>
      {/* Brand Header */}
      <div className={`p-5 border-b border-border transition-all duration-300 ${collapsed ? "px-3 text-center" : ""}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/" className="flex items-center gap-2.5" title="JanGrievance">
            <Logo size={24} variant="dark" />
            {!collapsed && <span className="font-semibold text-sm text-text-primary tracking-tight">JanGrievance</span>}
          </Link>
          {!collapsed && (
          <button 
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 -mr-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          )}
        </div>
        <div className={`mt-4 flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue/10 text-blue flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 ring-blue/20">
              {adminInitial}
            </div>
            {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate max-w-[120px]">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-text-muted">{title}</p>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto px-3">
        {!collapsed && <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">Navigation</p>}
        {collapsed && <div className="h-6"></div>}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeAdminNav"
                    className="absolute inset-0 bg-blue/8 border border-blue/15 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Link
                  href={item.path}
                  onClick={closeMobileMenu}
                  title={collapsed ? item.name : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive 
                      ? "text-blue" 
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                  }`}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`flex-shrink-0 ${isActive ? "text-blue" : "text-text-muted"}`}
                  >
                    {item.icon}
                  </svg>
                  {!collapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Area */}
      <div className={`p-3 border-t border-border mt-auto flex flex-col gap-2`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-3 py-2"}`}>
          {!collapsed && <span className="text-xs font-medium text-text-muted">Theme</span>}
          <ThemeToggle />
        </div>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-end px-3 py-2"}`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors hidden md:block"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border w-full">
        <div className="flex items-center gap-2.5">
          <Logo size={22} variant="dark" />
          <span className="font-semibold text-sm text-text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-text-secondary hover:text-text-primary bg-bg rounded-md transition-colors"
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${isCollapsed ? "w-20" : "w-64"} transition-all duration-300 bg-surface border-r border-border h-full overflow-y-auto flex-col flex-shrink-0`}>
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-surface z-50 flex flex-col md:hidden shadow-xl"
            >
              {renderSidebarContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
