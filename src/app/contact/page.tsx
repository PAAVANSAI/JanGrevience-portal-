import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";

export const dynamic = "force-dynamic"; // Always fetch latest contacts to reflect Admin edits immediately

export default async function ContactPage() {
  const supabase = await createClient();

  // Fetch all active contacts, including department name if linked
  const { data: contacts } = await supabase
    .from("department_contacts")
    .select(`
      *,
      departments(name)
    `)
    .order("officer_name", { ascending: true });

  // Separate general contacts from departmental contacts
  const generalContacts = contacts?.filter(c => !c.department_id) || [];
  const deptContacts = contacts?.filter(c => c.department_id) || [];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy tracking-tight mb-2">Contact Us</h1>
          <p className="text-lg text-text-secondary">Directory of Nodal Officers and Public Grievance Contacts</p>
        </div>

        {/* Guidance Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm mb-10">
          <div className="flex items-start gap-4">
            <div className="text-amber-600 mt-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">Important Notice</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                Please do not contact these officers directly by email or phone to lodge a new grievance. 
                All grievances must be submitted through the official platform to ensure they are tracked, assigned, and resolved within our service level agreements.
              </p>
              <div className="mt-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center text-sm font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2"
                >
                  Click here to submit a grievance →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* General Contacts Block */}
        {generalContacts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-navy mb-6 pb-2 border-b border-border">Central Grievance Cell</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generalContacts.map((contact, idx) => (
                <div key={contact.id} className="bg-surface border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-text-primary">{contact.officer_name}</h3>
                  <p className="text-sm font-medium text-blue mb-3">{contact.designation}</p>
                  
                  <div className="space-y-2 text-sm">
                    {contact.dealing_with && (
                      <div className="flex items-start gap-3 text-text-secondary">
                        <svg className="w-5 h-5 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        <span>{contact.dealing_with}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 text-text-secondary">
                        <svg className="w-5 h-5 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <a href={`tel:${contact.phone}`} className="hover:text-blue hover:underline">{contact.phone}</a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-3 text-text-secondary">
                        <svg className="w-5 h-5 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Contacts Directory */}
        <div>
          <h2 className="text-xl font-bold text-navy mb-6 pb-2 border-b border-border">Department Nodal Officers</h2>
          
          {!deptContacts || deptContacts.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center text-text-secondary">
              No department officers listed at this time.
            </div>
          ) : (
            <>
              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Name & Designation</th>
                      <th className="px-6 py-4">Dealing With (Subject Area)</th>
                      <th className="px-6 py-4">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deptContacts.map((contact, index) => (
                      <tr key={contact.id} className="hover:bg-bg/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-text-primary text-base">{contact.officer_name}</div>
                          <div className="text-blue font-medium mt-0.5">{contact.designation}</div>
                          <div className="text-text-muted text-xs mt-1">{contact.departments?.name}</div>
                        </td>
                        <td className="px-6 py-4 align-top pt-5">
                          <span className="text-text-secondary">{contact.dealing_with || "General Department Matters"}</span>
                        </td>
                        <td className="px-6 py-4 align-top pt-5">
                          {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="text-text-primary hover:text-blue hover:underline font-medium">
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-text-muted italic">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Hidden on md and up) */}
              <div className="md:hidden space-y-4">
                {deptContacts.map((contact, index) => (
                  <div key={contact.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <div className="mb-3">
                      <div className="font-bold text-text-primary text-lg">{contact.officer_name}</div>
                      <div className="text-blue font-medium text-sm">{contact.designation}</div>
                      <div className="text-text-muted text-xs mt-0.5">{contact.departments?.name}</div>
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-border/50 text-sm">
                      <div>
                        <span className="block text-xs font-semibold text-text-muted uppercase mb-1">Dealing With</span>
                        <span className="text-text-secondary">{contact.dealing_with || "General Department Matters"}</span>
                      </div>
                      
                      {contact.phone && (
                        <div>
                          <span className="block text-xs font-semibold text-text-muted uppercase mb-1">Phone Number</span>
                          <a href={`tel:${contact.phone}`} className="text-text-primary font-medium flex items-center gap-2 active:text-blue">
                            <svg className="w-4 h-4 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}
