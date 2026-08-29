import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");
  const pageSize = 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Calculate pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Fetch notifications
  const { data: notifications, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  // Mark all fetched notifications as read on this page (or could have a button for it)
  // To keep it simple, we don't automatically mark all read here, but provide a button via Client component 
  // Wait, easiest is just a server action or client component to clear. For now we just list them.

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Your Notifications
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Stay updated on your grievances and assignments.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          {(!notifications || notifications.length === 0) ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-medium text-text-primary">All caught up</h3>
              <p className="mt-1 text-sm text-text-muted">You have no notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                // Determine base URL based on role (we don't strictly know role here easily without fetching profile, 
                // but we can assume /grievances/ is fine for citizen. For officer, it might be /officer/grievances/. 
                // Let's use a client component or rely on the bell for exact routing. 
                // For this page, we'll just link to /grievances/ for now, or check role.)
                
                return (
                  <div key={notif.id} className={`p-5 flex items-start gap-4 transition-colors hover:bg-bg ${!notif.is_read ? 'bg-blue/5' : ''}`}>
                    {!notif.is_read && <div className="w-2.5 h-2.5 rounded-full bg-blue mt-2 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-text-primary ${!notif.is_read ? 'font-medium' : ''}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-text-muted mt-1.5">
                        {new Date(notif.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {notif.grievance_id && (
                      <Link 
                        href={`/grievances/${notif.grievance_id}`}
                        className="text-sm font-medium text-blue bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-[var(--radius-md)] transition-colors whitespace-nowrap"
                      >
                        View Case
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center bg-surface border border-border p-4 rounded-xl shadow-sm">
            <Link
              href={page > 1 ? `/notifications?page=${page - 1}` : '#'}
              className={`px-4 py-2 text-sm font-medium rounded-md border border-border transition-colors ${
                page > 1 ? 'text-text-primary bg-bg hover:bg-gray-100' : 'text-text-muted bg-gray-50 cursor-not-allowed'
              }`}
            >
              Previous
            </Link>
            <span className="text-sm text-text-secondary">
              Page <span className="font-semibold text-text-primary">{page}</span> of <span className="font-semibold text-text-primary">{totalPages}</span>
            </span>
            <Link
              href={page < totalPages ? `/notifications?page=${page + 1}` : '#'}
              className={`px-4 py-2 text-sm font-medium rounded-md border border-border transition-colors ${
                page < totalPages ? 'text-text-primary bg-bg hover:bg-gray-100' : 'text-text-muted bg-gray-50 cursor-not-allowed'
              }`}
            >
              Next
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}
