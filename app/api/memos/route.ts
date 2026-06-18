import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { memos, userCondition, listMemos, insertMemo } from '../../../db/repository';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserIdStr = searchParams.get('userId');
    const targetUserId = targetUserIdStr ? parseInt(targetUserIdStr, 10) : undefined;

    const condition = userCondition(memos, user, targetUserId);
    const result = await listMemos(condition);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching memos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, content } = await request.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let finalUserId: number | null = user.id as number;
    if (user.admin && user.id === null) {
      finalUserId = null;
    }

    const newMemo = await insertMemo({
      title: title.trim(),
      content: content || '',
      userId: finalUserId,
    });

    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
