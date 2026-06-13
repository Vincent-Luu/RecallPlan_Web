import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { tasks, taskLogs } from '../../../../db/schema';
import { sql, eq, and, isNull } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserIdStr = searchParams.get('userId');
    
    let userCondition;
    if (user.admin && targetUserIdStr) {
      userCondition = eq(tasks.userId, parseInt(targetUserIdStr, 10));
    } else if (user.admin && user.id === null) {
      userCondition = isNull(tasks.userId);
    } else {
      userCondition = eq(tasks.userId, user.id as number);
    }

    const allTasks = await db.select({
      id: tasks.id,
      title: tasks.title,
      tag: tasks.tag,
      createdAt: tasks.createdAt,
      totalLogs: sql<number>`count(${taskLogs.id})`.mapWith(Number),
      completedLogs: sql<number>`count(CASE WHEN ${taskLogs.status} = true THEN 1 END)`.mapWith(Number),
    })
    .from(tasks)
    .leftJoin(taskLogs, eq(tasks.id, taskLogs.taskId))
    .where(userCondition)
    .groupBy(tasks.id)
    .orderBy(tasks.createdAt);
    
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Use standard task creation endpoint' }, { status: 400 });
}
