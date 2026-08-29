// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    // Verify bearer token (e.g. cron secret) if needed for security, or use Supabase anon/service role auth.
    // For local dev, we might bypass this.

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch Overdue Grievances
    const { data: overdueGrievances, error: fetchError } = await supabase
      .from("grievances")
      .select(`
        id, 
        grievance_number, 
        citizen_id, 
        department_id,
        grievance_assignments (officer_id)
      `)
      .lt("due_date", new Date().toISOString())
      .not("status", "in", '("RESOLVED","CLOSED","REJECTED","ESCALATED")');

    if (fetchError) throw fetchError;

    let escalatedCount = 0;

    for (const g of overdueGrievances || []) {
      // Transition to ESCALATED
      const { error: updateError } = await supabase
        .from("grievances")
        .update({ status: "ESCALATED", updated_at: new Date().toISOString() })
        .eq("id", g.id);

      if (updateError) {
        console.error(`Failed to escalate grievance ${g.id}`, updateError);
        continue;
      }

      // Add to status history
      await supabase
        .from("grievance_status_history")
        .insert({
          grievance_id: g.id,
          status: "ESCALATED",
        });

      // Find Department Admin
      const { data: deptAdmins } = await supabase
        .from("profiles")
        .select("id")
        .eq("department_id", g.department_id)
        .eq("role", "DEPARTMENT_ADMIN");

      const notifications = [];

      // Citizen notification
      notifications.push({
        user_id: g.citizen_id,
        grievance_id: g.id,
        type: "STATUS_CHANGE",
        message: `Your grievance ${g.grievance_number} has been escalated for priority attention. The Department Admin has been notified.`
      });

      // Assigned Officer notification
      if (g.grievance_assignments && g.grievance_assignments.length > 0) {
        g.grievance_assignments.forEach((a: any) => {
          notifications.push({
            user_id: a.officer_id,
            grievance_id: g.id,
            type: "ESCALATION",
            message: `Grievance ${g.grievance_number} assigned to you has breached SLA and is now ESCALATED.`
          });
        });
      }

      // Dept Admin notification
      if (deptAdmins) {
        deptAdmins.forEach((admin: any) => {
          notifications.push({
            user_id: admin.id,
            grievance_id: g.id,
            type: "ESCALATION",
            message: `Grievance ${g.grievance_number} in your department has breached SLA and is now ESCALATED.`
          });
        });
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }

      escalatedCount++;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      escalatedCount
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Escalation Job Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
