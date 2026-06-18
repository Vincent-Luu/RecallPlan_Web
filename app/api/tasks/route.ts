import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { todayStr } from '../../../lib/chinaDate';
import {
  tasks,
  userCondition,
  insertTask,
  insertTaskLogs,
  findTaskLogsForDate,
} from '../../../db/repository';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, tag, localDate, targetUserId } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    let finalUserId: number | null = user.id as number;
    if (user.admin) {
      if (targetUserId !== undefined) {
        finalUserId = targetUserId;
      } else if (user.id === null) {
        finalUserId = null; // super admin (env) own tasks
      }
      // DB admin keeps their own id (already set above)
    }

    // Insert new task
    const taskId = await insertTask({ title, tag, userId: finalUserId });

    // Use provided localDate (YYYY-MM-DD) or fallback to server date
    let baseDate: Date;
    if (localDate) {
      const [year, month, day] = localDate.split('-').map(Number);
      baseDate = new Date(year, month - 1, day);
    } else {
      baseDate = new Date();
    }

    // Ebbinghaus intervals: 20min (twenty_min), 2nd day, 4th day, 8th, 14th, 30th
    // Day 0 (offset 0) is replaced by the 20-minute review below
    const intervals = [1, 3, 7, 13, 29];

    // Create the task logs
    const logsToInsert: Array<{
      taskId: number;
      scheduleDate: string;
      status: boolean;
      type: string;
    }> = intervals.map(offset => {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset);
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, '0');
      const D = String(d.getDate()).padStart(2, '0');
      return {
        taskId,
        scheduleDate: `${Y}-${M}-${D}`,
        status: false,
        type: 'regular',
      };
    });

    // Add 20-minute review on the creation day (only when localDate is today)
    const localDateIsToday = !localDate || localDate === todayStr();
    if (localDateIsToday) {
      logsToInsert.push({
        taskId,
        scheduleDate: todayStr(),
        status: false,
        type: 'twenty_min',
      });
    }

    await insertTaskLogs(logsToInsert);

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const targetUserIdStr = searchParams.get('userId');
    if (!date) return NextResponse.json({ error: 'Date is required (YYYY-MM-DD format)' }, { status: 400 });

    const targetUserId = targetUserIdStr ? parseInt(targetUserIdStr, 10) : undefined;
    const condition = userCondition(tasks, user, targetUserId);

    const logs = await findTaskLogsForDate(date, condition);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
