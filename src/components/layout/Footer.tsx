import React from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto w-full bg-surface border-t border-border overflow-hidden transition-colors duration-300">
      {/* Top gradient border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue to-transparent opacity-50" />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, var(--color-blue) 0%, transparent 60%), radial-gradient(circle at 75% 75%, var(--color-navy) 0%, transparent 60%)" }} />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-10">

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 mt-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <Logo size={32} />
              <span className="font-bold text-xl text-text-primary tracking-tight group-hover:text-blue transition-colors">
                JanGrievance
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-text-secondary">
              An independent, transparent, and efficient citizen grievance management platform designed to connect people with the right departments quickly.
            </p>
            {/* Status indicator */}
            <div className="flex items-center gap-2 mt-4">
              <span className="inline-flex w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-text-secondary">All systems operational</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Us" },
                { href: "/sitemap", label: "Site Map" },
                { href: "/citizen", label: "Dashboard" },
                { href: "/grievances/new", label: "File Grievance" },
                { href: "/contact", label: "Contact Us" },
                { href: "/appeals-info", label: "Appeals Info" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-blue">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">Support</h3>
            <ul className="space-y-3">
              {[
                { href: "/faq", label: "FAQs" },
                { href: "/track", label: "Track Grievance" },
                { href: "/contact", label: "Contact Support" },
                { href: "/how-it-works", label: "How It Works" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-blue">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-text-primary text-sm mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <li><span className="text-sm text-text-muted">Privacy Policy</span></li>
              <li><span className="text-sm text-text-muted">Terms of Use</span></li>
              <li><span className="text-sm text-text-muted">Disclaimer</span></li>
              <li>
                <Link href="/sitemap" className="text-sm text-text-secondary transition-colors hover:text-blue">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
          <p className="text-xs text-text-muted">
            &copy; {currentYear} JanGrievance. An independent public-interest platform. Not affiliated with any government body.
          </p>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>Made with ♥ for citizens of India</span>
            <span className="hidden md:block">·</span>
            <span className="hidden md:block">Best viewed on modern browsers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
