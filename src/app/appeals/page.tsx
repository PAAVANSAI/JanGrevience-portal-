import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function AppealsListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1", 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch paginated appeals
  const { data: appeals, count } = await supabase
    .from("appeals")
    .select(`
      id,
      appeal_number,
      reason,
      status,
      created_at,
      grievances (grievance_number, id)
    `, { count: "exact" })
    .eq("citizen_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/citizen" className="text-sm font-medium text-text-muted hover:text-blue transition-colors">
                Dashboard
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-sm font-medium text-text-primary">My Appeals</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Appeals</h1>
          </div>
        </div>

        {(!appeals || appeals.length === 0) ? (
          <div className="bg-gradient-to-b from-surface to-bg border border-border rounded-3xl p-12 text-center max-w-3xl mx-auto mt-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-navy"></div>
            <div className="mx-auto w-20 h-20 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-purple-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-navy mb-3">You haven't filed any appeals yet</h3>
            <p className="text-base text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
              If you are unsatisfied with the resolution of a grievance, you can file an appeal from the grievance's details page.
            </p>
            <Link 
              href="/grievances"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 py-3.5 text-base font-semibold bg-purple-600 text-white hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              View resolved grievances
            </Link>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Appeal ID</th>
                    <th className="px-6 py-4">Original Grievance</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appeals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-bg/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link href={`/appeals/${a.id}`} className="text-blue hover:underline group-hover:text-blue-hover">
                          {a.appeal_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <Link href={`/grievances/${a.grievances?.id}`} className="text-text-secondary hover:text-blue transition-colors">
                          {a.grievances?.grievance_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary max-w-[150px] sm:max-w-[250px] truncate" title={a.reason}>
                          <Link href={`/appeals/${a.id}`} className="hover:text-blue transition-colors">
                            {a.reason}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-text-secondary hidden sm:table-cell">
                        {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-bg/50">
                <div className="text-sm text-text-secondary">
                  Showing {from + 1} to {Math.min(to + 1, count || 0)} of {count} entries
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/appeals?page=${page - 1}`}
                    className={`px-3 py-1.5 rounded text-sm font-medium border border-border ${page <= 1 ? "opacity-50 pointer-events-none text-text-muted bg-bg" : "text-text-primary bg-surface hover:bg-bg"}`}
                    aria-disabled={page <= 1}
                  >
                    Previous
                  </Link>
                  <Link 
                    href={`/appeals?page=${page + 1}`}
                    className={`px-3 py-1.5 rounded text-sm font-medium border border-border ${page >= totalPages ? "opacity-50 pointer-events-none text-text-muted bg-bg" : "text-text-primary bg-surface hover:bg-bg"}`}
                    aria-disabled={page >= totalPages}
                  >
                    Next
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
