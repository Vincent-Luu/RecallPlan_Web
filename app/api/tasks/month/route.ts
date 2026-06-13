import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { taskLogs, tasks } from '../../../../db/schema';
import { gte, lte, and, isNull, eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const targetUserIdStr = searchParams.get('userId');

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    let userCondition;
    if (user.admin && targetUserIdStr) {
      userCondition = eq(tasks.userId, parseInt(targetUserIdStr, 10));
    } else if (user.admin && user.id === null) {
      userCondition = isNull(tasks.userId);
    } else {
      userCondition = eq(tasks.userId, user.id as number);
    }

    // Fetch the task logs for the specified date range
    const logs = await db.select({
      id: taskLogs.id,
      scheduleDate: taskLogs.scheduleDate,
      status: taskLogs.status,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .where(and(gte(taskLogs.scheduleDate, start), lte(taskLogs.scheduleDate, end), userCondition));

    // Group logs by date to compute daily completion status
    const dailyStatus: Record<string, { completed: number; total: number }> = {};

    logs.forEach((log: { scheduleDate: string; status: boolean }) => {
      const date = log.scheduleDate;
      if (!dailyStatus[date]) {
        dailyStatus[date] = { completed: 0, total: 0 };
      }
      dailyStatus[date].total += 1;
      if (log.status) {
        dailyStatus[date].completed += 1;
      }
    });

    return NextResponse.json(dailyStatus);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

