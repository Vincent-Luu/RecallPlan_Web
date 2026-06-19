"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen page-canvas text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-6 transition-colors duration-500">
      <div className="bg-white/60 dark:bg-slate-800/80 rounded-[2rem] p-10 md:p-12 shadow-sm border border-white/80 dark:border-slate-700 max-w-md w-full text-center transition-colors duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-5 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-400 dark:text-slate-500">
            <FileQuestion className="w-12 h-12" />
          </div>
        </div>

        <h1 className="text-6xl font-black text-slate-300 dark:text-slate-600 mb-3">404</h1>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">页面未找到</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          你访问的页面不存在、已被移除，或网址输入有误。
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-accent hover:bg-accent/85 text-accent-foreground font-bold rounded-xl shadow-md transition-all"
          >
            返回首页看板
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 py-2.5 w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
