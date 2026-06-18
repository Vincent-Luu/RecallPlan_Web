import { NextResponse } from 'next/server';
import { signToken, verifyPassword } from '../../../lib/auth';
import { findUserByUsername } from '../../../db/repository';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username === adminUsername && password === adminPassword) {
      const token = await signToken({ admin: true, role: 'admin', id: null, username: adminUsername });

      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    }

    // Check database for standard users
    const user = await findUserByUsername(username);
    
    if (user && verifyPassword(password, user.password)) {
      // Check registration approval status
      if (user.status !== 'approved') {
        if (user.status === 'pending') {
          return NextResponse.json({ error: '您的注册申请尚未通过审核，请等待管理员审核' }, { status: 403 });
        }
        if (user.status === 'rejected') {
          return NextResponse.json({ error: '您的注册申请已被拒绝，请联系管理员' }, { status: 403 });
        }
        return NextResponse.json({ error: '该账户不可用，请联系管理员' }, { status: 403 });
      }

      const token = await signToken({ admin: user.role === 'admin', role: user.role, id: user.id, username: user.username });
      
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
