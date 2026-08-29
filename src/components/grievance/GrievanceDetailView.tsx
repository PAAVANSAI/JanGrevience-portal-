"use client";

import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { SlaBadge } from "@/components/ui/SlaBadge";
import { calculateSlaStatus } from "@/lib/utils/sla";
import ResolutionConfirmation from "@/components/grievance/ResolutionConfirmation";
import FeedbackPrompt from "@/components/ui/FeedbackPrompt";
import CommentThread from "@/components/ui/CommentThread";
import GrievanceTimeline from "@/components/ui/GrievanceTimeline";
import UpvoteButton from "@/components/ui/UpvoteButton";

interface GrievanceDetailViewProps {
  grievance: any;
  attachmentsWithUrls: any[];
  combinedHistory: any[];
  comments: any[];
  appeal: any;
  hasFeedback: boolean;
  isGuest?: boolean;
  canAppeal?: boolean;
}

export default function GrievanceDetailView({
  grievance,
  attachmentsWithUrls,
  combinedHistory,
  comments,
  appeal,
  hasFeedback,
  isGuest = false,
  canAppeal = true,
}: GrievanceDetailViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight font-mono">
              {grievance.grievance_number}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={grievance.status} className="px-3 py-1 text-sm" />
              {grievance.escalation_level > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  Escalated L{grievance.escalation_level}
                </span>
              )}
              {grievance.status !== "RESOLVED" &&
                grievance.status !== "CLOSED" &&
                grievance.status !== "REJECTED" && (
                  <SlaBadge
                    sla={calculateSlaStatus(
                      grievance as any,
                      grievance.categories?.sla_rules?.[0]
                    )}
                    role="CITIZEN"
                  />
                )}
            </div>
          </div>
          <h2 className="text-lg font-medium text-text-primary">{grievance.subject}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-4">
            <p className="text-sm text-text-muted">
              Filed on{" "}
              {new Date(grievance.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {grievance.status !== "RESOLVED" && grievance.status !== "CLOSED" && grievance.status !== "REJECTED" && (
              <UpvoteButton grievanceId={grievance.id} initialCount={grievance.upvote_count} />
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {!isGuest && !appeal && grievance.status === "RESOLVED" && grievance.resolution_confirmed === null && (
            <ResolutionConfirmation
              grievanceId={grievance.id}
              disputeCount={grievance.resolution_dispute_count || 0}
            />
          )}

          {!isGuest && !appeal && grievance.status === "CLOSED" && (
            <FeedbackPrompt
              grievanceId={grievance.id}
              hasFeedback={hasFeedback}
              grievanceStatus={grievance.status}
              canAppeal={canAppeal}
            />
          )}

          {appeal && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Appeal {appeal.appeal_number}
                </h3>
                <StatusBadge status={appeal.status as any} className="px-3 py-1" />
              </div>
              <div className="bg-white/60 rounded-xl p-4 border border-red-100/50 space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-red-900 block mb-1">Reason for Appeal:</span>
                  <span className="text-red-800">{appeal.reason}</span>
                </div>
                <div>
                  <span className="font-semibold text-red-900 block mb-1">Description:</span>
                  <span className="text-red-800 whitespace-pre-wrap">{appeal.description}</span>
                </div>
              </div>
            </div>
          )}

          {grievance.status === "ADDITIONAL_INFORMATION_REQUIRED" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="text-amber-600 mt-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-1">Action Needed {isGuest ? "From Citizen" : "From You"}</h3>
                  <p className="text-amber-800 text-sm mb-3">
                    The department has requested more information to process this grievance. {isGuest ? "The citizen must reply below to continue." : "Please check the discussion notes below and submit your reply to continue."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Description</h3>
            <p className="text-text-primary whitespace-pre-wrap text-sm leading-relaxed">
              {grievance.description}
            </p>
          </div>

          {/* Classification Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Classification Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-medium text-text-muted mb-1">Department</span>
                <span className="text-sm text-text-primary font-medium">{grievance.departments?.name}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-text-muted mb-1">Category</span>
                <span className="text-sm text-text-primary font-medium">{grievance.categories?.name}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-text-muted mb-1">State</span>
                <span className="text-sm text-text-primary font-medium">{grievance.state}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-text-muted mb-1">District</span>
                <span className="text-sm text-text-primary font-medium">{grievance.district}</span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Supporting Documents</h3>
            {attachmentsWithUrls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachmentsWithUrls.map((file) => (
                  <a
                    key={file.id}
                    href={file.signedUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-bg border border-border rounded-[var(--radius-md)] hover:border-blue/30 hover:bg-blue/5 transition-colors group relative overflow-hidden"
                  >
                    {file.context === 'after' && (
                      <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg border-b border-l border-green-200">
                        Resolution Proof
                      </div>
                    )}
                    <div className="text-text-muted group-hover:text-blue transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-sm font-medium text-text-primary truncate">{file.file_name}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No documents attached.</p>
            )}
          </div>

          {/* Comments Thread */}
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm mt-6">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Discussion & Notes</h3>
            <CommentThread
              grievanceId={grievance.id}
              currentStatus={grievance.status}
              comments={comments || []}
              userRole="CITIZEN"
              canReply={!isGuest && ["IN_PROGRESS", "ADDITIONAL_INFORMATION_REQUIRED", "ACTION_TAKEN"].includes(grievance.status)}
            />
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm sticky top-6">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Status Timeline</h3>
            <GrievanceTimeline history={combinedHistory as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
