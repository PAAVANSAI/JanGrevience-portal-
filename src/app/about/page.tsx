import React from "react";
import Header from "@/components/layout/Header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-4">
              About JanGrievance
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Your independent, transparent, and efficient citizen grievance management platform.
            </p>
          </div>

          <div className="space-y-8 text-text-primary leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-navy mb-4">Our Mission</h2>
              <p className="mb-4">
                At JanGrievance, we believe that every citizen's voice matters. We created this platform to bridge the gap between citizens and departments, ensuring that complaints, suggestions, and grievances are heard and addressed with unprecedented transparency and efficiency.
              </p>
              <p>
                Our goal is not just to route grievances, but to track them to actual resolution, providing clear Service Level Agreements (SLAs), real-time updates, and ensuring accountability at every level.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-4">How We Stand Out</h2>
              <ul className="space-y-3 list-disc list-inside text-text-secondary">
                <li><strong className="text-text-primary">Transparency:</strong> You always know who is handling your grievance and its current status.</li>
                <li><strong className="text-text-primary">Accountability:</strong> Strict SLAs ensure that issues don't fall through the cracks without escalation.</li>
                <li><strong className="text-text-primary">Citizen-First:</strong> We ensure issues aren't closed until you confirm they are actually resolved.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-4">Who Is This For?</h2>
              <p>
                JanGrievance is for every citizen who wants to see real change in their community. Whether you're dealing with civic issues, departmental delays, or general complaints, our platform directs your voice to the right official, instantly.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
