import { Grievance, SlaRule } from "@/types/database";

export type SlaUrgency = "green" | "amber" | "red";

export interface SlaStatus {
  daysRemaining: number;
  urgencyLevel: SlaUrgency;
  isOverdue: boolean;
  dueDate: Date | null;
}

export function calculateSlaStatus(
  grievance: Grievance,
  slaRule?: SlaRule | null
): SlaStatus | null {
  if (!grievance.due_date) {
    return null; // Due date not set
  }

  const dueDate = new Date(grievance.due_date);
  const now = new Date();
  
  // Calculate difference in days
  const timeDiff = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  const isOverdue = daysRemaining < 0;

  let urgencyLevel: SlaUrgency = "green";

  if (isOverdue) {
    urgencyLevel = "red";
  } else if (slaRule) {
    // If we have the rule, check reminder threshold. e.g. 80% means 20% remaining
    const totalDays = slaRule.target_days;
    // Calculate how many days is 20% of the total target days
    const remainingPercentage = (daysRemaining / totalDays) * 100;
    
    // E.g., if threshold is 80%, then at <= 20% we turn amber
    const amberThreshold = 100 - slaRule.reminder_threshold_percent;
    
    if (remainingPercentage <= amberThreshold) {
      urgencyLevel = "amber";
    }
  } else {
    // Fallback if no slaRule provided: amber if <= 2 days
    if (daysRemaining <= 2) {
      urgencyLevel = "amber";
    }
  }

  return {
    daysRemaining,
    urgencyLevel,
    isOverdue,
    dueDate,
  };
}
