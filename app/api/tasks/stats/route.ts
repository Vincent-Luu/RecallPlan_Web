import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { todayStr, chinaNow } from '../../../../lib/chinaDate';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { gte, lte, and } from 'drizzle-orm';
import {
  tasks,
  taskLogs,
  userCondition,
  statsCompletion,
  statsSubjects,
  statsCompletedDates,
  statsTotalCompleted,
  statsMonthlyTrend,
  statsIntervalData,
} from '../../../../db/repository';

const INTERVAL_OFFSETS = [0, 1, 3, 7, 13, 29];
const INTERVAL_LABELS: Record<number, string> = {
  0: '20分钟',
  1: '1天后',
  3: '3天后',
  7: '7天后',
  13: '14天后',
  29: '30天后',
};

/** Parse "YYYY-MM-DD" → midnight Date (local). */
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
    const period = searchParams.get('period') || 'month';
    const targetUserIdStr = searchParams.get('userId');
    const targetUserId = targetUserIdStr ? parseInt(targetUserIdStr, 10) : undefined;

    const condition = userCondition(tasks, user, targetUserId);

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

    // --- Execute all queries in parallel ---
    const [
      completionRate,
      subjectRes,
      streakRes,
      totalCompleted,
      trendRes,
      intervalRes,
    ] = await Promise.all([
      statsCompletion(condition, dateCondition),
      statsSubjects(condition, dateCondition),
      statsCompletedDates(condition),
      statsTotalCompleted(condition),
      statsMonthlyTrend(
        condition,
        format(startOfMonth(today), 'yyyy-MM-dd'),
        format(endOfMonth(today), 'yyyy-MM-dd'),
      ),
      statsIntervalData(condition),
    ]);

    // --- Post-process in JS ---

    // 2. Subjects (add pending count)
    const subjects = subjectRes.map(
      (row: { tag: string | null; completed: number; total: number }) => ({
        tag: row.tag || '其他',
        completed: row.completed,
        pending: row.total - row.completed,
        total: row.total,
      }),
    );

    // 3. Streak computation
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
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }

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
      completionRate,
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
