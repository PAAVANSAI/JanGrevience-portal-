"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

interface GrievanceCalendarProps {
  departmentId: string;
}

interface CalendarGrievance {
  id: string;
  grievance_number: string;
  subject: string;
  status: string;
  created_at: string;
  categories: { name: string } | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Returns a YYYY-MM-DD string for a given date */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the heatmap intensity level (0-4) for a count */
function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

export default function GrievanceCalendar({ departmentId }: GrievanceCalendarProps) {
  const supabase = createClient();
  const today = useMemo(() => new Date(), []);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [grievances, setGrievances] = useState<CalendarGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  // Fetch grievances for the displayed month
  const fetchGrievances = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from("grievances")
        .select("id, grievance_number, subject, status, created_at, categories(name)")
        .eq("department_id", departmentId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch calendar grievances:", error);
      } else {
        setGrievances(data || []);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, currentYear, currentMonth, supabase]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  // Group grievances by date key
  const grievancesByDate = useMemo(() => {
    const map = new Map<string, CalendarGrievance[]>();
    for (const g of grievances) {
      const key = toDateKey(new Date(g.created_at));
      const arr = map.get(key) || [];
      arr.push(g);
      map.set(key, arr);
    }
    return map;
  }, [grievances]);

  // Calendar grid data
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);
  const todayKey = toDateKey(today);

  // Navigation
  function goToPreviousMonth() {
    setDirection(-1);
    setSelectedDate(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    setDirection(1);
    setSelectedDate(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setDirection(0);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(null);
  }

  // Selected date grievances
  const selectedGrievances = selectedDate ? (grievancesByDate.get(selectedDate) || []) : [];

  // Total grievances this month
  const totalThisMonth = grievances.length;

  // Build cells array
  const cells: Array<{ day: number | null; dateKey: string; count: number }> = [];
  for (let i = 0; i < firstDayOffset; i++) {
    cells.push({ day: null, dateKey: "", count: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const count = grievancesByDate.get(dateKey)?.length || 0;
    cells.push({ day: d, dateKey, count });
  }

  const monthVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
  };

  const intensityClasses = [
    "",
    "cal-heat-1",
    "cal-heat-2",
    "cal-heat-3",
    "cal-heat-4",
  ];

  return (
    <div id="calendar" className="scroll-mt-24">
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-surface-2/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue/10 text-blue flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">Grievance Calendar</h2>
              <p className="text-xs text-text-muted">
                {totalThisMonth} grievance{totalThisMonth !== 1 ? "s" : ""} in {MONTH_NAMES[currentMonth]} {currentYear}
              </p>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-surface border border-border rounded-lg hover:bg-surface-2 hover:text-text-primary transition-all"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent hover:border-border transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              aria-label="Next month"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent hover:border-border transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar body */}
        <div className="p-3 sm:p-5">
          {/* Month title (animated) */}
          <div className="relative h-8 mb-4 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.h3
                key={`${currentYear}-${currentMonth}`}
                custom={direction}
                variants={monthVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute text-sm sm:text-base font-bold text-text-primary tracking-wide"
              >
                {MONTH_NAMES[currentMonth]} {currentYear}
              </motion.h3>
            </AnimatePresence>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider py-1.5"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                if (cell.day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDate;
                const intensity = getIntensity(cell.count);
                const hasGrievances = cell.count > 0;

                return (
                  <button
                    key={cell.dateKey}
                    onClick={() =>
                      setSelectedDate(isSelected ? null : cell.dateKey)
                    }
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center relative
                      transition-all duration-200 group cursor-pointer
                      ${isSelected
                        ? "ring-2 ring-blue bg-blue-50 shadow-sm"
                        : isToday
                          ? "ring-2 ring-blue/40 bg-blue-50/50"
                          : hasGrievances
                            ? intensityClasses[intensity]
                            : "hover:bg-surface-2"
                      }
                      ${!isSelected && hasGrievances ? "hover:ring-1 hover:ring-blue/30" : ""}
                    `}
                    aria-label={`${cell.day} ${MONTH_NAMES[currentMonth]} — ${cell.count} grievance${cell.count !== 1 ? "s" : ""}`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-semibold leading-none
                        ${isSelected ? "text-blue" : isToday ? "text-blue" : "text-text-primary"}
                      `}
                    >
                      {cell.day}
                    </span>
                    {hasGrievances && (
                      <span
                        className={`
                          text-[9px] sm:text-[10px] font-bold leading-none mt-0.5 sm:mt-1
                          px-1 py-0.5 rounded-full min-w-[16px] text-center
                          ${isSelected
                            ? "bg-blue text-white"
                            : intensity >= 3
                              ? "bg-blue/20 text-blue"
                              : "bg-blue/10 text-blue/80"
                          }
                        `}
                      >
                        {cell.count}
                      </span>
                    )}
                    {isToday && !hasGrievances && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Heatmap legend */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/50">
            <span className="text-[10px] text-text-muted font-medium">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3.5 h-3.5 rounded-sm border border-border/30 ${
                  level === 0
                    ? "bg-surface-2"
                    : intensityClasses[level]
                }`}
              />
            ))}
            <span className="text-[10px] text-text-muted font-medium">More</span>
          </div>
        </div>

        {/* Selected date detail panel */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 sm:p-5 bg-surface-2/30">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h4>
                      <p className="text-xs text-text-muted">
                        {selectedGrievances.length} grievance{selectedGrievances.length !== 1 ? "s" : ""} filed
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                    aria-label="Close detail panel"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Grievance list */}
                {selectedGrievances.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-muted font-medium">No grievances filed on this date</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedGrievances.map((g, idx) => (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                      >
                        <Link
                          href={`/department-admin/grievances/${g.id}`}
                          className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-blue/30 hover:shadow-sm transition-all group"
                        >
                          {/* Sequence number */}
                          <div className="w-7 h-7 rounded-lg bg-blue/10 text-blue flex items-center justify-center flex-shrink-0 text-xs font-bold group-hover:bg-blue group-hover:text-white transition-colors">
                            {idx + 1}
                          </div>

                          {/* Grievance info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[11px] font-mono font-semibold text-text-muted">
                                {g.grievance_number}
                              </span>
                              <StatusBadge status={g.status as any} className="!text-[9px] !px-1.5 !py-0" />
                            </div>
                            <p className="text-sm font-medium text-text-primary truncate group-hover:text-blue transition-colors">
                              {g.subject}
                            </p>
                            {g.categories?.name && (
                              <p className="text-[11px] text-text-muted mt-0.5 truncate">
                                {g.categories.name}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-blue transition-colors flex-shrink-0">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
