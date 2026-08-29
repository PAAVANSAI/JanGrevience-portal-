import { GrievancePriority } from "./database";

export interface AiClassificationSuggestion {
  suggestedDepartmentId: string;
  suggestedCategoryId: string;
  suggestedPriority: GrievancePriority;
  confidence: number;
  reasoning: string;
}
