import React from "react";
import { createClient } from "@/lib/supabase/server";

export default async function ActivitySection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: activityLogs } = await supabase
    .from("login_activity")
    .select("*")
    .eq("user_id", user?.id)
    .order("logged_in_at", { ascending: false })
    .limit(10);

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-border">
        <h2 className="text-xl font-bold text-navy mb-1">Account Activity</h2>
        <p className="text-sm text-text-secondary">
          Review your recent login sessions to ensure your account is secure.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Device Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!activityLogs || activityLogs.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-text-secondary">
                  No activity found.
                </td>
              </tr>
            ) : (
              activityLogs.map((log, index) => {
                const date = new Date(log.logged_in_at);
                const isCurrentSession = index === 0; // The most recent log is likely the current session
                
                return (
                  <tr key={log.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary flex items-center gap-2">
                        {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {isCurrentSession && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-text-muted text-xs mt-1">
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-secondary truncate max-w-xs sm:max-w-md" title={log.device_info || "Unknown Device"}>
                        {log.device_info || "Unknown Device"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
