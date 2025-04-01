import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
  const cookieStore = cookies();
  const userSession = cookieStore.get('user_session')?.value;

  if (!userSession) {
    return null;
  }

  try {
    return JSON.parse(userSession);
  } catch (error) {
    console.error('解析用户会话失败:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 记录登出操作
    if (currentUser) {
      try {
        // 获取客户端IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

        // 记录登出日志
        await prisma.systemLog.create({
          data: {
            userId: currentUser.id,
            action: '用户登出',
            details: `退出系统 - ${currentUser.email}`,
            ipAddress
          }
        });
      } catch (logError) {
        console.error('记录登出日志失败:', logError);
      }
    }

    // 清除会话Cookie
    cookies().set({
      name: 'user_session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ message: '已成功退出登录' });
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json(
      { error: '登出过程中出现错误' },
      { status: 500 }
    );
  }
} 