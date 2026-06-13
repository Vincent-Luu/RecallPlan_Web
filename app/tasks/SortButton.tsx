"use client";

import { ArrowUpDown } from "lucide-react";

export type SortDirection = "newest" | "oldest";

interface SortButtonProps {
  direction: SortDirection;
  onChange: (direction: SortDirection) => void;
}

export default function SortButton({ direction, onChange }: SortButtonProps) {
  const label = direction === "newest" ? "最新优先" : "最早优先";

  return (
    <button
      onClick={() => onChange(direction === "newest" ? "oldest" : "newest")}
      title={label}
      className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2
                 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl
                 border border-slate-200/60 dark:border-slate-700/60
                 text-slate-500 dark:text-slate-400
                 hover:bg-white/60 dark:hover:bg-slate-900/80 hover:text-slate-700 dark:hover:text-slate-200
                 transition-all duration-300 shadow-sm active:scale-95
                 text-xs md:text-sm font-bold whitespace-nowrap"
    >
      <ArrowUpDown
        className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 ${
          direction === "oldest" ? "rotate-180" : ""
        }`}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
