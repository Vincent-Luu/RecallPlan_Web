import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { tasks, userCondition, findAllTasks } from '../../../../db/repository';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserIdStr = searchParams.get('userId');

    const targetUserId = targetUserIdStr ? parseInt(targetUserIdStr, 10) : undefined;
    const condition = userCondition(tasks, user, targetUserId);

    const allTasks = await findAllTasks(condition);

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Use standard task creation endpoint' }, { status: 400 });
}
