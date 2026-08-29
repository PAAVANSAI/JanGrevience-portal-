"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AnalyticsSummary } from "@/types/analytics";

interface SummaryCardsProps {
  summary: AnalyticsSummary;
}

// Reusable count up animation component
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    
    if (value === 0) {
      setCount(0);
      return;
    }

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Grievances",
      value: summary.total_grievances,
      color: "bg-blue-50 border-blue-200 text-blue-700",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      title: "Pending",
      value: summary.pending_grievances,
      color: "bg-amber-50 border-amber-200 text-amber-700",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Resolved",
      value: summary.resolved_grievances,
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Overdue",
      value: summary.overdue_grievances,
      color: "bg-rose-50 border-rose-200 text-rose-700",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative p-6 rounded-2xl border ${card.color} overflow-hidden shadow-sm`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm opacity-90">{card.title}</h3>
            <div className="p-2 bg-white/40 rounded-lg backdrop-blur-sm shadow-sm">
              {card.icon}
            </div>
          </div>
          <div className="text-3xl font-bold">
            <CountUp value={Number(card.value) || 0} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
