"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { createPortal } from "react-dom";

export interface Option {
  value: string;
  label: string;
  description?: string;
}

interface PopupSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  searchable?: boolean;
}

export default function PopupSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  searchable = true,
}: PopupSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Close when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options
    .filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-surface/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[9999] w-auto md:w-[480px] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .popup-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .popup-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(156, 163, 175, 0.5);
                border-radius: 4px;
              }
              .popup-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(107, 114, 128, 0.8);
              }
            `}</style>

            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg/50 backdrop-blur-md">
              <h3 className="font-semibold text-text-primary text-base">{placeholder}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-surface-2 rounded-full text-text-muted hover:text-text-primary transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search */}
            {searchable && (
              <div className="p-4 border-b border-border bg-surface">
                <div className="relative group">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-blue transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-bg/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 md:max-h-[360px] popup-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  No options found for "{searchQuery}"
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery(""); // reset search
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-start justify-between transition-all group
                        ${isSelected 
                          ? "bg-blue/10 text-blue font-semibold shadow-sm ring-1 ring-blue/20" 
                          : "text-text-primary hover:bg-surface-2 hover:text-text-primary"}
                      `}
                    >
                      <div className="flex flex-col pr-4 overflow-hidden">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span className={`text-xs mt-0.5 font-normal truncate
                            ${isSelected ? "text-blue/70" : "text-text-muted group-hover:text-text-secondary"}
                          `}>
                            {opt.description}
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <motion.svg 
                          initial={{ scale: 0.5, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
                          className="text-blue shrink-0 mt-0.5"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </motion.svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border group-hover:border-blue/40 shrink-0 transition-colors mt-0.5"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-2.5 bg-bg border rounded-[var(--radius-md)] text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue/20 flex items-center justify-between
          ${error ? "border-error focus:border-error text-error" : "border-border focus:border-blue text-text-primary"}
          ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "hover:border-blue/50 cursor-pointer"}
        `}
      >
        <span className={selectedOption ? "text-text-primary" : "text-text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {mounted ? createPortal(modalContent, document.body) : null}
    </>
  );
}
