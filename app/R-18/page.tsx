"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import BackgroundBlobs from "@/app/components/BackgroundBlobs";

export default function R18Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen page-canvas text-slate-800 dark:text-slate-200 font-sans flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <BackgroundBlobs />

      <div className="max-w-lg w-full relative z-10">
        {/* 警告卡片 */}
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-huge border border-white dark:border-slate-800 transition-colors duration-500 text-center">
          {/* 警告图标 */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-700 dark:text-slate-100 mb-3 tracking-tight">
            内容确认
          </h1>

          <div className="w-16 h-0.5 bg-red-400/40 dark:bg-red-500/30 mx-auto mb-6 rounded-full" />

          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-3 text-sm md:text-base">
            本页面包含可能不适合未成年人的内容。<br />
            根据相关法律法规，您需要确认自己已年满 18 周岁。
          </p>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
            >
              我未满 18 岁
            </button>
            <button
              onClick={() => {
                window.location.href = "https://ys.mihoyo.com/main/?from_fab=1";
              }}
              className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
            >
              我已年满 18 岁
            </button>
          </div>

          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-6">
            离开此页面不会留下浏览记录
          </p>
        </div>
      </div>
    </div>
  );
}
