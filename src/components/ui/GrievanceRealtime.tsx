"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface GrievanceRealtimeProps {
  grievanceId: string;
}

export default function GrievanceRealtime({ grievanceId }: GrievanceRealtimeProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for any updates on this specific grievance with a unique channel name
    const grievanceSubscription = supabase
      .channel(`grievance-${grievanceId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "grievances", filter: `id=eq.${grievanceId}` },
        (payload) => {
          console.log("Realtime update received for grievance status", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "grievance_comments", filter: `grievance_id=eq.${grievanceId}` },
        (payload) => {
          console.log("Realtime update received for new comment", payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(grievanceSubscription);
    };
  }, [grievanceId, supabase, router]);

  return null; // This component is strictly logic-only, no UI
}
