"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";

const faqs = [
  {
    question: "How do I track my grievance?",
    answer: "You can track your grievance by clicking 'Track Grievance' in the menu. If you are logged in, you can see all your submitted grievances on your Dashboard. If you are a guest, you will need your Grievance ID, the email or mobile number you used to file it, and to pass a quick security check."
  },
  {
    question: "What happens after I submit a grievance?",
    answer: "Your grievance is first marked as SUBMITTED, then ACKNOWLEDGED when an officer views it. It is automatically assigned to an officer in the relevant department who will mark it IN_PROGRESS while they work on it. Once fixed, they will mark it RESOLVED and provide proof."
  },
  {
    question: "What if the department needs more information from me?",
    answer: "The officer will mark your grievance as ADDITIONAL_INFORMATION_REQUIRED. You will be able to see this status and reply directly in the discussion thread on your grievance details page."
  },
  {
    question: "Can I confirm if my issue was actually fixed?",
    answer: "Yes! When an officer marks a grievance as RESOLVED, you have the final say. You can either confirm it (which changes it to CLOSED) or dispute it if the issue persists (which changes it to REOPENED for further work)."
  },
  {
    question: "What if my grievance isn't resolved in time?",
    answer: "We use strict Service Level Agreements (SLAs). If an officer takes too long, your grievance is automatically escalated to higher-ranking Nodal Officers or Super Admins for immediate intervention."
  }
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-5 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue/50 rounded-lg px-2 -mx-2 transition-colors hover:bg-bg/50"
      >
        <span className="font-semibold text-navy pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="text-text-muted flex-shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 px-2 -mx-2 text-text-secondary leading-relaxed text-sm">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            Everything you need to know about tracking, escalating, and resolving your grievances on our platform.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </main>
    </div>
  );
}
