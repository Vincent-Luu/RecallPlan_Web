"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Calendar as CalendarIcon, List, Sun, Moon, Settings, StickyNote, LogOut, BarChart3, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

type AppHeaderProps = {
  targetUserId?: number;
  onOpenMemo: () => void;
  onOpenCalendar: () => void;
  onOpenNewTask: () => void;
};

/** Shared button/link classes used by both the sidebar items and the desktop header. */
const NAV_ITEM_CLASSES =
  "flex items-center gap-2 md:gap-2.5 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 w-full";

const ICON_CLASSES = "w-5 h-5 flex-shrink-0";

export default function AppHeader({ targetUserId, onOpenMemo, onOpenCalendar, onOpenNewTask }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll while sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  /** Shared nav items rendered both in the sidebar (mobile) and the header (desktop). */
  const navItems = (
    <>
      <button onClick={() => { onOpenMemo(); setSidebarOpen(false); }} className={NAV_ITEM_CLASSES}>
        <StickyNote className={ICON_CLASSES} />
        <span>备忘录</span>
      </button>
      <button onClick={() => { onOpenCalendar(); setSidebarOpen(false); }} className={NAV_ITEM_CLASSES}>
        <CalendarIcon className={ICON_CLASSES} />
        <span>月度视图</span>
      </button>
      <Link
        href="/settings"
        onClick={() => setSidebarOpen(false)}
        className={NAV_ITEM_CLASSES}
      >
        <Settings className={ICON_CLASSES} />
        <span>设置</span>
      </Link>
      <Link
        href={targetUserId ? `/stats?userId=${targetUserId}` : "/stats"}
        onClick={() => setSidebarOpen(false)}
        className={NAV_ITEM_CLASSES}
      >
        <BarChart3 className={ICON_CLASSES} />
        <span>统计</span>
      </Link>
      <Link
        href={targetUserId ? `/tasks?userId=${targetUserId}` : "/tasks"}
        onClick={() => setSidebarOpen(false)}
        className={NAV_ITEM_CLASSES}
      >
        <List className={ICON_CLASSES} />
        <span>任务列表</span>
      </Link>
    </>
  );

  return (
    <>
      <header className="fixed top-0 inset-x-0 h-16 md:h-24 flex items-center justify-between px-4 md:px-12 z-40 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm transition-colors duration-500">
        {/* 左侧：标题 + 桌面端功能按钮 */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* 移动端汉堡菜单按钮 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            title="菜单"
          >
            <Menu className="w-4 h-4" />
          </button>

          <h1 className="text-sm sm:text-base md:text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
            艾宾浩斯日程计划
          </h1>

          {/* 桌面端：直接在 header 中显示 */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
            <button onClick={onOpenMemo} className={NAV_ITEM_CLASSES.replace("w-full", "")}>
              <StickyNote className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden lg:inline">备忘录</span>
            </button>
            <button onClick={onOpenCalendar} className={NAV_ITEM_CLASSES.replace("w-full", "")}>
              <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden lg:inline">月度视图</span>
            </button>
          </div>
        </div>

        {/* 右侧：导航 + 工具 */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center gap-1.5 md:gap-2">
            <Link href="/settings" className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
              <Settings className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden lg:inline">设置</span>
            </Link>
            <Link
              href={targetUserId ? `/stats?userId=${targetUserId}` : "/stats"}
              className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden lg:inline">统计</span>
            </Link>
            <Link
              href={targetUserId ? `/tasks?userId=${targetUserId}` : "/tasks"}
              className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <List className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="hidden lg:inline">任务列表</span>
            </Link>
          </div>

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

      {/* ---- 移动端侧边栏 ---- */}
      {/* 遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏面板 */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-white/60 dark:border-slate-700/60 shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">菜单</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 侧边栏导航项 */}
        <nav className="flex flex-col gap-2 px-4 py-4">
          {navItems}
        </nav>
      </div>
    </>
  );
}
