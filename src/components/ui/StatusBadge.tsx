import React from "react";
import type { GrievanceStatus, AppealStatus } from "@/types/database";

interface StatusBadgeProps {
  status: GrievanceStatus | AppealStatus;
  className?: string;
}

const statusConfig: Record<GrievanceStatus | AppealStatus, { label: string; classes: string }> = {
  SUBMITTED: {
    label: "Submitted",
    classes: "bg-gray-50 text-gray-700 border-gray-200",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  ASSIGNED: {
    label: "Assigned",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    classes: "bg-blue-50 text-blue border-blue-light",
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    label: "Info Required",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ACTION_TAKEN: {
    label: "Action Taken",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  RESOLVED: {
    label: "Resolved",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  CLOSED: {
    label: "Closed",
    classes: "bg-gray-100 text-gray-500 border-gray-300",
  },
  REJECTED: {
    label: "Rejected",
    classes: "bg-red-50 text-error border-red-200",
  },
  REOPENED: {
    label: "Reopened",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  ESCALATED: {
    label: "Escalated",
    classes: "bg-rose-50 text-rose-700 border-rose-200",
  },
  // Appeal Statuses
  APPEAL_SUBMITTED: {
    label: "Appeal Submitted",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
  DECISION_MADE: {
    label: "Decision Made",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status as GrievanceStatus] || {
    label: status.replace(/_/g, " "),
    classes: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
