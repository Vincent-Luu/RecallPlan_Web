"use client";

import SubjectFilterSheet from "./SubjectFilterSheet";
import SortButton, { type SortDirection } from "./SortButton";

interface TaskFilterBarProps {
  filterStatus: "all" | "completed" | "uncompleted";
  onFilterStatusChange: (status: "all" | "completed" | "uncompleted") => void;
  selectedSubject: string | null;
  onSubjectChange: (subject: string | null) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
  filterCounts: { all: number; completed: number; uncompleted: number };
}

export default function TaskFilterBar({
  filterStatus,
  onFilterStatusChange,
  selectedSubject,
  onSubjectChange,
  sortDirection,
  onSortDirectionChange,
  filterCounts,
}: TaskFilterBarProps) {
  const statusFilters = [
    { key: "all" as const, label: "全部" },
    { key: "completed" as const, label: "已完成" },
    { key: "uncompleted" as const, label: "未完成" },
  ];

  return (
    <div className="flex flex-col gap-3 mb-8">
      {/* Row 1: Status filter tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-900/70 rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
          {statusFilters.map(({ key, label }) => {
            const isActive = filterStatus === key;
            return (
              <button
                key={key}
                onClick={() => onFilterStatusChange(key)}
                className={`relative px-5 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-white/80 dark:border-slate-600/50"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {filterCounts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Subject filter + Sort toggle */}
      <div className="flex items-center justify-center md:justify-end gap-2">
        <SubjectFilterSheet
          selectedSubject={selectedSubject}
          onSelect={onSubjectChange}
        />
        <SortButton
          direction={sortDirection}
          onChange={onSortDirectionChange}
        />
      </div>
    </div>
  );
}
