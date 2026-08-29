"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/UserContext";
import Logo from "@/components/ui/Logo";
import Spinner from "@/components/ui/Spinner";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import { navigationConfig, getDashboardPath, NavItem } from "@/lib/config/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SessionTimeoutTracker from "./SessionTimeoutTracker";

interface HeaderProps {
  userEmail?: string;
  userName?: string;
}

const DesktopNavItem = ({ item, isAuthenticated, userRole }: { item: NavItem, isAuthenticated: boolean, userRole?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  if (item.requiresAuth && !isAuthenticated) return null;
  if (item.publicOnly && isAuthenticated) return null;
  if (item.allowedRoles && (!userRole || !item.allowedRoles.includes(userRole as any))) return null;

  // Filter children based on role as well so we don't show empty dropdowns or unauthorized links
  const visibleChildren = item.children?.filter(child => {
    if (child.requiresAuth && !isAuthenticated) return false;
    if (child.publicOnly && isAuthenticated) return false;
    if (child.allowedRoles && (!userRole || !child.allowedRoles.includes(userRole as any))) return false;
    return true;
  });

  const hasChildren = visibleChildren && visibleChildren.length > 0;
  const isActive = pathname === item.href || (hasChildren && visibleChildren?.some(child => child.href === pathname));

  if (hasChildren) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
            isActive ? "text-blue bg-blue/5" : "text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          {item.label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isHovered ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="py-1 flex flex-col">
                {visibleChildren.map((child, idx) => (
                  <Link
                    key={idx}
                    href={child.href || "#"}
                    className={`px-4 py-2 text-sm transition-colors ${
                      pathname === child.href ? "text-blue bg-blue/5 font-medium" : "text-text-secondary hover:text-text-primary hover:bg-bg"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={`px-3 py-2 text-sm font-medium transition-colors rounded-md ${
        isActive ? "text-blue bg-blue/5" : "text-text-secondary hover:text-text-primary hover:bg-surface"
      }`}
    >
      {item.label}
    </Link>
  );
};

export default function Header({ userEmail, userName }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { profile } = useUserRole();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = profile?.full_name || userName || userEmail;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
  
  // Only use client-side profile auth state after mounting to prevent SSR hydration mismatches
  const isAuthenticated = mounted ? !!(profile || userEmail) : !!userEmail;

  // Build role-aware navigation: resolve the Dashboard link to the correct path
  const roleAwareNav = React.useMemo(() => {
    const dashboardPath = getDashboardPath(profile?.role);
    return navigationConfig.map((item) =>
      item.isDashboard ? { ...item, href: dashboardPath } : item
    );
  }, [profile?.role]);

  return (
    <>
      <SessionTimeoutTracker />
      <header className="bg-surface border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center gap-6 lg:gap-10">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {/* Logo & brand */}
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={28} variant="dark" />
              <span className="font-semibold text-lg text-navy tracking-tight hidden sm:block">
                JanGrievance
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {roleAwareNav.map((item, index) => (
                <DesktopNavItem key={index} item={item} isAuthenticated={isAuthenticated} userRole={profile?.role} />
              ))}
            </nav>
          </div>

          {/* User info & sign out / actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <div className="hidden md:block text-right">
                  {displayName && (
                    <p className="text-sm font-medium text-text-primary">
                      {displayName}
                    </p>
                  )}
                </div>

                <Link href="/settings" className="w-8 h-8 rounded-full bg-blue/10 text-blue flex items-center justify-center text-sm font-semibold hover:ring-2 hover:ring-blue/30 transition-all flex-shrink-0">
                  {initial}
                </Link>

                <NotificationBell />

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-bg disabled:opacity-50 cursor-pointer"
                >
                  {signingOut ? (
                    <>
                      <Spinner size={14} />
                      <span className="hidden sm:inline">Signing out…</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-2 bg-blue text-white rounded-[var(--radius-md)] hover:bg-blue-hover transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        isAuthenticated={isAuthenticated}
        navItems={roleAwareNav}
      />
    </header>
    </>
  );
}
