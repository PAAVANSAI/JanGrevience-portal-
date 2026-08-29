export type UserRole = "CITIZEN" | "OFFICER" | "DEPT_ADMIN" | "SUPER_ADMIN";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_deleted: boolean;
  gender: string | null;
  address_line: string | null;
  sub_locality: string | null;
  country: string | null;
  state_id: string | null;
  district_id: string | null;
  pincode: string | null;
  landline_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginActivity {
  id: string;
  user_id: string;
  logged_in_at: string;
  ip_address: string | null;
  device_info: string | null;
}

export interface State {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

export interface District {
  id: string;
  state_id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DepartmentContact {
  id: string;
  department_id: string | null;
  officer_name: string;
  designation: string;
  dealing_with: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  updated_at: string;
}

export interface Category {
  id: string;
  department_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type GrievanceStatus = 
  | "SUBMITTED" 
  | "ACKNOWLEDGED" 
  | "ASSIGNED" 
  | "IN_PROGRESS" 
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "ACTION_TAKEN"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED"
  | "REJECTED"
  | "ESCALATED";

export type AppealStatus = 
  | "APPEAL_SUBMITTED"
  | "UNDER_REVIEW"
  | "DECISION_MADE"
  | "CLOSED";

export type GrievancePriority = "LOW" | "MEDIUM" | "HIGH";

export interface GrievanceAssignment {
  id: string;
  grievance_id: string;
  officer_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface GrievanceComment {
  id: string;
  grievance_id: string;
  author_id: string;
  author_role: string;
  comment_text: string;
  is_visible_to_citizen: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export interface Grievance {
  id: string;
  grievance_number: string;
  citizen_id: string;
  subject: string;
  description: string;
  department_id: string;
  category_id: string;
  state: string;
  district: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  due_date: string | null;
  resolution_confirmed: boolean | null;
  resolution_dispute_count: number;
  created_at: string;
  updated_at: string;
}

export interface GrievanceAttachment {
  id: string;
  grievance_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  context: string;
  uploaded_at: string;
}

export interface GrievanceStatusHistory {
  id: string;
  grievance_id: string;
  status: GrievanceStatus;
  created_at: string;
}

export interface Feedback {
  id: string;
  grievance_id: string;
  citizen_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Appeal {
  id: string;
  appeal_number: string;
  grievance_id: string;
  citizen_id: string;
  reason: string;
  description: string;
  status: AppealStatus;
  decision_outcome: string | null;
  decision_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppealStatusHistory {
  id: string;
  appeal_id: string;
  status: AppealStatus;
  created_at: string;
}

export interface SlaRule {
  id: string;
  category_id: string;
  target_days: number;
  reminder_threshold_percent: number;
  is_active: boolean;
  created_at: string;
}

export interface GrievanceAiClassification {
  id: string;
  grievance_id: string | null;
  citizen_id: string;
  input_text: string;
  suggested_department_id: string | null;
  suggested_category_id: string | null;
  suggested_priority: GrievancePriority | null;
  confidence: number | null;
  reasoning: string | null;
  was_accepted: boolean;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Database schema definition for Supabase client
export interface Database {
  public: {
    Tables: {
      states: {
        Row: State;
        Insert: Omit<State, "id" | "created_at">;
        Update: Partial<Omit<State, "id" | "created_at">>;
      };
      districts: {
        Row: District;
        Insert: Omit<District, "id" | "created_at">;
        Update: Partial<Omit<District, "id" | "created_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "role" | "created_at" | "updated_at">>;
      };
      departments: {
        Row: Department;
        Insert: Omit<Department, "id" | "created_at">;
        Update: Partial<Omit<Department, "id" | "created_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      sla_rules: {
        Row: SlaRule;
        Insert: Omit<SlaRule, "id" | "created_at">;
        Update: Partial<Omit<SlaRule, "id" | "created_at">>;
      };
      grievances: {
        Row: Grievance;
        Insert: Omit<Grievance, "id" | "grievance_number" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Grievance, "id" | "grievance_number" | "citizen_id" | "created_at" | "updated_at">>;
      };
      grievance_attachments: {
        Row: GrievanceAttachment;
        Insert: Omit<GrievanceAttachment, "id" | "uploaded_at">;
        Update: Partial<Omit<GrievanceAttachment, "id" | "uploaded_at">>;
      };
      grievance_status_history: {
        Row: GrievanceStatusHistory;
        Insert: Omit<GrievanceStatusHistory, "id" | "created_at">;
        Update: Partial<Omit<GrievanceStatusHistory, "id" | "created_at">>;
      };
      feedback: {
        Row: Feedback;
        Insert: Omit<Feedback, "id" | "created_at">;
        Update: Partial<Omit<Feedback, "id" | "created_at">>;
      };
      appeals: {
        Row: Appeal;
        Insert: Omit<Appeal, "id" | "appeal_number" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Appeal, "id" | "appeal_number" | "citizen_id" | "created_at" | "updated_at">>;
      };
      appeal_status_history: {
        Row: AppealStatusHistory;
        Insert: Omit<AppealStatusHistory, "id" | "created_at">;
        Update: Partial<Omit<AppealStatusHistory, "id" | "created_at">>;
      };
      grievance_ai_classifications: {
        Row: GrievanceAiClassification;
        Insert: Omit<GrievanceAiClassification, "id" | "created_at">;
        Update: Partial<Omit<GrievanceAiClassification, "id" | "created_at">>;
      };
      system_settings: {
        Row: SystemSetting;
        Insert: Omit<SystemSetting, "updated_at">;
        Update: Partial<Omit<SystemSetting, "updated_at">>;
      };
    };
  };
}
