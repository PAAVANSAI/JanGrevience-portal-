"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/lib/context/UserContext";

interface InternalNotesProps {
  grievanceId: string;
}

export default function InternalNotes({ grievanceId }: InternalNotesProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const supabase = createClient();
  const { profile } = useUserRole();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotes();
    
    // Subscribe to new internal notes
    const channel = supabase
      .channel("internal_notes_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_notes",
          filter: `grievance_id=eq.${grievanceId}`,
        },
        (payload) => {
          // Fetch author details for the new note
          supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", payload.new.author_id)
            .single()
            .then(({ data }) => {
              const enrichedNote = {
                ...payload.new,
                profiles: data
              };
              setNotes(prev => [...prev, enrichedNote]);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [grievanceId, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadNotes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("internal_notes")
        .select(`
          *,
          profiles:author_id (full_name, role)
        `)
        .eq("grievance_id", grievanceId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) setNotes(data);
    } catch (err) {
      console.error("Failed to load internal notes", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !profile) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("internal_notes")
        .insert({
          grievance_id: grievanceId,
          author_id: profile.id,
          note: newNote.trim()
        });

      if (error) throw error;
      setNewNote("");
    } catch (err: any) {
      alert("Failed to add note: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-32 bg-surface-2 animate-pulse rounded-2xl"></div>;
  }

  return (
    <div className="bg-[#FFFBF0] border border-amber-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 border-b border-amber-200 bg-amber-50/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          Internal Private Notes
        </h3>
        <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
          Hidden from Citizen
        </span>
      </div>
      
      <div className="p-4 flex-1 max-h-[400px] overflow-y-auto space-y-4 hide-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-amber-700/60 text-sm font-medium">
            No internal notes yet. Use this space for private communication between officers and admins.
          </div>
        ) : (
          notes.map((note) => {
            const isMe = note.author_id === profile?.id;
            
            return (
              <div key={note.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  isMe ? 'bg-amber-500 text-white rounded-br-none' : 'bg-white border border-amber-100 text-amber-950 rounded-bl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-[10px] font-semibold text-amber-800/60">
                    {note.profiles?.full_name} ({note.profiles?.role === 'DEPT_ADMIN' ? 'Admin' : 'Officer'})
                  </span>
                  <span className="text-[10px] text-amber-800/40">•</span>
                  <span className="text-[10px] text-amber-800/60">
                    {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-amber-100">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type a private note..."
            className="w-full bg-amber-50/30 border border-amber-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors resize-none placeholder-amber-700/40"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newNote.trim() || submitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
