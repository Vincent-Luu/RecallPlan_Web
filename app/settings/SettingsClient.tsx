"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ChevronRight, GraduationCap } from "lucide-react";
import AccountManager from "./AccountManager";

type UserType = {
  id: number;
  username: string;
  role: string;
  status: string;
  createdAt: Date;
};

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
        enabled
          ? "bg-slate-600 dark:bg-slate-300"
          : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsClient({
  isAdmin,
  initialUsers,
  gaokaoEnabled: serverGaokaoEnabled,
}: {
  isAdmin: boolean;
  initialUsers: UserType[];
  gaokaoEnabled?: boolean;
}) {
  const [activeSection, setActiveSection] = useState<"overview" | "account">("overview");
  const [gaokaoEnabled, setGaokaoEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 初始化：DB 优先，localStorage 回退
  useEffect(() => {
    if (serverGaokaoEnabled !== undefined) {
      setGaokaoEnabled(serverGaokaoEnabled);
    } else {
      const stored = localStorage.getItem("gaokao_enabled");
      setGaokaoEnabled(stored === null || stored === "true");
    }
    setMounted(true);
  }, [serverGaokaoEnabled]);

  const handleGaokaoToggle = useCallback(
    async (v: boolean) => {
      setGaokaoEnabled(v);

      if (serverGaokaoEnabled !== undefined) {
        // DB 用户：通过 API 持久化
        try {
          await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gaokaoEnabled: v }),
          });
        } catch {
          // 网络错误回滚
          setGaokaoEnabled(!v);
        }
      } else {
        // env admin：localStorage 持久化
        localStorage.setItem("gaokao_enabled", String(v));
      }
    },
    [serverGaokaoEnabled]
  );

  // ==================== 帐号管理详情（仅 admin） ====================
  if (isAdmin && activeSection === "account") {
    return (
      <AccountManager
        initialUsers={initialUsers}
        onBack={() => setActiveSection("overview")}
      />
    );
  }

  // ==================== 共享布局：背景 + 头部 ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12 relative overflow-hidden transition-colors duration-500">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/"
            className="p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm hover:shadow transition-all group border border-transparent dark:border-slate-700"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors">
            设置
          </h1>
        </div>

        <div className="space-y-4">
          {/* ===== 高考倒计时（全员可见） ===== */}
          {mounted && (
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-2xl flex-shrink-0">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                      高考倒计时
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      在首页仪表盘显示距离高考的天数
                    </p>
                  </div>
                </div>
                <Toggle enabled={gaokaoEnabled} onChange={handleGaokaoToggle} />
              </div>
            </div>
          )}

          {/* ===== 帐号管理（仅 admin） ===== */}
          {isAdmin && (
            <button
              onClick={() => setActiveSection("account")}
              className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-md border border-white dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group text-left"
            >
              <div className="flex items-center gap-5">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                    帐号管理
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    创建、查看和删除用户帐号，管理用户权限
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
