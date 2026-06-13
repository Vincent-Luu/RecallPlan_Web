import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { memos } from '../../../db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserIdStr = searchParams.get('userId');

    let userCondition;
    if (user.admin && targetUserIdStr) {
      userCondition = eq(memos.userId, parseInt(targetUserIdStr, 10));
    } else if (user.admin && user.id === null) {
      userCondition = isNull(memos.userId);
    } else {
      userCondition = eq(memos.userId, user.id as number);
    }

    const result = await db.select()
      .from(memos)
      .where(userCondition)
      .orderBy(desc(memos.updatedAt));

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

    const newMemo = await db.insert(memos)
      .values({ title: title.trim(), content: content || '', userId: finalUserId })
      .returning();

    return NextResponse.json(newMemo[0], { status: 201 });
  } catch (error) {
    console.error('Error creating memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
