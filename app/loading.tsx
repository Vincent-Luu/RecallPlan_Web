import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-slate-950 via-gray-100 dark:via-slate-900 to-slate-200 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans relative overflow-hidden transition-colors duration-500">

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

      {/* Header Skeleton */}
      <header className="fixed top-0 inset-x-0 h-24 flex items-center justify-between px-8 md:px-12 z-40 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm transition-colors duration-500">
        <div className="flex items-center gap-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="hidden sm:block h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-white/50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 animate-pulse" />
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-32 pb-12 px-6 md:px-12 min-h-screen max-w-[1600px] mx-auto flex flex-col gap-8">

        {/* Spinner + Loading Text */}
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader2 className="w-10 h-10 text-slate-400 dark:text-slate-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm tracking-wide">正在加载数据...</p>
        </div>

        {/* 3-Column Task Cards Skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-[calc(100vh-20rem)]">

          {/* Yesterday Card Skeleton — hidden on mobile */}
          <div className="hidden lg:flex relative transform lg:scale-95 opacity-50 flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
            <div className="space-y-4">
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="pt-8 space-y-4">
                <div className="h-16 w-full bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
                <div className="h-16 w-full bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Today Card Skeleton — full width on mobile */}
          <div className="relative transform z-20 flex flex-col bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-700 ring-1 ring-slate-100/50 dark:ring-slate-700/50 h-full">
            {/* Mobile: show spinner centered inside card */}
            <div className="flex lg:hidden flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-slate-300 dark:text-slate-600 animate-spin" />
              <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">加载中...</span>
            </div>
            {/* Desktop: skeleton placeholders */}
            <div className="hidden lg:block space-y-4">
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="pt-10 space-y-6">
                <div className="h-20 w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse" />
                <div className="h-20 w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse" />
                <div className="h-20 w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Tomorrow Card Skeleton — hidden on mobile */}
          <div className="hidden lg:flex relative transform lg:scale-95 opacity-50 flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
            <div className="space-y-4">
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="pt-8 space-y-4">
                <div className="h-16 w-full bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
