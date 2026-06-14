"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { Flame, Award, TrendingUp, Loader2, RefreshCw, Clock, Calendar as CalendarIcon } from "lucide-react";
import PageHeader from "@/app/components/PageHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatsResponse {
  completionRate: { completed: number; total: number; percentage: number };
  subjects: Array<{ tag: string; completed: number; pending: number; total: number }>;
  streak: number;
  totalCompleted: number;
  monthlyTrend: Array<{ date: string; count: number }>;
  intervalCompletion: Array<{
    interval: number;
    label: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
}

interface StatsClientProps {
  initialTargetUserId?: number;
  isAdmin: boolean;
  backHref: string;
  currentUserId?: number;
}

// ---------------------------------------------------------------------------
// Dark-mode helper (client-only)
// ---------------------------------------------------------------------------

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

// ---------------------------------------------------------------------------
// Chart colour palette helpers
// ---------------------------------------------------------------------------

const CHART_COLORS_LIGHT = {
  completed: "#22c55e",   // green-500
  pending: "#e2e8f0",     // slate-200
  grid: "#e2e8f0",
  text: "#64748b",        // slate-500
  area: "#22c55e",
};

const CHART_COLORS_DARK = {
  completed: "#4ade80",   // green-400
  pending: "#334155",     // slate-700
  grid: "#334155",
  text: "#94a3b8",        // slate-400
  area: "#4ade80",
};

/** Return chart colours for the current theme. */
function getChartColors() {
  return isDarkMode() ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}

// ---------------------------------------------------------------------------
// Subject colour map — maps tag name → hex colour for bar fills
// ---------------------------------------------------------------------------

const SUBJECT_HEX: Record<string, string> = {
  "语文": "#f43f5e", // rose-500
  "数学": "#3b82f6", // blue-500
  "英语": "#10b981", // emerald-500
  "物理": "#8b5cf6", // violet-500
  "化学": "#f59e0b", // amber-500
  "生物": "#14b8a6", // teal-500
  "其他": "#64748b", // slate-500
};

function subjectColor(tag: string): string {
  return SUBJECT_HEX[tag] || SUBJECT_HEX["其他"];
}

// ---------------------------------------------------------------------------
// PeriodSwitcher
// ---------------------------------------------------------------------------

type Period = "week" | "month" | "all";

function PeriodSwitcher({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "week", label: "本周" },
    { value: "month", label: "本月" },
    { value: "all", label: "全部" },
  ];

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="inline-flex bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-full p-1 border border-white/60 dark:border-slate-700/60 shadow-sm">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              period === opt.value
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared card shell
// ---------------------------------------------------------------------------

function CardShell({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60 transition-colors duration-500 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
          {icon}
        </div>
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatsClient({
  initialTargetUserId,
  isAdmin,
  backHref,
  currentUserId,
}: StatsClientProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  // Detect theme on mount + listen for changes
  useEffect(() => {
    setDark(isDarkMode());
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const chartColors = dark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

  // --- Fetch stats ---
  const fetchStats = async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/tasks/stats", window.location.origin);
      url.searchParams.set("period", p);
      if (initialTargetUserId) {
        url.searchParams.set("userId", String(initialTargetUserId));
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data: StatsResponse = await res.json();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period, initialTargetUserId]);

  // --- Derived: has any data at all? ---
  const hasAnyData = stats && stats.completionRate.total > 0;

  // --- Monthly trend: fill gaps for days 1..end of month ---
  const trendData = useMemo(() => {
    if (!stats?.monthlyTrend) return [];
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const map = new Map(stats.monthlyTrend.map(d => [d.date, d.count]));
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      result.push({ date: String(d), count: map.get(ds) || 0 });
    }
    return result;
  }, [stats?.monthlyTrend]);

  // --- Subject data sorted by completed desc ---
  const subjectData = useMemo(() => {
    if (!stats?.subjects) return [];
    return [...stats.subjects].sort((a, b) => b.completed - a.completed);
  }, [stats?.subjects]);

  // =========================================================================
  // Loading State
  // =========================================================================
  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

        <PageHeader backHref={backHref} title="学习统计看板" />

        <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 max-w-[1400px] mx-auto">
          <PeriodSwitcher period={period} onChange={setPeriod} />

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60"
              >
                <Skeleton className="w-10 h-10 rounded-xl mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
              <Skeleton className="w-10 h-10 rounded-xl mb-4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
              <Skeleton className="w-10 h-10 rounded-xl mb-4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </section>

          <section>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
              <Skeleton className="w-10 h-10 rounded-xl mb-4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </section>
        </main>
      </div>
    );
  }

  // =========================================================================
  // Error State
  // =========================================================================
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

        <PageHeader backHref={backHref} title="学习统计看板" />

        <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 max-w-[1400px] mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <RefreshCw className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              加载统计数据失败，请稍后重试
            </p>
            <button
              onClick={() => fetchStats(period)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-600 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-800 rounded-full font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // Empty State (no tasks at all)
  // =========================================================================
  if (!hasAnyData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

        <PageHeader backHref={backHref} title="学习统计看板" />

        <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 max-w-[1400px] mx-auto">
          <PeriodSwitcher period={period} onChange={setPeriod} />

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Completion rate — zero state */}
            <CardShell title="学习完成率" icon={<TrendingUp className="w-5 h-5" />}>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-4xl font-extrabold text-slate-300 dark:text-slate-600">0%</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">0 / 0 完成</p>
              </div>
            </CardShell>

            {/* Streak — zero state */}
            <CardShell title="连续打卡" icon={<Flame className="w-5 h-5" />}>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-4xl font-extrabold text-slate-300 dark:text-slate-600">0</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">天</p>
              </div>
            </CardShell>

            {/* Total — zero state */}
            <CardShell title="累计复习" icon={<Award className="w-5 h-5" />}>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-4xl font-extrabold text-slate-300 dark:text-slate-600">0</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">次</p>
              </div>
            </CardShell>
          </section>

          {/* Empty guidance */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-12 shadow-md border border-white/60 dark:border-slate-700/60 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              还没有复习数据
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              创建任务开始学习，这里将展示你的学习统计！
            </p>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // Normal State
  // =========================================================================
  const statsData = stats!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 relative overflow-hidden transition-colors duration-500">
      {/* Decorative blobs (identical to DashboardClient) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

      <PageHeader
        backHref={backHref}
        title="学习统计看板"
        badge={
          initialTargetUserId ? (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-medium">
              管理用户统计
            </span>
          ) : undefined
        }
      />

      <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 max-w-[1400px] mx-auto">
        <PeriodSwitcher period={period} onChange={setPeriod} />

        {/* ---- Row 1: KPI cards ---- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Completion Rate with donut */}
          <CardShell title="学习完成率" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "已完成", value: statsData.completionRate.completed },
                        {
                          name: "待完成",
                          value:
                            statsData.completionRate.total -
                            statsData.completionRate.completed,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={64}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={chartColors.completed} />
                      <Cell fill={chartColors.pending} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-100">
                    {statsData.completionRate.percentage}%
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {statsData.completionRate.completed}/{statsData.completionRate.total}
                  </span>
                </div>
              </div>
            </div>
          </CardShell>

          {/* Streak */}
          <CardShell title="连续打卡" icon={<Flame className="w-5 h-5" />}>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-5xl font-extrabold ${
                    statsData.streak >= 7
                      ? "text-orange-500 dark:text-orange-400"
                      : statsData.streak >= 3
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {statsData.streak}
                </span>
                <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  天
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {statsData.streak >= 30
                  ? "🔥 学习已经成为习惯！"
                  : statsData.streak >= 7
                    ? "坚持一周了，继续加油！"
                    : statsData.streak >= 3
                      ? "不错的开始！"
                      : statsData.streak > 0
                        ? "每一天都很重要"
                        : "今天开始打卡吧"}
              </p>
            </div>
          </CardShell>

          {/* Total completed */}
          <CardShell title="累计复习" icon={<Award className="w-5 h-5" />}>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-slate-700 dark:text-slate-100">
                  {statsData.totalCompleted.toLocaleString()}
                </span>
                <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  次
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                共 {statsData.completionRate.total.toLocaleString()} 个复习任务
              </p>
            </div>
          </CardShell>
        </section>

        {/* ---- Row 2: Subject bar chart + Interval completion ---- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Subject breakdown */}
          <CardShell title="各学科复习次数" icon={<TrendingUp className="w-5 h-5" />}>
            {subjectData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
                暂无数据
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: chartColors.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      tick={({ x, y, payload }: any) => {
                        const tagName = payload.value as string;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-8}
                              y={4}
                              textAnchor="end"
                              fontSize={13}
                              fontWeight={600}
                              fill={dark ? "#cbd5e1" : "#475569"}
                            >
                              {tagName}
                            </text>
                          </g>
                        );
                      }}
                      width={50}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: dark ? "#1e293b" : "#fff",
                        border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(value, name) => [
                        value,
                        name === "completed" ? "已完成" : "待完成",
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill={chartColors.completed}
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="pending"
                      stackId="a"
                      fill={chartColors.pending}
                      radius={[0, 0, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Legend */}
            {subjectData.length > 0 && (
              <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: chartColors.completed }}
                  />
                  已完成
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: chartColors.pending }}
                  />
                  待完成
                </span>
              </div>
            )}
          </CardShell>

          {/* Interval completion */}
          <CardShell title="艾宾浩斯间隔完成率" icon={<Clock className="w-5 h-5" />}>
            {statsData.intervalCompletion.every(i => i.total === 0) ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
                暂无数据
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statsData.intervalCompletion}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={v => `${v}%`}
                      tick={{ fontSize: 12, fill: chartColors.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 13, fontWeight: 600, fill: chartColors.text }}
                      width={60}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: dark ? "#1e293b" : "#fff",
                        border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(value) => [`${value}%`, "完成率"]}
                    />
                    <Bar
                      dataKey="percentage"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                      fill={chartColors.completed}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Completion % labels beside bars */}
            {statsData.intervalCompletion.some(i => i.total > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-400 dark:text-slate-500">
                {statsData.intervalCompletion
                  .filter(i => i.total > 0)
                  .map(i => (
                    <span key={i.interval}>
                      {i.label}: {i.completed}/{i.total} ({i.percentage}%)
                    </span>
                  ))}
              </div>
            )}
          </CardShell>
        </section>

        {/* ---- Row 3: Monthly trend (full width) ---- */}
        <section>
          <CardShell title="本月每日完成次数" icon={<CalendarIcon className="w-5 h-5" />}>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
                暂无数据
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.area} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.area} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartColors.grid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: chartColors.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: chartColors.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: dark ? "#1e293b" : "#fff",
                        border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      formatter={(value) => [value, "完成次数"]}
                      labelFormatter={(label) => `${label}日`}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={chartColors.area}
                      strokeWidth={2}
                      fill="url(#colorCompleted)"
                      dot={{ r: 2, fill: chartColors.area }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardShell>
        </section>
      </main>
    </div>
  );
}
