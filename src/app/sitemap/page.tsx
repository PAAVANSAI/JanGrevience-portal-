import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { navigationConfig } from "@/lib/config/navigation";

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-4">
            Site Map
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            A complete directory of all public and secure pages available on the JanGrievance platform.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Dynamic Navigation Links */}
            <div>
              <h2 className="text-lg font-bold text-navy mb-6 border-b border-border pb-2">Main Navigation</h2>
              <ul className="space-y-4">
                {navigationConfig.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <Link href={item.href} className="text-blue hover:text-blue-hover font-medium">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-text-primary">{item.label}</span>
                    )}
                    
                    {item.children && (
                      <ul className="ml-4 mt-3 space-y-3 border-l-2 border-border pl-4">
                        {item.children.map((child, childIdx) => (
                          <li key={childIdx}>
                            <Link href={child.href!} className="text-sm text-text-secondary hover:text-blue transition-colors">
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Static Informational Pages */}
            <div>
              <h2 className="text-lg font-bold text-navy mb-6 border-b border-border pb-2">Information & Legal</h2>
              <ul className="space-y-4">
                <li>
                  <Link href="/about" className="text-sm text-text-secondary hover:text-blue transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-text-secondary hover:text-blue transition-colors">
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <span className="text-sm text-text-muted">Privacy Policy (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-sm text-text-muted">Terms of Use (Coming Soon)</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
