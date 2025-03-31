import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 模拟数据库中的用户
const USERS = [
  {
    id: '1',
    name: '管理员',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: '张老师',
    email: 'teacher@example.com',
    password: 'teacher123',
    role: 'TEACHER',
  },
  {
    id: '3',
    name: '李同学',
    email: 'student@example.com',
    password: 'student123',
    role: 'STUDENT',
  }
];

export async function GET(request: NextRequest) {
  try {
    // 获取cookie中的用户会话
    const cookieStore = cookies();
    const userSession = cookieStore.get('user_session')?.value;

    if (!userSession) {
      return NextResponse.json(
        { error: '未登录或会话已过期' },
        { status: 401 }
      );
    }

    try {
      // 解析用户信息
      const user = JSON.parse(userSession);
      
      return NextResponse.json({ user });
    } catch (error) {
      console.error('解析用户会话失败:', error);
      return NextResponse.json(
        { error: '无效的会话' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
} 