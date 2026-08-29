"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  grievanceId: string;
  initialCount: number;
}

export default function UpvoteButton({ grievanceId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function checkAuthAndVote() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("grievance_upvotes")
          .select("id")
          .eq("grievance_id", grievanceId)
          .eq("user_id", user.id)
          .single();
          
        if (data) {
          setHasVoted(true);
        }
      }
    }
    checkAuthAndVote();
  }, [supabase, grievanceId]);

  const handleUpvote = async () => {
    if (!userId) {
      alert("Please log in to upvote issues.");
      return;
    }
    if (hasVoted || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("upvote_grievance", { p_grievance_id: grievanceId });
      if (error) throw error;
      
      setHasVoted(true);
      setCount(prev => prev + 1);
    } catch (err: any) {
      console.error("Upvote failed:", err);
      // Suppress duplicate vote errors if they bypassed UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={hasVoted || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm ${
        hasVoted 
          ? "bg-blue-50 text-blue border-2 border-blue-200 cursor-default" 
          : "bg-surface border-2 border-border hover:border-blue hover:text-blue text-text-secondary"
      }`}
    >
      <span className={hasVoted ? "scale-110 transition-transform" : ""}>👍</span>
      <span>{count} Upvote{count !== 1 ? 's' : ''}</span>
      {hasVoted && <span className="ml-1 text-xs font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Voted</span>}
    </button>
  );
}
