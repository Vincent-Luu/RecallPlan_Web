"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Filter, ChevronDown, Layers, X } from "lucide-react";
import { SUBJECT_TAGS, getTagStyle } from "@/app/lib/subjectTags";

interface SubjectFilterSheetProps {
  selectedSubject: string | null;
  onSelect: (subject: string | null) => void;
}

export default function SubjectFilterSheet({ selectedSubject, onSelect }: SubjectFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Detect desktop vs mobile
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      setIsOpen(false); // close on breakpoint change to avoid orphaned UI
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Click outside to close (desktop dropdown)
  useEffect(() => {
    if (!isOpen || !isDesktop) return;
    const timer = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, isDesktop]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen && !isDesktop) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen, isDesktop]);

  const handleSelect = useCallback((subject: string | null) => {
    onSelect(subject);
    setIsOpen(false);
  }, [onSelect]);

  const selectedStyle = selectedSubject ? getTagStyle(selectedSubject) : null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2
                    rounded-xl border shadow-sm
                    transition-all duration-300 active:scale-95
                    text-xs md:text-sm font-bold whitespace-nowrap
                    ${
                      selectedSubject
                        ? `${selectedStyle!.bg} ${selectedStyle!.text} ${selectedStyle!.border}`
                        : "bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-900/80 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
        title={selectedSubject ? `学科: ${selectedSubject}` : "学科筛选"}
      >
        <Filter className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <span className="hidden sm:inline">
          {selectedSubject || "学科筛选"}
        </span>
        {selectedSubject && (
          <span className={`inline-block w-2 h-2 rounded-full ${selectedStyle!.bg} flex-shrink-0`} />
        )}
        <ChevronDown
          className={`w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Desktop: Dropdown Panel */}
      {isOpen && isDesktop && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 z-30 w-64
                     bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                     rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60
                     p-3 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* "All" option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold
                        transition-colors ${
                          selectedSubject === null
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
          >
            <Layers className="w-4 h-4" />
            全部
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />

          {/* Subject grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {SUBJECT_TAGS.map(tag => (
              <button
                key={tag.name}
                onClick={() => handleSelect(tag.name)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold
                            transition-all border ${
                              selectedSubject === tag.name
                                ? `${tag.bg} ${tag.text} ${tag.border} ring-2 ring-slate-200 dark:ring-slate-600`
                                : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${tag.bg} flex-shrink-0`} />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: Bottom Sheet */}
      {isOpen && !isDesktop && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm
                        animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet Panel */}
          <div
            className="fixed bottom-0 inset-x-0 z-40
                        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                        rounded-t-[2rem] border-t border-white/50 dark:border-slate-700
                        shadow-huge p-6 pb-8
                        animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                选择学科
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                           hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* "All" option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold mb-2
                          transition-colors ${
                            selectedSubject === null
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
            >
              <Layers className="w-5 h-5" />
              全部学科
            </button>

            {/* Subject grid */}
            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_TAGS.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => handleSelect(tag.name)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold
                              transition-all border ${
                                selectedSubject === tag.name
                                  ? `${tag.bg} ${tag.text} ${tag.border} ring-2 ring-slate-200 dark:ring-slate-600`
                                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                              }`}
                >
                  <span className={`w-3 h-3 rounded-full ${tag.bg} flex-shrink-0`} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
