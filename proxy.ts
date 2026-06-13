import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth');

  // 允许 API 认证端点通过（无需 token）
  if (isApiAuth) {
    return NextResponse.next();
  }

  // 无 token → 重定向到登录页（已在登录页则放行）
  if (!token) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 有 token → 放行，由各路由/API 的 getCurrentUser() 进行 JWT 验证
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
