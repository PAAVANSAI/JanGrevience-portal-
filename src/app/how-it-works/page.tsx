import React from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      status: "SUBMITTED",
      title: "1. Grievance Submission",
      description: "You submit a grievance with relevant details and documents. You will receive a unique tracking ID.",
    },
    {
      status: "ASSIGNED",
      title: "2. Assignment to Department",
      description: "The system automatically routes your grievance to the correct department and assigns it to a Nodal Officer.",
    },
    {
      status: "IN_PROGRESS",
      title: "3. Review & Action",
      description: "The assigned officer reviews the details. They may request additional information from you if needed.",
    },
    {
      status: "RESOLVED",
      title: "4. Resolution",
      description: "Once the issue is addressed, the officer marks it as Resolved and provides a resolution note.",
    },
    {
      status: "CLOSED",
      title: "5. Closure",
      description: "After resolution, the grievance is officially closed. If you are unsatisfied, you may be eligible to file an appeal.",
    }
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-navy mb-4">How It Works</h1>
        <p className="text-lg text-text-secondary mb-12">
          Understanding the lifecycle of a grievance on the JanGrievance platform.
        </p>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
          {steps.map((step, index) => (
            <div key={step.status} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg bg-blue text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                {index + 1}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-text-primary text-lg">{step.title}</h3>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link 
            href="/grievances/new" 
            className="inline-flex justify-center rounded-[var(--radius-md)] px-6 py-3 text-base font-semibold bg-blue text-white hover:bg-blue-hover transition-colors"
          >
            Submit a Grievance Now
          </Link>
        </div>
      </main>
    </div>
  );
}
