"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";

export default function PublicLanding({ dashboardPath }: { dashboardPath?: string }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      <Header />
      
      {/* Important Banner */}
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-3 text-center">
          <p className="text-sm font-medium text-red-800 flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Any Grievance sent by email will not be attended to. Please lodge your grievance on this portal.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
        
        {/* Hero Section */}
        <div className="mb-16 lg:mb-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue/10 text-blue font-semibold text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue"></span>
              </span>
              Citizen Centric Governance
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy tracking-tight leading-[1.1] mb-6">
              A Direct Way to Connect <br className="hidden lg:block" />
              <span className="text-blue">Citizens with the Government</span>
            </h1>
            
            <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              JanGrievance is a robust platform ensuring your voice reaches the right department. Track, manage, and escalate your concerns seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {dashboardPath ? (
                <Link 
                  href={dashboardPath} 
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue text-white font-semibold rounded-xl hover:bg-blue-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue text-white font-semibold rounded-xl hover:bg-blue-hover shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
                >
                  Sign In to Lodge Grievance
                </Link>
              )}
              <Link 
                href="/track" 
                className="w-full sm:w-auto px-8 py-3.5 bg-surface text-text-primary font-semibold border border-border rounded-xl hover:bg-bg transition-colors text-center"
              >
                Track Status
              </Link>
            </div>
          </motion.div>

          {/* Hero Illustration — Stable, Aligned Premium Cards */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-lg lg:max-w-none relative"
          >
            <div className="w-full rounded-3xl relative overflow-hidden p-6 sm:p-8"
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 30%, #f5f3ff 60%, #faf5ff 100%)",
              }}
            >
              {/* Subtle background blobs */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-blue-400/15 to-indigo-400/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-violet-400/10 to-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Dot grid pattern */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: "radial-gradient(circle, #4f46e5 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}></div>

              <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-5">
                {/* Card 1 — Easy Filing */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-[0_4px_24px_rgba(59,130,246,0.06)] border border-blue-100/50 hover:border-blue-200 hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)] transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl"></div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    </div>
                    <h4 className="font-bold text-navy text-sm sm:text-base mb-1">Easy Filing</h4>
                    <p className="text-[11px] sm:text-xs text-text-muted leading-tight">AI-assisted smart submission</p>
                  </div>
                </motion.div>

                {/* Card 2 — Live Tracking */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-[0_4px_24px_rgba(16,185,129,0.06)] border border-emerald-100/50 hover:border-emerald-200 hover:shadow-[0_8px_32px_rgba(16,185,129,0.12)] transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-2xl"></div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <h4 className="font-bold text-navy text-sm sm:text-base mb-1">Live Tracking</h4>
                    <p className="text-[11px] sm:text-xs text-text-muted leading-tight">Real-time SLA monitoring</p>
                  </div>
                </motion.div>

                {/* Card 3 — Fast Resolution */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-[0_4px_24px_rgba(245,158,11,0.06)] border border-amber-100/50 hover:border-amber-200 hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl"></div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <h4 className="font-bold text-navy text-sm sm:text-base mb-1">Fast Resolution</h4>
                    <p className="text-[11px] sm:text-xs text-text-muted leading-tight">Direct nodal officer routing</p>
                  </div>
                </motion.div>

                {/* Card 4 — Appellate System */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.75 }}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-[0_4px_24px_rgba(139,92,246,0.06)] border border-violet-100/50 hover:border-violet-200 hover:shadow-[0_8px_32px_rgba(139,92,246,0.12)] transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400 to-violet-600 rounded-l-2xl"></div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <h4 className="font-bold text-navy text-sm sm:text-base mb-1">Appellate System</h4>
                    <p className="text-[11px] sm:text-xs text-text-muted leading-tight">Multi-level escalation built-in</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <hr className="border-border mb-16 lg:mb-24" />

        {/* Informational Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Appeals Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
          >
            <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-amber-600 mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-2xl font-bold text-amber-900 mb-4">Introducing Appeal Mechanism</h2>
            <p className="text-amber-800/80 font-medium mb-6">Not Satisfied with redress of your grievance?</p>
            <p className="text-sm text-amber-900/70 leading-relaxed mb-6">
              You have a one-time opportunity to raise your concern with the Nodal Appellate Authority. View your final status and rate us appropriately to file your appeal.
            </p>
            <Link href="/appeals-info" className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-900 transition-colors group-hover:gap-3">
              Learn about Appeals <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </motion.div>

          {/* Exclusions Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-surface border border-border rounded-3xl p-8 lg:p-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-navy">Following are <span className="text-red-600">NOT</span> treated as Grievance</h2>
                <p className="text-text-secondary text-sm mt-1">Please do not submit complaints regarding these categories.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>, title: "RTI Matters" },
                { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>, title: "Court Related / Subjudice Matters" },
                { icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>, title: "Religious Matters" },
                { icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>, title: "Suggestions" },
                { icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>, title: "Service Matters of Govt. Employees" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-bg border border-border/50 hover:border-border transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-surface shadow-sm flex items-center justify-center text-text-muted">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {item.icon}
                    </svg>
                  </div>
                  <span className="font-medium text-text-primary text-sm">{item.title}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
