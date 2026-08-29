import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuditLogsPage({ searchParams }: { searchParams: { query?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure they are SUPER_ADMIN
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "SUPER_ADMIN") {
    redirect("/citizen");
  }

  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);

  if (searchParams.query) {
    query = query.or(`resource_id.eq.${searchParams.query},action_type.ilike.%${searchParams.query}%`);
  }

  const { data: logs, error } = await query;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Audit Logs</h1>
          <p className="text-sm text-text-secondary mt-1">Immutable record of all sensitive actions across the platform.</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-bg/50">
          <form className="max-w-md">
            <label className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="query"
                defaultValue={searchParams.query || ""}
                placeholder="Search by Action Type or Resource ID..."
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue sm:text-sm"
              />
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg text-text-muted text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No audit logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary font-medium">{log.user_id?.slice(0,8)}...</div>
                      <div className="text-xs text-text-muted">{log.user_role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        log.action_type.includes("STATUS") ? "bg-amber-50 text-amber-700 border-amber-200" :
                        log.action_type.includes("ROLE") ? "bg-purple-50 text-purple-700 border-purple-200" :
                        log.action_type.includes("ASSIGN") ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary">{log.resource_type}</div>
                      <div className="text-xs font-mono text-text-muted">{log.resource_id?.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.new_value && (
                        <div className="text-xs space-y-1">
                          {log.previous_value && Object.keys(log.previous_value).map(k => (
                            <div key={k} className="text-text-secondary">
                              <span className="line-through text-red-500 mr-1">{JSON.stringify(log.previous_value[k])}</span>
                              <span className="text-green-600">→ {JSON.stringify(log.new_value[k])}</span>
                            </div>
                          ))}
                          {!log.previous_value && Object.keys(log.new_value).map(k => (
                            <div key={k} className="text-text-secondary">
                              <span className="font-medium">{k}:</span> <span className="text-green-600">{JSON.stringify(log.new_value[k])}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
