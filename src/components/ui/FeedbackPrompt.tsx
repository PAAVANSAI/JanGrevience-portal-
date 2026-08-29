"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackPromptProps {
  grievanceId: string;
  hasFeedback: boolean;
  grievanceStatus: string;
  canAppeal?: boolean;
}

export default function FeedbackPrompt({ grievanceId, hasFeedback, grievanceStatus, canAppeal = true }: FeedbackPromptProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(hasFeedback);
  const router = useRouter();
  const supabase = createClient();

  // Only show if RESOLVED and no feedback exists (or we just submitted it)
  if (grievanceStatus !== "RESOLVED" && grievanceStatus !== "CLOSED" && !submitted) return null;
  if (hasFeedback && !submitted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("feedback").insert({
        grievance_id: grievanceId,
        citizen_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
      
      // Auto-close if rating is positive (3-5 stars)
      if (rating >= 3) {
        await supabase.rpc('citizen_close_grievance', { p_grievance_id: grievanceId });
      }

      setSubmitted(true);
      router.refresh();
    } catch (err: any) {
      console.error("FULL ERROR:", err);
      alert("Failed to submit feedback:\n\n" + JSON.stringify(err, null, 2) + "\n\nMessage: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-3 mb-6"
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 className="text-lg font-semibold text-green-900">Thank you for your feedback!</h3>
        <p className="text-sm text-green-700 max-w-md">Your response helps us improve our services.</p>
        
        {rating > 0 && rating <= 2 && canAppeal && (
          <div className="mt-6 pt-6 border-t border-green-200 w-full text-center">
            <p className="text-sm text-green-800 mb-3 font-medium">Not satisfied with the resolution?</p>
            <button
              onClick={() => router.push(`/grievances/${grievanceId}/appeal`)}
              className="bg-white text-green-700 hover:bg-green-100 border border-green-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              File an Appeal
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-indigo-900">How was your experience?</h3>
          <p className="text-sm text-indigo-700">Please rate the resolution of your grievance.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center py-4 bg-white/60 rounded-xl border border-indigo-100/50">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transform transition-transform hover:scale-110 focus:outline-none"
              >
                <motion.svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{
                    fill: (hoverRating || rating) >= star ? "#F59E0B" : "transparent",
                    color: (hoverRating || rating) >= star ? "#F59E0B" : "#9CA3AF"
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </motion.svg>
              </button>
            ))}
          </div>
          <p className="text-xs font-medium text-indigo-400 mt-3 uppercase tracking-widest">
            {rating === 1 && "Very Dissatisfied"}
            {rating === 2 && "Dissatisfied"}
            {rating === 3 && "Neutral"}
            {rating === 4 && "Satisfied"}
            {rating === 5 && "Very Satisfied"}
            {rating === 0 && "Select a rating"}
          </p>
        </div>

        <AnimatePresence>
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-indigo-900 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Tell us what went well or what could be improved..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
