"use client";

import React from "react";
import { motion } from "framer-motion";
import type { GeographicBreakdown } from "@/types/analytics";

interface GeographicTableProps {
  geo: GeographicBreakdown[];
}

export default function GeographicTable({ geo }: GeographicTableProps) {
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Geographic Breakdown</h3>
        <p className="text-sm text-text-secondary mt-1">Grievances by state and district.</p>
      </div>
      
      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap sticky-header">
          <thead className="bg-bg text-text-muted text-xs uppercase font-semibold sticky top-0">
            <tr>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4">District</th>
              <th className="px-6 py-4 text-right">Grievances</th>
              <th className="px-6 py-4">Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {geo.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">No location data available.</td>
              </tr>
            ) : (
              geo.map((loc, i) => {
                const max = Math.max(...geo.map(g => g.grievances));
                const percent = (loc.grievances / max) * 100;
                
                return (
                  <tr key={`${loc.state}-${loc.district}-${i}`} className="hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{loc.state}</td>
                    <td className="px-6 py-4 text-text-secondary">{loc.district}</td>
                    <td className="px-6 py-4 text-right font-medium text-text-primary">{loc.grievances}</td>
                    <td className="px-6 py-4 w-1/3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-blue h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
