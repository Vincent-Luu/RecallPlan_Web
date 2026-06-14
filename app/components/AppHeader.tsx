"use client";

import { PlusCircle, Calendar as CalendarIcon, List, Sun, Moon, Settings, StickyNote, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

type AppHeaderProps = {
  targetUserId?: number;
  onOpenMemo: () => void;
  onOpenCalendar: () => void;
  onOpenNewTask: () => void;
};

export default function AppHeader({ targetUserId, onOpenMemo, onOpenCalendar, onOpenNewTask }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 h-16 md:h-24 flex items-center justify-between px-4 md:px-12 z-40 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm transition-colors duration-500">
      {/* 左侧：标题 + 功能按钮 */}
      <div className="flex items-center gap-2 md:gap-6">
        <h1 className="text-base md:text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors">
          艾宾浩斯日程计划
        </h1>
        <button
          onClick={onOpenMemo}
          className="flex items-center gap-1.5 md:gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <StickyNote className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">备忘录</span>
        </button>
        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-1.5 md:gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline">月度视图</span>
        </button>
      </div>

      {/* 右侧：导航 + 工具 */}
      <div className="flex items-center gap-1.5 md:gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden md:inline">设置</span>
        </Link>
        <Link
          href={targetUserId ? `/tasks?userId=${targetUserId}` : "/tasks"}
          className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          <List className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden md:inline">任务列表</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-2 md:p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          title="切换深色/浅色模式"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 md:p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          title="退出登录"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 md:gap-2 bg-slate-600 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-800 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-md transition-all hover:scale-105 active:scale-95 md:ml-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden md:inline">新任务</span>
        </button>
      </div>
    </header>
  );
}
