// Shared subject tag definitions — used by DashboardClient and tasks/page.
// Keep in sync when adding or removing subjects.
export const SUBJECT_TAGS = [
  { name: "语文", color: "from-rose-400 to-rose-500", bg: "bg-rose-50 dark:bg-rose-500/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-500/30" },
  { name: "数学", color: "from-blue-400 to-blue-500", bg: "bg-blue-50 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-100 dark:border-blue-500/30" },
  { name: "英语", color: "from-emerald-400 to-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-500/30" },
  { name: "物理", color: "from-violet-400 to-violet-500", bg: "bg-violet-50 dark:bg-violet-500/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-100 dark:border-violet-500/30" },
  { name: "化学", color: "from-amber-400 to-amber-500", bg: "bg-amber-50 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-500/30" },
  { name: "生物", color: "from-teal-400 to-teal-500", bg: "bg-teal-50 dark:bg-teal-500/20", text: "text-teal-600 dark:text-teal-400", border: "border-teal-100 dark:border-teal-500/30" },
  { name: "其他", color: "from-slate-400 to-slate-500", bg: "bg-slate-50 dark:bg-slate-500/20", text: "text-slate-600 dark:text-slate-400", border: "border-slate-100 dark:border-slate-500/30" },
] as const;

export type SubjectTagName = (typeof SUBJECT_TAGS)[number]["name"];

export function getTagStyle(tagName: string | null) {
  return SUBJECT_TAGS.find(t => t.name === tagName) || SUBJECT_TAGS[6];
}
