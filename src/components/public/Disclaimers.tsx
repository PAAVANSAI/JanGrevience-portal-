"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Disclaimers() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-12 mb-8">
        {/* Appeals Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-amber-600 mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h2 className="text-xl font-bold text-amber-900 mb-3">Appeal Mechanism</h2>
          <p className="text-sm text-amber-900/80 font-medium mb-3">Not Satisfied with redress of your grievance?</p>
          <p className="text-xs text-amber-900/70 leading-relaxed mb-4">
            You have a one-time opportunity to raise your concern with the Nodal Appellate Authority. View your final status and rate us appropriately to file your appeal.
          </p>
          <Link href="/appeals-info" className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors group-hover:gap-3">
            Learn about Appeals <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </motion.div>

        {/* Exclusions Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-surface border border-border rounded-3xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">Following are <span className="text-red-600">NOT</span> treated as Grievance</h2>
              <p className="text-text-secondary text-xs mt-1">Please do not submit complaints regarding these categories.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>, title: "RTI Matters" },
              { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>, title: "Subjudice Matters" },
              { icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>, title: "Religious Matters" },
              { icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>, title: "Suggestions" },
              { icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>, title: "Govt. Employee Matters" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border/50 hover:border-border transition-colors">
                <div className="w-8 h-8 rounded-lg bg-surface shadow-sm flex items-center justify-center text-text-muted shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <span className="font-medium text-text-primary text-xs leading-tight">{item.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Email Disclaimer */}
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center mb-8">
        <p className="text-xs font-medium text-red-800 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          Any Grievance sent by email will not be attended to. Please lodge your grievance on this portal.
        </p>
      </div>
    </div>
  );
}
