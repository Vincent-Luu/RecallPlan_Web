"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from "date-fns";
import { PlusCircle, CheckCircle2, Circle, Clock, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, X as CloseIcon, Sun, Moon, Loader2, Settings, StickyNote } from "lucide-react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import CountdownBanner from "./CountdownBanner";
import MemosModal from "./MemosModal";
import TwentyMinButton, { formatCountdown, TWENTY_MIN_MS } from "./TwentyMinButton";
import { SUBJECT_TAGS, getTagStyle } from "@/app/lib/subjectTags";

type TaskLog = {
  id: number;
  taskId: number;
  scheduleDate: string;
  status: boolean;
  title: string;
  tag: string | null;
  createdAt?: string | number | null;
  type?: string | null;
};

type DailyStatus = {
  [dateStr: string]: { completed: number; total: number }
};

interface DashboardClientProps {
  initialTasks: {
    yesterday: TaskLog[];
    today: TaskLog[];
    tomorrow: TaskLog[];
  };
  initialCalendarStatus: DailyStatus;
  isAdmin?: boolean;
  targetUserId?: number;
  gaokaoEnabled?: boolean;
}

export default function DashboardClient({ initialTasks, initialCalendarStatus, isAdmin, targetUserId, gaokaoEnabled }: DashboardClientProps) {
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState(initialTasks);
  const [calendarStatus, setCalendarStatus] = useState(initialCalendarStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("其他");

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState<TaskLog[] | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [now, setNow] = useState<number | null>(null);

  // Update every 60s for countdown text refresh
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayDate = new Date();
  const yesterdayDate = subDays(todayDate, 1);
  const tomorrowDate = addDays(todayDate, 1);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getQueryAppend = () => targetUserId ? `&userId=${targetUserId}` : "";

  const fetchTasks = async () => {
    try {
      const formattedToday = format(todayDate, "yyyy-MM-dd");
      const formattedYesterday = format(yesterdayDate, "yyyy-MM-dd");
      const formattedTomorrow = format(tomorrowDate, "yyyy-MM-dd");

      const [resY, resT, resTom] = await Promise.all([
        fetch(`/api/tasks?date=${formattedYesterday}${getQueryAppend()}`).then(res => res.json()),
        fetch(`/api/tasks?date=${formattedToday}${getQueryAppend()}`).then(res => res.json()),
        fetch(`/api/tasks?date=${formattedTomorrow}${getQueryAppend()}`).then(res => res.json()),
      ]);

      setTasks({
        yesterday: Array.isArray(resY) ? resY : [],
        today: Array.isArray(resT) ? resT : [],
        tomorrow: Array.isArray(resTom) ? resTom : [],
      });
    } catch (error) {
      console.error("加载任务失败", error);
    }
  };

  const fetchMonthStatus = async () => {
    setIsCalendarLoading(true);
    try {
      const formattedStart = format(startOfMonth(viewDate), "yyyy-MM-dd");
      const formattedEnd = format(endOfMonth(viewDate), "yyyy-MM-dd");
      const resCal = await fetch(`/api/tasks/month?start=${formattedStart}&end=${formattedEnd}${getQueryAppend()}`).then(res => res.json());
      setCalendarStatus(resCal || {});
    } catch (error) {
      console.error("加载月度状态失败", error);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthStatus();
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const handleDayClick = async (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    setSelectedDayDate(format(day, "yyyy年MM月dd日"));
    setSelectedDayTasks(null);
    setIsPreviewModalOpen(true);
    setIsDayLoading(true);

    try {
      const res = await fetch(`/api/tasks?date=${dayStr}${getQueryAppend()}`).then(r => r.json());
      setSelectedDayTasks(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("加载日期详情失败", error);
      setSelectedDayTasks([]);
    } finally {
      setIsDayLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isAddingTask) return;
    setIsAddingTask(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          tag: selectedTag,
          localDate: format(todayDate, "yyyy-MM-dd"),
          targetUserId: targetUserId
        }),
      });
      if (res.ok) {
        setNewTaskTitle("");
        setSelectedTag("其他");
        setIsModalOpen(false);
        fetchTasks();
        fetchMonthStatus();
      }
    } catch (error) {
      console.error("添加任务失败", error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleTaskStatus = async (id: number, currentStatus: boolean, daySection: 'yesterday' | 'today' | 'tomorrow' | 'preview') => {
    setTogglingIds(prev => { const next = new Set(prev); next.add(id); return next; });
    if (daySection !== 'preview') {
      setTasks(prev => ({
        ...prev,
        [daySection]: prev[daySection].map(task =>
          task.id === id ? { ...task, status: !currentStatus } : task
        )
      }));
    } else {
      setSelectedDayTasks(prev =>
        prev ? prev.map(task => task.id === id ? { ...task, status: !currentStatus } : task) : null
      );
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !currentStatus }),
      });
      if (res.ok) {
        fetchMonthStatus();
        if (daySection !== 'preview') fetchTasks();
      }
    } catch (error) {
      console.error("更新状态失败", error);
      fetchTasks();
      fetchMonthStatus();
    } finally {
      setTogglingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const TaskCardList = ({ 
    dateString, 
    tasksList, 
    title, 
    daySection 
  }: { 
    dateString: string, 
    tasksList: TaskLog[], 
    title: string, 
    daySection: 'yesterday' | 'today' | 'tomorrow' | 'preview'
  }) => (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col px-2">
        <h2 className={`text-2xl font-bold ${daySection === 'preview' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>{title}</h2>
        <span className="text-sm font-medium text-slate-400 dark:text-slate-400 mt-1">{dateString}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-4 mt-4">
        {tasksList.length === 0 ? (
          <div className={`h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-colors ${daySection === 'preview' ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50' : 'border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-900/30'}`}>
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">没有安排任务</p>
          </div>
        ) : daySection === 'today' ? (
          /* Today: group by taskId to merge twenty_min + regular logs into one row */
          (() => {
            const grouped = new Map<number, { regular?: TaskLog; twentyMin?: TaskLog; title: string; tag: string | null; createdAt: TaskLog['createdAt'] }>();
            tasksList.forEach(log => {
              if (!grouped.has(log.taskId)) {
                grouped.set(log.taskId, { title: log.title, tag: log.tag, createdAt: log.createdAt });
              }
              const entry = grouped.get(log.taskId)!;
              if (log.type === 'twenty_min') entry.twentyMin = log;
              else entry.regular = log;
            });

            return Array.from(grouped.values()).map(({ regular, twentyMin, title, tag, createdAt }) => {
              // Render row with 20min button (replaces day-0 daily check-in)
              if (twentyMin) {
                const remainingMs = (createdAt && now !== null) ? Math.min(TWENTY_MIN_MS, Math.max(0, (new Date(createdAt).getTime() + TWENTY_MIN_MS) - now)) : 0;
                const remainingMinutes = Math.ceil(remainingMs / 60000);

                return (
                  <div
                    key={twentyMin.id}
                    className={`group flex items-center p-4 rounded-2xl transition-all duration-300 backdrop-blur-md border ${
                      twentyMin.status
                        ? 'bg-slate-100/80 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-700'
                        : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* 20-min review button */}
                    <TwentyMinButton
                      taskLogId={twentyMin.id}
                      status={twentyMin.status}
                      createdAt={createdAt ?? null}
                      onToggle={(id, currentStatus) => toggleTaskStatus(id, currentStatus, daySection)}
                      isToggling={togglingIds.has(twentyMin.id)}
                    />

                    {tag && (
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold mr-3 border ${getTagStyle(tag).bg} ${getTagStyle(tag).text} ${getTagStyle(tag).border} dark:opacity-90 shadow-sm flex-shrink-0`}>
                        {tag}
                      </div>
                    )}

                    <span className={`text-lg font-medium transition-all ${
                      twentyMin.status ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {title}
                    </span>

                    {/* Countdown timer — right side */}
                    {!twentyMin.status && remainingMinutes > 0 && (
                      <span className="ml-auto text-sm font-medium text-amber-500 dark:text-amber-400 flex-shrink-0">
                        {formatCountdown(remainingMinutes)}
                      </span>
                    )}
                  </div>
                );
              }

              // Fallback: only regular log (old tasks w/o 20min) — render normal single row
              const task = regular!;
              return (
                <div
                  key={task.id}
                  className={`group flex items-center p-4 rounded-2xl transition-all duration-300 backdrop-blur-md border ${
                    task.status
                      ? 'bg-slate-100/80 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-700'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer shadow-sm hover:shadow-md'
                  }`}
                  onClick={() => toggleTaskStatus(task.id, task.status, daySection)}
                >
                  <button className="mr-4 focus:outline-none flex-shrink-0 transition-transform group-hover:scale-110 group-active:scale-95">
                    {togglingIds.has(task.id) ? (
                      <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-spin" />
                    ) : task.status ? (
                      <CheckCircle2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300" />
                    )}
                  </button>

                  {task.tag && (
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold mr-3 border ${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} ${getTagStyle(task.tag).border} dark:opacity-90 shadow-sm flex-shrink-0`}>
                      {task.tag}
                    </div>
                  )}

                  <span className={`text-lg font-medium transition-all ${
                    task.status ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {task.title}
                  </span>
                </div>
              );
            });
          })()
        ) : (
          /* Yesterday / Tomorrow / Preview: flat rendering (no grouping) */
          tasksList.map(task => (
            <div
              key={task.id}
              className={`group flex items-center p-4 rounded-2xl transition-all duration-300 backdrop-blur-md border ${
                task.status
                  ? 'bg-slate-100/80 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-700'
                  : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer shadow-sm hover:shadow-md'
              }`}
              onClick={() => toggleTaskStatus(task.id, task.status, daySection)}
            >
              <button className="mr-4 focus:outline-none flex-shrink-0 transition-transform group-hover:scale-110 group-active:scale-95">
                {togglingIds.has(task.id) ? (
                  <Loader2 className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-spin" />
                ) : task.status ? (
                  <CheckCircle2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300" />
                )}
              </button>

              {task.tag && (
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold mr-3 border ${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} ${getTagStyle(task.tag).border} dark:opacity-90 shadow-sm flex-shrink-0`}>
                  {task.tag}
                </div>
              )}

              <span className={`text-lg font-medium transition-all ${
                task.status ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
              }`}>
                {task.title}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-slate-300/50 dark:selection:bg-slate-700/50 relative overflow-hidden transition-colors duration-500">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/60 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none transition-colors duration-700" />

      <header className="fixed top-0 inset-x-0 h-16 md:h-24 flex items-center justify-between px-4 md:px-12 z-40 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/50 dark:border-slate-800 shadow-sm transition-colors duration-500">
        <div className="flex items-center gap-2 md:gap-6">
          <h1 className="text-base md:text-3xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight transition-colors">
            艾宾浩斯日程计划
          </h1>
          <button
            onClick={() => setIsMemoOpen(true)}
            className="flex items-center gap-1.5 md:gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <StickyNote className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">备忘录</span>
          </button>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-1.5 md:gap-2 bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">月度视图</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 md:gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">设置</span>
          </Link>
          <Link
            href={targetUserId ? `/tasks?userId=${targetUserId}` : "/tasks"}
            className="flex items-center gap-1.5 md:gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <List className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">任务列表</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 md:p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-semibold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
            title="切换深色/浅色模式"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 md:gap-2 bg-slate-600 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-800 px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold shadow-md transition-all hover:scale-105 active:scale-95 md:ml-2"
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">新任务</span>
          </button>
        </div>
      </header>

      <main className="pt-24 md:pt-32 pb-12 px-4 md:px-12 min-h-screen max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8">

        <CountdownBanner gaokaoEnabled={gaokaoEnabled} />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-[calc(100vh-14rem)]">
          
          <div className="hidden lg:flex relative transform lg:scale-95 opacity-80 blur-[0.5px] hover:blur-none hover:opacity-100 transition-all duration-500 ease-out flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
            <TaskCardList 
              title="昨天" 
              dateString={format(yesterdayDate, "MM月dd日")} 
              tasksList={tasks.yesterday} 
              daySection="yesterday"
            />
          </div>

          <div className="relative transform z-20 flex flex-col bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-700 ring-1 ring-slate-100/50 dark:ring-slate-700/50 h-full transition-colors duration-500">
            <TaskCardList 
              title="今天" 
              dateString={format(todayDate, "yyyy年 MM月dd日")} 
              tasksList={tasks.today} 
              daySection="today"
            />
          </div>

          <div className="hidden lg:flex relative transform lg:scale-95 opacity-80 blur-[0.5px] hover:blur-none hover:opacity-100 transition-all duration-500 ease-out flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[2rem] p-6 shadow-md border border-white/60 dark:border-slate-700/60">
            <TaskCardList 
              title="明天" 
              dateString={format(tomorrowDate, "MM月dd日")} 
              tasksList={tasks.tomorrow} 
              daySection="tomorrow"
            />
          </div>

        </section>
      </main>

      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white dark:border-slate-800 w-full max-w-md rounded-[2rem] p-5 md:p-6 shadow-huge relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-100 via-slate-400 to-slate-100 dark:from-slate-800 dark:via-slate-500 dark:to-slate-800 opacity-20" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{format(viewDate, "yyyy年 MM月")}</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-medium hidden sm:block">点击日期预览打卡</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all text-slate-600 dark:text-slate-300 active:scale-90"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all text-slate-600 dark:text-slate-300 active:scale-90"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-1.5 relative">
              {isCalendarLoading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-spin" />
                </div>
              )}
              {daysInMonth.map(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                const status = calendarStatus[dayStr];

                let bgColorClass = "bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500";
                let textClass = "text-slate-400 dark:text-slate-500";

                if (status?.total > 0) {
                  if (status.completed === status.total) {
                    bgColorClass = "bg-green-500/10 dark:bg-green-500/20 border-green-200 dark:border-green-800 hover:bg-green-500/20";
                    textClass = "text-green-700 dark:text-green-400 font-bold";
                  } else {
                    bgColorClass = "bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-500/20";
                    textClass = "text-yellow-700 dark:text-yellow-400 font-bold";
                  }
                }

                if (isToday(day)) {
                  bgColorClass += " ring-2 ring-slate-400 dark:ring-slate-500 ring-offset-2 dark:ring-offset-slate-900";
                }

                return (
                  <div
                    key={day.toString()}
                    onClick={() => {
                        handleDayClick(day);
                        setIsCalendarOpen(false);
                    }}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all shadow-sm ${bgColorClass}`}
                  >
                    <span className={`text-sm md:text-base font-semibold ${textClass}`}>
                      {format(day, "d")}
                    </span>
                    {status?.total > 0 && (
                      <span className="text-[10px] mt-0.5 opacity-60">
                        {status.completed}/{status.total}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-[2rem] p-5 md:p-6 shadow-huge relative">
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <div className="max-h-[60vh] overflow-y-auto">
              {isDayLoading || !selectedDayTasks ? (
                <div className="h-48 flex flex-col space-y-4">
                  <div className="flex flex-col px-2">
                    <div className="h-7 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded mt-2 animate-pulse" />
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 text-slate-300 dark:text-slate-600 animate-spin" />
                    <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">加载任务数据...</span>
                  </div>
                </div>
              ) : (
                <TaskCardList
                  title={`${selectedDayDate} 任务预览`}
                  dateString="点击任务即可快速打卡"
                  tasksList={selectedDayTasks}
                  daySection="preview"
                />
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-start items-center">
              <button
                onClick={() => {
                    setIsPreviewModalOpen(false);
                    setIsCalendarOpen(true);
                }}
                className="text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                ← 返回日历
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">新建复习任务</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">系统将自动按照艾宾浩斯遗忘曲线（20分钟, 2, 4, 8, 14, 30天）为您安排复习打卡。</p>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="任务名称（例如：英语第一单元生词）"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">选择学科标签</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUBJECT_TAGS.map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => setSelectedTag(tag.name)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border-2 ${
                        selectedTag === tag.name
                          ? `${tag.bg} ${tag.text} ${tag.border.replace('border-', 'border-')} ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-600`
                          : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim() || isAddingTask}
                  className="px-5 py-2.5 rounded-xl font-bold bg-slate-600 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-800 transition-colors disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  {isAddingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isAddingTask ? "正在创建..." : "确认安排"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #94a3b8;
        }
        .shadow-huge {
          box-shadow: 0 30px 60px -12px rgba(50, 50, 93, 0.1), 0 18px 36px -18px rgba(0, 0, 0, 0.15);
        }
      `}} />

      {isMemoOpen && (
        <MemosModal
          isOpen={isMemoOpen}
          onClose={() => setIsMemoOpen(false)}
          targetUserId={targetUserId}
        />
      )}
    </div>
  );
}
