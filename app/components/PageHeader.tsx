"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type PageHeaderProps = {
  /** 返回箭头的目标链接 */
  backHref: string;
  /** 返回按钮的标签文字 */
  backLabel?: string;
  /** 页面标题 */
  title: string;
  /** 标题旁的额外内容（如 admin 管理标记） */
  badge?: ReactNode;
};

export default function PageHeader({ backHref, backLabel = "返回看板", title, badge }: PageHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 h-16 md:h-24 flex items-center px-4 md:px-12 z-40 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm justify-between transition-colors duration-500">
      <div className="flex items-center min-w-0">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 md:gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mr-3 md:mr-6 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-medium hidden sm:inline whitespace-nowrap">{backLabel}</span>
        </Link>
        <h1 className="text-lg md:text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight border-l-2 border-slate-300 dark:border-slate-700 pl-4 md:pl-6 transition-colors truncate">
          {title}
          {badge}
        </h1>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center justify-center p-2 md:p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 flex-shrink-0 ml-3"
        title="退出登录"
      >
        <LogOut className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </header>
  );
}
