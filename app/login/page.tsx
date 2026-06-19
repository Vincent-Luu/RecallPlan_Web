"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RegistrationModal from "@/app/components/RegistrationModal";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "登录失败，请检查账户信息");
      }
    } catch (err) {
      setError("发生了未知错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center page-canvas p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-200 dark:border-slate-700 transition-all">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight mb-3">欢迎回来</h1>
          <p className="text-slate-500 dark:text-slate-400">登录以管理您的艾宾浩斯复习计划</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all shadow-sm"
              placeholder="请输入您的用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 focus:border-transparent transition-all shadow-sm"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-accent hover:bg-accent/85 text-accent-foreground rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "正在登录..." : "登 录"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowRegisterForm(true)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition-colors underline underline-offset-4"
          >
            立即注册
          </button>
        </div>
      </div>

      <RegistrationModal
        isOpen={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
      />
    </div>
  );
}
