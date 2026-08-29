import { SupabaseClient } from "@supabase/supabase-js";

export type AuditActionType = 
  | "STATUS_CHANGED" 
  | "ASSIGNED" 
  | "APPEAL_DECISION" 
  | "ROLE_CHANGED" 
  | "SLA_RULE_CHANGED"
  | "COMMON_ISSUE_CONFIRMED";

export interface AuditLogPayload {
  action_type: AuditActionType;
  resource_type: "grievance" | "appeal" | "profile" | "sla_rule" | "cluster";
  resource_id: string;
  previous_value?: any;
  new_value?: any;
}

export async function logAuditEvent(supabase: SupabaseClient, payload: AuditLogPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Fetch the user's role at the time of the action
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile) return false;

    // We fetch IP addresses on the server side in API routes typically,
    // but when called from a Client Component context, we might not have it.
    // For this scope, IP is left null unless passed from a strict backend endpoint.
    const { error } = await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_role: profile.role,
      action_type: payload.action_type,
      resource_type: payload.resource_type,
      resource_id: payload.resource_id,
      previous_value: payload.previous_value || null,
      new_value: payload.new_value || null,
    });

    if (error) {
      console.error("Failed to insert audit log:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Audit logging exception:", err);
    return false;
  }
}
