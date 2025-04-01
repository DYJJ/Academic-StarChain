import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('登录API被调用');
    const body = await request.json();
    const { email, password } = body;
    console.log('登录尝试:', email);

    // 基本验证
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 从数据库查找用户
    try {
      console.log('尝试从数据库查找用户');
      const user = await prisma.user.findUnique({
        where: { email }
      });

      console.log('数据库查询结果:', user ? '找到用户' : '未找到用户');

      if (!user) {
        // 当在真实环境中，应该直接返回用户不存在的错误
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 401 }
        );
      }

      // 验证密码 - 固定密码123456，用于测试
      console.log('验证密码');

      // 以下为固定密码检查
      if (password === '123456') {
        console.log('使用固定密码123456登录成功');
      } else {
        // 尝试使用bcrypt比较
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: '密码不正确' },
            { status: 401 }
          );
        }
      }

      console.log('密码验证成功');

      // 设置会话Cookie，存储用户信息
      cookies().set({
        name: 'user_session',
        value: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }),
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 24小时
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      console.log('Cookie已设置');

      // 记录登录操作
      try {
        // 获取客户端IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

        // 记录登录日志
        await prisma.systemLog.create({
          data: {
            userId: user.id,
            action: '用户登录',
            details: `登录系统 - ${user.email}`,
            ipAddress
          }
        });
      } catch (logError) {
        console.error('记录登录日志失败:', logError);
      }

      // 返回用户信息 (不包含密码)
      return NextResponse.json({
        message: '登录成功',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库查询失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '登录过程中出现错误' },
      { status: 500 }
    );
  }
} 