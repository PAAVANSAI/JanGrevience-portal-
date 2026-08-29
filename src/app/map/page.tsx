"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import dynamic from "next/dynamic";

// Dynamic import for the entire map component to avoid SSR and context chunking issues
const LiveMap = dynamic(() => import("@/components/ui/LiveMap"), { ssr: false, loading: () => <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex items-center justify-center"><div className="text-text-muted font-medium">Loading Map Data...</div></div> });

export default function LiveMapPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const res = await fetch("/api/map");
        const data = await res.json();
        if (data.grievances) {
          setGrievances(data.grievances);
        }
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      }
      setLoading(false);
    }

    fetchMapData();
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            Live Public Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Explore unresolved civic issues reported across the region. Upvote issues to escalate their priority.
          </p>
        </div>

        <div className="flex-1 bg-surface border border-border rounded-2xl overflow-hidden shadow-sm relative min-h-[500px]">
          {loading && (
            <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-text-muted font-medium">Loading Map Data...</div>
            </div>
          )}
          
          {!loading && <LiveMap grievances={grievances} />}
        </div>
      </main>
    </div>
  );
}
