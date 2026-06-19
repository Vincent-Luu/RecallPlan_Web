"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Github, ExternalLink, Sparkles, User, BookOpen } from "lucide-react";
import BackgroundBlobs from "@/app/components/BackgroundBlobs";

export default function AboutSection({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  // 彩蛋：点击 RecallPlan 计数器
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathError, setMathError] = useState(false);

  // 弹窗打开时锁定页面滚动
  useEffect(() => {
    document.body.style.overflow = showMathModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMathModal]);

  const handleRecallPlanClick = () => {
    const next = easterEggClicks + 1;
    setEasterEggClicks(next);
    if (next >= 10) {
      setEasterEggClicks(0);
      setShowMathModal(true);
    }
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mathAnswer.trim();
    // sin(π) = 0（常数），常数的导数为 0
    if (trimmed === "0") {
      setShowMathModal(false);
      setMathAnswer("");
      setMathError(false);
      router.push("/R-18");
    } else {
      setMathError(true);
    }
  };

  const closeMathModal = () => {
    setShowMathModal(false);
    setMathAnswer("");
    setMathError(false);
  };

  return (
    <div className="min-h-screen page-canvas text-slate-800 dark:text-slate-200 font-sans p-6 md:p-12 relative overflow-hidden transition-colors duration-500">
      <BackgroundBlobs />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* 返回按钮 + 标题 */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full shadow-sm hover:shadow transition-all group border border-transparent dark:border-slate-700"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors">
            关于
          </h1>
        </div>

        <div className="flex flex-col gap-6">
          {/* ===== 项目名称 ===== */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h2
                  onClick={handleRecallPlanClick}
                  className="text-xl font-bold text-slate-700 dark:text-slate-200 cursor-default select-none"
                  title="RecallPlan"
                >
                  RecallPlan
                </h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  艾宾浩斯日程计划
                </p>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              面向高中生的艾宾浩斯遗忘曲线复习日程管理应用。基于间隔重复原理，
              帮助学生在最佳时间节点复习知识点，最大化长期记忆留存率。
            </p>
          </div>

          {/* ===== 仓库地址 ===== */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl">
                <Github className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                源代码仓库
              </h2>
            </div>
            <a
              href="https://github.com/Vincent-Luu/RecallPlan_Web"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
            >
              <span className="truncate max-w-[280px] sm:max-w-none">
                github.com/Vincent-Luu/RecallPlan_Web
              </span>
              <ExternalLink className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </a>
          </div>

          {/* ===== 设计署名 ===== */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-md border border-white dark:border-slate-800 transition-colors duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                设计署名
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    Design By Gemini & Deepseek
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    AI 驱动的设计系统
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg border border-purple-100 dark:border-purple-800/40 whitespace-nowrap self-start sm:self-center">
                  AI × Design
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    VincentLuu
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    作者 · 创意来源 · Vincent-Luu
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== 数学验证弹窗（彩蛋触发） ===== */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

          {/* 弹窗内容 */}
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white dark:border-slate-800 w-full max-w-md p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">

            {/* 标题 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full mb-4">
                <span className="text-2xl font-bold font-mono">π</span>
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">
                身份验证
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                回答以下数学问题以继续
              </p>
            </div>

            {/* 问题 */}
            <form onSubmit={handleMathSubmit}>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  问题
                </p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200 font-mono">
                  sin(π) 的导数是多少？
                </p>
              </div>

              {/* 输入框 */}
              <input
                type="text"
                value={mathAnswer}
                onChange={(e) => {
                  setMathAnswer(e.target.value);
                  setMathError(false);
                }}
                placeholder="输入你的答案…"
                autoFocus
                className={`w-full px-4 py-3.5 bg-white dark:bg-slate-950 border rounded-xl text-slate-700 dark:text-slate-200 font-mono text-base placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  mathError
                    ? "border-red-300 dark:border-red-800 focus:ring-red-400"
                    : "border-slate-200 dark:border-slate-700 focus:ring-slate-400 dark:focus:ring-slate-600"
                }`}
              />

              {mathError && (
                <p className="text-red-500 dark:text-red-400 text-xs font-medium mt-2">
                  答案不正确，请再试一次
                </p>
              )}

              {/* 按钮 */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={closeMathModal}
                  className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!mathAnswer.trim()}
                  className="flex-1 px-6 py-3.5 bg-slate-700 dark:bg-slate-200 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
