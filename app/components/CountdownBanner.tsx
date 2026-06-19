"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";

function getGaokaoDate(): Date {
  const today = new Date();
  const thisYear = today.getFullYear();
  const gaokaoThisYear = new Date(thisYear, 5, 7); // June 7 (0-indexed month)
  if (today > gaokaoThisYear) {
    return new Date(thisYear + 1, 5, 7);
  }
  return gaokaoThisYear;
}

function calcDaysRemaining(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CountdownBanner({
  gaokaoEnabled: serverGaokaoEnabled,
}: {
  gaokaoEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // 优先使用数据库值（DB 用户），否则使用 localStorage（env admin 回退）
    if (serverGaokaoEnabled !== undefined) {
      setEnabled(serverGaokaoEnabled);
    } else {
      const stored = localStorage.getItem("gaokao_enabled");
      setEnabled(stored === null || stored === "true");
    }
  }, [serverGaokaoEnabled]);

  // 未挂载或已关闭则不渲染
  if (enabled === null || !enabled) return null;

  const gaokaoDate = getGaokaoDate();
  const days = calcDaysRemaining(gaokaoDate);
  const year = gaokaoDate.getFullYear();

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 rounded-[2rem] px-6 py-5 shadow-sm border border-white/80 dark:border-slate-700 transition-colors duration-500">
      <div className="flex items-center justify-center gap-5 md:gap-8">
        {/* 图标 */}
        <div className="p-3 bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-2xl flex-shrink-0">
          <GraduationCap className="w-6 h-6 md:w-7 md:h-7" />
        </div>

        {/* 说明文字 */}
        <div className="flex items-baseline gap-2 md:gap-3">
          <span className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400">
            {year} 年高考倒计时
          </span>
        </div>

        {/* 天数 */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl md:text-5xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight tabular-nums">
            {days}
          </span>
          <span className="text-lg md:text-xl font-bold text-slate-400 dark:text-slate-500">
            天
          </span>
        </div>
      </div>
    </div>
  );
}
