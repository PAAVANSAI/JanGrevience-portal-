"use client";

import React, { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import type { GrievanceFormData } from "@/lib/validations/grievance";
import { createClient } from "@/lib/supabase/client";
import AuthButton from "@/components/auth/AuthButton";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function StepDocuments({ onNext, onPrev }: Props) {
  const { watch, setValue, formState: { errors } } = useFormContext<GrievanceFormData>();
  const attachments = watch("attachments") || [];
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [maxSizeMb, setMaxSizeMb] = useState(5); // Default to 5MB

  React.useEffect(() => {
    async function fetchSize() {
      const { data } = await supabase.from("system_settings").select("value").eq("key", "max_attachment_size_mb").single();
      if (data && data.value) {
        setMaxSizeMb(Number(data.value) || 5);
      }
    }
    fetchSize();
  }, [supabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setUploadError("You can only upload up to 5 files.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const newAttachments = [...attachments];

      for (const file of files) {
        // Validate type
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
          throw new Error(`File ${file.name} is not a supported format.`);
        }
        // Validate size based on dynamic setting
        if (file.size > maxSizeMb * 1024 * 1024) {
          throw new Error(`File ${file.name} is larger than ${maxSizeMb}MB.`);
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("grievance_attachments")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        newAttachments.push({
          fileName: file.name,
          filePath: filePath,
          fileType: file.type,
          fileSize: file.size,
        });
      }

      setValue("attachments", newAttachments, { shouldValidate: true });
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const removeAttachment = async (indexToRemove: number) => {
    const attachmentToRemove = attachments[indexToRemove];
    
    // Optimistically update UI
    const updated = attachments.filter((_, idx) => idx !== indexToRemove);
    setValue("attachments", updated, { shouldValidate: true });

    // Try to remove from storage (fail silently if error to not block UI)
    await supabase.storage.from("grievance_attachments").remove([attachmentToRemove.filePath]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Supporting Documents</h2>
        <p className="text-text-secondary text-sm mt-1">Upload photos or PDFs that prove your claim. Max size is {maxSizeMb}MB per file.</p>
      </div>

      <div className="space-y-5 bg-surface p-6 rounded-xl border border-border">
        {uploadError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm font-medium">
            {uploadError}
          </div>
        )}

        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${uploading ? 'border-blue/50 bg-blue/5' : 'border-border hover:border-blue/50 hover:bg-bg cursor-pointer'}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue flex items-center justify-center">
              {uploading ? (
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeLinecap="round" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {uploading ? "Uploading..." : "Click or drag files here to upload"}
              </p>
              <p className="text-xs text-text-muted mt-1">PDF, JPG, PNG — up to 5MB each (Max 5 files)</p>
            </div>
          </div>
        </div>

        {errors.attachments && (
          <p className="text-xs text-error font-medium">{errors.attachments.message}</p>
        )}

        {attachments.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Uploaded Files</p>
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-bg border border-border rounded-[var(--radius-md)]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="text-blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-[300px]">{file.fileName}</span>
                  <span className="text-xs text-text-muted">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-text-muted hover:text-error transition-colors p-1"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <AuthButton type="button" variant="ghost" onClick={onPrev} className="w-auto px-6" disabled={uploading}>
          Back
        </AuthButton>
        <AuthButton type="button" onClick={onNext} className="w-auto px-8" disabled={uploading}>
          {attachments.length === 0 ? "Skip & Continue" : "Next Step"}
        </AuthButton>
      </div>
    </div>
  );
}
