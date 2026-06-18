import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { tasks, userCondition, findMonthStatus } from '../../../../db/repository';

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

    const targetUserId = targetUserIdStr ? parseInt(targetUserIdStr, 10) : undefined;
    const condition = userCondition(tasks, user, targetUserId);

    const dailyStatus = await findMonthStatus(start, end, condition);

    return NextResponse.json(dailyStatus);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
