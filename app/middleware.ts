import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 默认用户 - 仅用于测试环境
const DEFAULT_USER = {
  id: "test-student-id",
  name: "李同学",
  email: "student@example.com",
  role: "STUDENT",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 创建临时的测试用户会话，仅用于开发环境
  const hasSession = request.cookies.has('user_session');
  
  if (!hasSession) {
    // 设置默认用户会话cookie
    response.cookies.set({
      name: 'user_session',
      value: JSON.stringify(DEFAULT_USER),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
    
    console.log('已设置测试用户会话');
  }
  
  return response;
}

// 在所有路径上应用中间件
export const config = {
  matcher: [
    // 在所有路由上应用
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 