import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../lib/auth';

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // env admin 没有 DB 记录，返回成功让客户端用 localStorage
    if (user.id === null || user.id === undefined) {
      return NextResponse.json({ success: true, gaokaoEnabled: true });
    }

    const { gaokaoEnabled } = await request.json();

    if (typeof gaokaoEnabled !== 'boolean') {
      return NextResponse.json({ error: 'gaokaoEnabled must be a boolean' }, { status: 400 });
    }

    await db.update(users)
      .set({ gaokaoEnabled })
      .where(eq(users.id, user.id as number));

    return NextResponse.json({ success: true, gaokaoEnabled });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
