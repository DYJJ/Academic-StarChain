import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

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
    // 获取session cookie
    const cookieStore = cookies();
    const userSession = cookieStore.get('user_session')?.value;

    if (!userSession) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    try {
      // 解析用户会话
      const user = JSON.parse(userSession);

      // 从数据库获取最新的用户数据
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true
        }
      });

      if (!userData) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      // 返回用户信息
      return NextResponse.json({ user: userData });
    } catch (parseError) {
      console.error('解析会话错误:', parseError);
      return NextResponse.json(
        { error: '无效的会话数据' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
} 