import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { tasks, taskLogs } from '../../../../db/schema';
import { sql, eq, and, gte, lte, isNull } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';
import { todayStr, chinaNow } from '../../../../lib/chinaDate';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

const INTERVAL_OFFSETS = [0, 1, 3, 7, 13, 29];
const INTERVAL_LABELS: Record<number, string> = {
  0: '20分钟',
  1: '1天后',
  3: '3天后',
  7: '7天后',
  13: '14天后',
  29: '30天后',
};

/**
 * Parse a "YYYY-MM-DD" scheduleDate string into a midnight Date (local).
 * Used for day-diff arithmetic — both dates are normalized to midnight
 * so the difference is independent of timezone.
 */
function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'week' | 'month' | 'all'
    const targetUserIdStr = searchParams.get('userId');

    // --- Build userCondition (identical to /api/tasks/all and /api/tasks/month) ---
    let userCondition;
    if (user.admin && targetUserIdStr) {
      userCondition = eq(tasks.userId, parseInt(targetUserIdStr, 10));
    } else if (user.admin && user.id === null) {
      userCondition = isNull(tasks.userId);
    } else {
      userCondition = eq(tasks.userId, user.id as number);
    }

    // --- Build dateCondition for period-filtered queries ---
    const today = chinaNow();
    let dateCondition;
    if (period === 'week') {
      const ws = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const we = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      dateCondition = and(gte(taskLogs.scheduleDate, ws), lte(taskLogs.scheduleDate, we));
    } else if (period === 'month') {
      const ms = format(startOfMonth(today), 'yyyy-MM-dd');
      const me = format(endOfMonth(today), 'yyyy-MM-dd');
      dateCondition = and(gte(taskLogs.scheduleDate, ms), lte(taskLogs.scheduleDate, me));
    }
    // 'all' → no dateCondition

    // --- Query 1: Completion Rate (period-filtered) ---
    const completionQuery = db
      .select({
        completed: sql<number>`COUNT(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
        total: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(dateCondition ? and(userCondition, dateCondition) : userCondition);

    // --- Query 2: Per-subject breakdown (period-filtered) ---
    const subjectQuery = db
      .select({
        tag: tasks.tag,
        completed: sql<number>`COUNT(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
        total: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(dateCondition ? and(userCondition, dateCondition) : userCondition)
      .groupBy(tasks.tag);

    // --- Query 3: All completed dates for streak computation ---
    const streakQuery = db
      .select({
        scheduleDate: taskLogs.scheduleDate,
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(and(userCondition, eq(taskLogs.status, true)));

    // --- Query 4: Total completed (all-time) ---
    const totalQuery = db
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(and(userCondition, eq(taskLogs.status, true)));

    // --- Query 5: Monthly trend (current month, daily completed counts) ---
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
    const trendQuery = db
      .select({
        date: taskLogs.scheduleDate,
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(
        and(
          userCondition,
          eq(taskLogs.status, true),
          gte(taskLogs.scheduleDate, monthStart),
          lte(taskLogs.scheduleDate, monthEnd),
        ),
      )
      .groupBy(taskLogs.scheduleDate)
      .orderBy(taskLogs.scheduleDate);

    // --- Query 6: Interval completion (all-time, needs task.createdAt) ---
    const intervalQuery = db
      .select({
        scheduleDate: taskLogs.scheduleDate,
        status: taskLogs.status,
        createdAt: tasks.createdAt,
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(userCondition);

    // --- Execute all queries in parallel ---
    const [completionRes, subjectRes, streakRes, totalRes, trendRes, intervalRes] =
      await Promise.all([
        completionQuery,
        subjectQuery,
        streakQuery,
        totalQuery,
        trendQuery,
        intervalQuery,
      ]);

    // --- Post-process in JS ---

    // 1. Completion Rate
    const completed = completionRes[0]?.completed ?? 0;
    const total = completionRes[0]?.total ?? 0;
    const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    // 2. Subjects (add pending count)
    const subjects = subjectRes.map(
      (row: { tag: string | null; completed: number; total: number }) => ({
        tag: row.tag || '其他',
        completed: row.completed,
        pending: row.total - row.completed,
        total: row.total,
      }),
    );

    // 3. Streak computation — walk backward from today, count consecutive days with completions
    const completedDates = new Set(
      streakRes.map((r: { scheduleDate: string }) => r.scheduleDate),
    );
    let streak = 0;
    const todayStrVal = todayStr();
    let cursor = today;

    while (true) {
      const ds = format(cursor, 'yyyy-MM-dd');
      if (completedDates.has(ds)) {
        streak++;
        cursor = subDays(cursor, 1);
      } else if (ds === todayStrVal) {
        // Today might not have completions yet — skip and check yesterday
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }

    // 4. Total completed
    const totalCompleted = totalRes[0]?.count ?? 0;

    // 5. Monthly trend
    const monthlyTrend = trendRes.map((r: { date: string; count: number }) => ({
      date: r.date,
      count: r.count,
    }));

    // 6. Interval completion
    const intervalMap = new Map<number, { completed: number; total: number }>();
    for (const offset of INTERVAL_OFFSETS) {
      intervalMap.set(offset, { completed: 0, total: 0 });
    }

    for (const row of intervalRes) {
      if (!row.createdAt || !row.scheduleDate) continue;

      // Normalize both dates to midnight for day-diff calculation
      const createdDate = new Date(row.createdAt as string | number);
      const createdDateOnly = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate(),
      );
      const schedDateOnly = parseDateStr(row.scheduleDate);
      const dayDiff = Math.round(
        (schedDateOnly.getTime() - createdDateOnly.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (!intervalMap.has(dayDiff)) continue;
      const entry = intervalMap.get(dayDiff)!;
      entry.total++;
      if (row.status) entry.completed++;
    }

    const intervalCompletion = INTERVAL_OFFSETS.map(offset => {
      const entry = intervalMap.get(offset)!;
      return {
        interval: offset,
        label: INTERVAL_LABELS[offset],
        completed: entry.completed,
        total: entry.total,
        percentage:
          entry.total > 0 ? Math.round((entry.completed / entry.total) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json({
      completionRate: { completed, total, percentage },
      subjects,
      streak,
      totalCompleted,
      monthlyTrend,
      intervalCompletion,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
