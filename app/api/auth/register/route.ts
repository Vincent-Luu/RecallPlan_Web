import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';

export async function POST(request: Request) {
  try {
    const { username, password, confirmPassword } = await request.json();

    // Validation
    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }
    if (username.length < 2) {
      return NextResponse.json({ error: '用户名至少需要 2 个字符' }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ error: '密码至少需要 4 个字符' }, { status: 400 });
    }
    if (/[^\x20-\x7E]/.test(password)) {
      return NextResponse.json({ error: '密码只能包含英文字母、数字和特殊符号，不可使用中文' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: '两次输入的密码不一致' }, { status: 400 });
    }

    // Prevent registering with the same username as the env admin
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    if (username === adminUsername) {
      return NextResponse.json({ error: '此用户名已被占用，请使用其他用户名' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);

    await db.insert(users).values({
      username,
      password: hashedPassword,
      status: 'pending',
      role: 'user',
    }).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/auth/register error:', error?.message || error, error?.code);
    if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: '该用户名已被注册，请使用其他用户名' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
