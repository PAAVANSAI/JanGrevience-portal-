"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GrievanceComment, GrievanceStatus } from "@/types/database";

interface CommentThreadProps {
  grievanceId: string;
  currentStatus: GrievanceStatus;
  comments: GrievanceComment[];
  userRole: string; // 'CITIZEN' or 'OFFICER' etc.
  // If true, shows the input box to reply
  canReply?: boolean;
}

export default function CommentThread({ grievanceId, currentStatus, comments, userRole, canReply = false }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024); // 5MB limit
      if (validFiles.length !== files.length) {
        alert("Some files were too large (max 5MB).");
      }
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Upload files first if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("grievance_attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Insert into grievance_attachments table
          const { error: dbError } = await supabase
            .from("grievance_attachments")
            .insert({
              grievance_id: grievanceId,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type || "application/octet-stream",
              file_size: file.size,
            });

          if (dbError) throw dbError;
        }
      }

      // 2. Insert comment if there is text
      if (newComment.trim()) {
        const { error } = await supabase.from("grievance_comments").insert({
          grievance_id: grievanceId,
          author_id: user.id,
          author_role: userRole,
          comment_text: newComment.trim(),
          is_visible_to_citizen: true // Default for Phase 7
        });

        if (error) throw error;
      }

      // Automatically move back to IN_PROGRESS if citizen is replying to an info request
      if (userRole === "CITIZEN" && currentStatus === "ADDITIONAL_INFORMATION_REQUIRED") {
        await supabase.from("grievances").update({ status: "IN_PROGRESS" }).eq("id", grievanceId);
      }
      
      setNewComment("");
      setSelectedFiles([]);
      
      if (userRole === "CITIZEN") {
        window.location.reload(); // Hard reload for citizen to ensure banner disappears and status syncs
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to post comment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* List of comments */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-text-muted italic">No comments or remarks yet.</p>
        ) : (
          comments.map((comment) => {
            const isOfficer = comment.author_role !== "CITIZEN";
            return (
              <div 
                key={comment.id} 
                className={`p-4 rounded-xl border ${
                  isOfficer ? "bg-blue/5 border-blue/20 ml-4 sm:ml-8" : "bg-surface border-border mr-4 sm:mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isOfficer ? "text-blue" : "text-text-primary"}`}>
                    {isOfficer ? "Department Official" : "Citizen"}
                    {isOfficer && comment.profiles?.full_name ? ` (${comment.profiles.full_name})` : ""}
                  </span>
                  <span className="text-xs text-text-muted" suppressHydrationWarning>
                    {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{comment.comment_text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Box */}
      {canReply && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border">
          <label htmlFor="comment" className="block text-sm font-medium text-text-primary mb-2">
            Add a reply or note
          </label>
          <textarea
            id="comment"
            rows={3}
            className="w-full bg-bg border border-border rounded-[var(--radius-md)] px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all mb-3 text-sm"
            placeholder="Type your message here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue/10 text-blue text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-500 font-bold">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
                accept="image/*,.pdf,.doc,.docx"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer text-sm font-medium text-text-secondary hover:text-blue flex items-center gap-1.5 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                Attach files
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || (!newComment.trim() && selectedFiles.length === 0)}
              className="bg-blue hover:bg-blue-hover text-white px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
