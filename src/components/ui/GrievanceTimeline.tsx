"use client";

import React from "react";
import { motion } from "framer-motion";
import type { GrievanceStatusHistory, GrievanceStatus, AppealStatusHistory, AppealStatus } from "@/types/database";

interface GrievanceTimelineProps {
  history: (GrievanceStatusHistory | AppealStatusHistory)[];
}

const timelineContent: Record<GrievanceStatus | AppealStatus, { title: string; description: string; color: string }> = {
  SUBMITTED: {
    title: "Grievance Submitted",
    description: "Your grievance has been successfully submitted and recorded in our system.",
    color: "bg-gray-200",
  },
  ACKNOWLEDGED: {
    title: "Acknowledged",
    description: "Your grievance has been reviewed by the department and is awaiting assignment.",
    color: "bg-yellow-400",
  },
  ASSIGNED: {
    title: "Assigned to Officer",
    description: "An officer has been specifically assigned to handle your grievance.",
    color: "bg-purple-500",
  },
  IN_PROGRESS: {
    title: "In Progress",
    description: "An officer has been assigned and is currently reviewing your case.",
    color: "bg-blue",
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    title: "Action Needed",
    description: "The assigned officer has requested additional information to proceed.",
    color: "bg-amber-500",
  },
  ACTION_TAKEN: {
    title: "Action Taken",
    description: "The department has taken preliminary action and is verifying completion.",
    color: "bg-emerald-500",
  },
  RESOLVED: {
    title: "Resolved",
    description: "Your grievance has been marked as resolved.",
    color: "bg-green-500",
  },
  CLOSED: {
    title: "Closed",
    description: "This grievance is officially closed.",
    color: "bg-gray-400",
  },
  REJECTED: {
    title: "Rejected",
    description: "Your grievance was reviewed but could not be processed further.",
    color: "bg-error",
  },
  REOPENED: {
    title: "Reopened",
    description: "This grievance has been reopened by the citizen for further review.",
    color: "bg-orange-500",
  },
  ESCALATED: {
    title: "Escalated",
    description: "This grievance has breached SLA and has been escalated for priority attention.",
    color: "bg-rose-500",
  },
  // Appeal Statuses
  APPEAL_SUBMITTED: {
    title: "Appeal Submitted",
    description: "An appeal has been submitted for this grievance.",
    color: "bg-red-500",
  },
  UNDER_REVIEW: {
    title: "Appeal Under Review",
    description: "The appeal is currently being reviewed by the department.",
    color: "bg-purple-500",
  },
  DECISION_MADE: {
    title: "Appeal Decision Made",
    description: "A decision has been made regarding the appeal.",
    color: "bg-green-500",
  },
};

export default function GrievanceTimeline({ history }: GrievanceTimelineProps) {
  // Sort descending so newest is at the top
  const sortedHistory = [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute top-3 bottom-0 left-[11px] w-0.5 bg-border" />

      <div className="space-y-8 relative">
        {sortedHistory.map((event, index) => {
          const config = timelineContent[event.status as GrievanceStatus | AppealStatus] || {
            title: event.status.replace(/_/g, " "),
            description: "Status updated.",
            color: "bg-gray-400",
          };

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative"
            >
              {/* Dot */}
              <div 
                className={`absolute -left-[30px] top-1.5 w-[14px] h-[14px] rounded-full border-2 border-white shadow-sm z-10 ${config.color}`} 
              />
              
              <div>
                <h4 className="text-sm font-bold text-text-primary">{config.title}</h4>
                <p suppressHydrationWarning className="text-xs text-text-muted mt-1">
                  {new Date(event.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {config.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
