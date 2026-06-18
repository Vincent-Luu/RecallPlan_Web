import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '../../../lib/auth';
import { listUsers, insertUser } from '../../../db/repository';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allUsers = await listUsers();
  return NextResponse.json(allUsers);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    if (/[^\x20-\x7E]/.test(password)) {
      return NextResponse.json({ error: '密码只能包含英文字母、数字和特殊符号，不可使用中文' }, { status: 400 });
    }

    // Prevent creating a user with the same username as the env admin
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    if (username === adminUsername) {
      return NextResponse.json({ error: '此用户名已被超级管理员占用，请使用其他用户名' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);

    await insertUser({
      username,
      password: hashedPassword,
      role: 'user',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/users error:', error?.message || error, error?.code);
    if (error.code === '23505' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
