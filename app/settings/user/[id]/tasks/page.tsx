import { format, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import { db } from "../../../../../db";
import { tasks, taskLogs, users } from "../../../../../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import DashboardClient from "../../../../../app/components/DashboardClient";
import { getCurrentUser } from "../../../../../lib/auth";
import { chinaNow } from "../../../../../lib/chinaDate";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function UserTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.admin) {
    redirect("/");
  }

  const { id } = await params;
  const targetUserId = parseInt(id, 10);

  // Guard against invalid user IDs
  if (isNaN(targetUserId)) {
    notFound();
  }

  // Verify user exists and get username
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
  if (!targetUser) {
    notFound();
  }

  // 读取当前 admin 的高考倒计时偏好
  let gaokaoEnabled: boolean | undefined;
  if (user.id !== null && user.id !== undefined) {
    const [adminRow] = await db
      .select({ gaokaoEnabled: users.gaokaoEnabled })
      .from(users)
      .where(eq(users.id, user.id as number))
      .limit(1);
    gaokaoEnabled = adminRow?.gaokaoEnabled;
  }

  const todayDate = chinaNow();
  const yesterdayDate = subDays(todayDate, 1);
  const tomorrowDate = addDays(todayDate, 1);

  const formattedToday = format(todayDate, "yyyy-MM-dd");
  const formattedYesterday = format(yesterdayDate, "yyyy-MM-dd");
  const formattedTomorrow = format(tomorrowDate, "yyyy-MM-dd");

  const monthStart = startOfMonth(todayDate);
  const monthEnd = endOfMonth(todayDate);
  const formattedMonthStart = format(monthStart, "yyyy-MM-dd");
  const formattedMonthEnd = format(monthEnd, "yyyy-MM-dd");

  const userCondition = eq(tasks.userId, targetUserId);

  const [resY, resT, resTom, resMonth] = await Promise.all([
    db.select({
      id: taskLogs.id,
      taskId: taskLogs.taskId,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      type: taskLogs.type,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(eq(taskLogs.scheduleDate, formattedYesterday), userCondition)),

    db.select({
      id: taskLogs.id,
      taskId: taskLogs.taskId,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      type: taskLogs.type,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(eq(taskLogs.scheduleDate, formattedToday), userCondition)),

    db.select({
      id: taskLogs.id,
      taskId: taskLogs.taskId,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      type: taskLogs.type,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(eq(taskLogs.scheduleDate, formattedTomorrow), userCondition)),

    db.select({
      id: taskLogs.id,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(gte(taskLogs.scheduleDate, formattedMonthStart), lte(taskLogs.scheduleDate, formattedMonthEnd), userCondition)),
  ]);

  const initialCalendarStatus: Record<string, { completed: number; total: number }> = {};
  resMonth.forEach((log: { id: number; scheduleDate: string; status: boolean }) => {
    const date = log.scheduleDate;
    if (!initialCalendarStatus[date]) {
      initialCalendarStatus[date] = { completed: 0, total: 0 };
    }
    initialCalendarStatus[date].total += 1;
    if (log.status) {
      initialCalendarStatus[date].completed += 1;
    }
  });

  const initialTasks = {
    yesterday: resY,
    today: resT,
    tomorrow: resTom,
  };

  return (
    <>
      {/* Absolute Header Overlay for Admin return link */}
      <div className="fixed top-16 md:top-24 inset-x-0 z-30 bg-slate-800 dark:bg-slate-800/95 text-white dark:text-slate-200 px-4 md:px-12 py-2 flex items-center shadow-md dark:shadow-slate-950/50 dark:border-b dark:border-slate-700/50">
        <Link href="/settings" className="flex items-center gap-2 hover:text-slate-300 dark:hover:text-slate-100 transition-colors text-sm font-bold">
          <ArrowLeft className="w-4 h-4" /> 返回设置
        </Link>
        <span className="mx-4 text-slate-500 dark:text-slate-400">|</span>
        <span className="text-sm font-bold">正在管理用户: <span className="text-blue-300 dark:text-blue-400">{targetUser.username}</span> 的任务</span>
      </div>
      
      <div className="pt-10">
        <DashboardClient
          initialTasks={initialTasks}
          initialCalendarStatus={initialCalendarStatus}
          isAdmin={true}
          targetUserId={targetUserId}
          gaokaoEnabled={gaokaoEnabled}
        />
      </div>
    </>
  );
}
