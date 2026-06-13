import { format, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import { db } from "../db";
import { tasks, taskLogs, users } from "../db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import DashboardClient from "./components/DashboardClient";
import { getCurrentUser } from "../lib/auth";
import { chinaNow } from "../lib/chinaDate";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
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

  const userCondition = user.admin && user.id === null
    ? isNull(tasks.userId)
    : eq(tasks.userId, user.id as number);

  // 读取高考倒计时偏好（env admin 无 DB 记录，传 undefined 走 localStorage 回退）
  let gaokaoEnabled: boolean | undefined;
  if (user.id !== null && user.id !== undefined) {
    const [userRow] = await db
      .select({ gaokaoEnabled: users.gaokaoEnabled })
      .from(users)
      .where(eq(users.id, user.id as number))
      .limit(1);
    gaokaoEnabled = userRow?.gaokaoEnabled;
  }

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

  // Process monthly data
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
    <DashboardClient
      initialTasks={initialTasks}
      initialCalendarStatus={initialCalendarStatus}
      isAdmin={!!user.admin}
      gaokaoEnabled={gaokaoEnabled}
    />
  );
}
