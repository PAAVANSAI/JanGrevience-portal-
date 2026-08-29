"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NavItem } from "@/lib/config/navigation";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  navItems?: NavItem[];
}

const MobileNavItem = ({ item, isAuthenticated, onClose, level = 0 }: { item: NavItem, isAuthenticated: boolean, onClose: () => void, level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // If item shouldn't be shown based on auth state
  if (item.requiresAuth && !isAuthenticated) return null;
  if (item.publicOnly && isAuthenticated) return null;

  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || (hasChildren && item.children?.some(child => child.href === pathname));

  if (hasChildren) {
    return (
      <div className="flex flex-col border-b border-border last:border-b-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-between w-full py-4 px-4 text-left font-medium transition-colors ${
            isActive ? "text-blue bg-blue/5" : "text-text-primary hover:bg-surface"
          } ${level > 0 ? "pl-8 text-sm" : "text-base"}`}
        >
          <span>{item.label}</span>
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </motion.svg>
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden bg-bg"
            >
              <div className="flex flex-col pb-2">
                {item.children?.map((child, idx) => (
                  <MobileNavItem 
                    key={idx} 
                    item={child} 
                    isAuthenticated={isAuthenticated} 
                    onClose={onClose} 
                    level={level + 1} 
                  />
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
      onClick={onClose}
      className={`block w-full py-4 px-4 border-b border-border last:border-b-0 font-medium transition-colors ${
        pathname === item.href ? "text-blue bg-blue/5" : "text-text-primary hover:bg-surface"
      } ${level > 0 ? "pl-8 text-sm" : "text-base"}`}
    >
      {item.label}
    </Link>
  );
};

export default function MobileNav({ isOpen, onClose, isAuthenticated, navItems = [] }: MobileNavProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} // smooth ease-out
            className="fixed top-0 left-0 bottom-0 z-50 w-[85%] max-w-sm bg-bg border-r border-border shadow-xl sm:hidden flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg z-10">
              <span className="font-semibold text-lg text-navy tracking-tight">Menu</span>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors bg-surface rounded-full"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              <div className="flex flex-col border-t border-border">
                {navItems.map((item, index) => (
                  <MobileNavItem 
                    key={index} 
                    item={item} 
                    isAuthenticated={isAuthenticated} 
                    onClose={onClose} 
                  />
                ))}
              </div>
            </nav>
            
            {/* Lower section could have Language Selector on mobile later */}
            <div className="p-4 border-t border-border bg-surface mt-auto">
              {!isAuthenticated && (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-blue hover:bg-blue-hover text-white rounded-md font-semibold transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
