import React from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default function AppealsInfoPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-navy mb-4">Appeals Information</h1>
        <p className="text-lg text-text-secondary mb-8">
          Not satisfied with the resolution of your grievance? You have the right to appeal.
        </p>

        <div className="space-y-8">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-text-primary mb-4">When can I file an appeal?</h2>
            <p className="text-text-secondary mb-4 leading-relaxed">
              You become eligible to file an appeal under two conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-text-secondary mb-4">
              <li>
                <strong className="text-text-primary">Resolution Unsatisfactory:</strong> Your grievance has been marked as <b>RESOLVED</b>, but you are not satisfied with the outcome or the action taken.
              </li>
              <li>
                <strong className="text-text-primary">SLA Breached:</strong> The Department has failed to resolve your grievance within the stipulated timeframe (SLA Target Days), and the status is still pending.
              </li>
            </ul>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-text-primary mb-4">How does the appeal process work?</h2>
            <p className="text-text-secondary mb-4 leading-relaxed">
              When you file an appeal, your grievance is escalated to a higher-ranking Nodal Authority within the department. They will independently review the original grievance, the officer's resolution notes, and the reasons you provided for your appeal.
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-text-secondary">
              <li>Navigate to your Dashboard and select the eligible grievance.</li>
              <li>Click the "File Appeal" button.</li>
              <li>Provide a clear reason and description for why you are appealing.</li>
              <li>Track the status of your appeal directly from the Appeals section.</li>
            </ol>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/track" 
            className="inline-flex justify-center rounded-[var(--radius-md)] px-6 py-3 text-base font-semibold bg-blue text-white hover:bg-blue-hover transition-colors"
          >
            Track My Grievance
          </Link>
        </div>
      </main>
    </div>
  );
}
