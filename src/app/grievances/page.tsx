import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function AllGrievancesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
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

  // Fetch paginated grievances
  const { data: grievances, count } = await supabase
    .from("grievances")
    .select(`
      id,
      grievance_number,
      subject,
      status,
      created_at,
      departments (name),
      categories (name)
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
              <span className="text-sm font-medium text-text-primary">All Grievances</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">All Grievances</h1>
          </div>
          <Link 
            href="/grievances/new"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold bg-blue text-white hover:bg-blue-hover focus:ring-2 focus:ring-offset-2 focus:ring-blue shadow-sm transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            File New
          </Link>
        </div>

        {(!grievances || grievances.length === 0) ? (
          <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-text-primary mb-1">No grievances found</h3>
            <p className="text-sm text-text-secondary">It looks like there's nothing on this page.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Grievance ID</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grievances.map((g: any) => (
                    <tr key={g.id} className="hover:bg-bg/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium">
                        <Link href={`/grievances/${g.id}`} className="text-blue hover:underline group-hover:text-blue-hover">
                          {g.grievance_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary max-w-[150px] sm:max-w-[250px] truncate" title={g.subject}>
                          <Link href={`/grievances/${g.id}`} className="hover:text-blue transition-colors">
                            {g.subject}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="text-text-primary truncate max-w-[150px]">{g.departments?.name}</div>
                        <div className="text-xs text-text-muted truncate max-w-[150px]">{g.categories?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-text-secondary hidden sm:table-cell">
                        {new Date(g.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-bg border-t border-border px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Showing <span className="font-medium text-text-primary">{from + 1}</span> to <span className="font-medium text-text-primary">{Math.min(to + 1, count || 0)}</span> of <span className="font-medium text-text-primary">{count}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/grievances?page=${page - 1}`}
                    className={`px-3 py-1.5 text-sm font-medium border border-border rounded-md transition-colors ${page <= 1 ? 'opacity-50 pointer-events-none text-text-muted bg-gray-50' : 'bg-surface text-text-primary hover:bg-bg hover:border-blue/30'}`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={`/grievances?page=${page + 1}`}
                    className={`px-3 py-1.5 text-sm font-medium border border-border rounded-md transition-colors ${page >= totalPages ? 'opacity-50 pointer-events-none text-text-muted bg-gray-50' : 'bg-surface text-text-primary hover:bg-bg hover:border-blue/30'}`}
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
