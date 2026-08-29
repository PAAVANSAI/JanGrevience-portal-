"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from "recharts";
import type { MonthlyVolume, DepartmentDistribution, StatusDistribution } from "@/types/analytics";

interface ChartsProps {
  volume: MonthlyVolume[];
  departmentDistribution: DepartmentDistribution[];
  statusDistribution: StatusDistribution[];
}

const STATUS_COLORS: Record<string, string> = {
  "PENDING": "#f59e0b", // amber-500
  "IN_PROGRESS": "#3b82f6", // blue-500
  "ESCALATED": "#ef4444", // red-500
  "RESOLVED": "#10b981", // emerald-500
  "CLOSED": "#64748b", // slate-500
};

export default function AnalyticsCharts({ volume, departmentDistribution, statusDistribution }: ChartsProps) {
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Volume Line Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border p-6 rounded-2xl shadow-sm col-span-1 lg:col-span-2"
      >
        <h3 className="text-lg font-bold text-text-primary mb-6">Monthly Grievance Volume</h3>
        <div className="h-[300px] w-full">
          {volume.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-text-muted">Not enough data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#93c5fd', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="grievances" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Department Distribution Bar Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border p-6 rounded-2xl shadow-sm"
      >
        <h3 className="text-lg font-bold text-text-primary mb-6">Department Distribution</h3>
        <div className="h-[300px] w-full">
          {departmentDistribution.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-text-muted">Not enough data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDistribution} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis 
                  dataKey="department_name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#374151', fontSize: 12, fontWeight: 500}} 
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="grievances" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Status Distribution Pie Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border p-6 rounded-2xl shadow-sm"
      >
        <h3 className="text-lg font-bold text-text-primary mb-6">Status Breakdown</h3>
        <div className="h-[300px] w-full">
          {statusDistribution.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-text-muted">Not enough data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                  animationDuration={1000}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-sm font-medium text-text-secondary">{value.replace("_", " ")}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
