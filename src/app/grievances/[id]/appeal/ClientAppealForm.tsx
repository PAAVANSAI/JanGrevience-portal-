"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ClientAppealFormProps {
  grievanceId: string;
  grievanceNumber: string;
}

export default function ClientAppealForm({ grievanceId, grievanceNumber }: ClientAppealFormProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
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
    if (!reason || !description.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Insert Appeal
      const { data: appeal, error: appealError } = await supabase
        .from("appeals")
        .insert({
          grievance_id: grievanceId,
          citizen_id: user.id,
          reason,
          description: description.trim(),
        })
        .select()
        .single();

      if (appealError || !appeal) throw appealError || new Error("Failed to create appeal");

      // 2. Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("grievance_attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase
            .from("grievance_attachments")
            .insert({
              grievance_id: grievanceId,
              appeal_id: appeal.id, // Link to appeal
              file_name: file.name,
              file_path: filePath,
              file_type: file.type || "application/octet-stream",
              file_size: file.size,
            });

          if (dbError) throw dbError;
        }
      }

      // Success!
      router.push(`/grievances/${grievanceId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit appeal: " + err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-text-primary mb-2">
          Reason for Appeal *
        </label>
        <select
          id="reason"
          required
          className="w-full bg-bg border border-border rounded-[var(--radius-md)] px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue transition-all"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        >
          <option value="" disabled>Select a reason</option>
          <option value="Issue not resolved completely">Issue not resolved completely</option>
          <option value="Incorrect resolution provided">Incorrect resolution provided</option>
          <option value="Resolution takes too long">Resolution takes too long</option>
          <option value="Closed without my consent">Closed without my consent</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
          Detailed Description *
        </label>
        <textarea
          id="description"
          required
          rows={5}
          className="w-full bg-bg border border-border rounded-[var(--radius-md)] px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue transition-all"
          placeholder="Please explain why you are appealing this resolution..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Supporting Documents (Optional)
        </label>
        
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-blue/10 text-blue text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button type="button" onClick={() => removeFile(idx)} className="hover:text-red-500 font-bold">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center">
          <input
            type="file"
            id="appeal-file-upload"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
            accept="image/*,.pdf,.doc,.docx"
          />
          <label 
            htmlFor="appeal-file-upload" 
            className="cursor-pointer text-sm font-medium text-text-secondary hover:text-blue flex items-center gap-2 transition-colors border border-dashed border-border px-4 py-3 rounded-[var(--radius-md)] hover:bg-blue/5 w-full justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Click to attach files (Max 5MB each)
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-text-muted hover:text-text-primary font-medium text-sm transition-colors mr-4"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !reason || !description.trim()}
          className="bg-blue hover:bg-blue-hover text-white px-8 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Appeal"}
        </button>
      </div>
    </form>
  );
}
