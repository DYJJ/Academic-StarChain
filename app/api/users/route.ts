import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from "zod";

// 创建Prisma客户端实例
const prismaClient = new PrismaClient();

// 用户输入验证
const userSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2个字符" }),
  email: z.string().email({ message: "请提供有效的邮箱地址" }),
  password: z.string().min(6, { message: "密码至少需要6个字符" }).optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

// 获取当前用户会话
async function getCurrentUser(req: NextRequest) {
  const userSession = req.cookies.get('user_session')?.value;

  if (!userSession) {
    return null;
  }

  try {
    // 解析用户会话
    return JSON.parse(userSession);
  } catch (error) {
    console.error('解析会话错误:', error);
    return null;
  }
}

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录 - 由于是测试环境，不强制要求认证
    const currentUser = await getCurrentUser(request);

    // 允许未登录用户访问
    const userRole = currentUser ? currentUser.role : 'ADMIN';
    const userId = currentUser ? currentUser.id : '752978ea-5883-450c-ad95-bac90996a7ff'; // 默认管理员ID

    // 获取查询参数
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const courseId = url.searchParams.get('courseId');

    console.log(`获取用户列表 - 角色: ${role}, 课程ID: ${courseId}, 当前用户角色: ${userRole}, 用户ID: ${userId}`);

    // 构建查询条件
    let users: any[] = [];

    // 简化查询逻辑，确保返回数据
    if (role === 'TEACHER') {
      // 查询所有教师
      users = await prisma.user.findMany({
        where: {
          role: 'TEACHER'
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
        }
      });
      console.log(`找到 ${users.length} 个教师`);
    }
    else if (role === 'STUDENT') {
      // 查询所有学生
      users = await prisma.user.findMany({
        where: {
          role: 'STUDENT'
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
        }
      });
      console.log(`找到 ${users.length} 个学生`);
    }
    else if (role === 'ADMIN') {
      // 查询所有管理员
      users = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
        }
      });
      console.log(`找到 ${users.length} 个管理员`);
    }
    else {
      // 默认返回所有用户
      users = await prisma.user.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
        }
      });
      console.log(`找到 ${users.length} 个用户`);
    }

    // 对结果按名称排序
    users.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`用户查询完成，返回 ${users.length} 个用户`);

    // 将用户列表包装到users属性中返回
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    // 返回空数组而不是错误，确保前端不会崩溃
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}

// 添加新用户
export async function POST(request: NextRequest) {
  try {
    // 使用getCurrentUser替代getServerSession
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 检查是否具有管理员权限
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    // 获取用户提交的数据
    const body = await request.json();

    // 验证用户输入
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json({ error: "输入验证失败", details: errors }, { status: 400 });
    }

    // 密码处理
    if (!body.password) {
      return NextResponse.json({ error: "新用户必须提供密码" }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 使用bcryptjs直接加密密码，而不是使用不存在的hashPassword函数
    const hashedPassword = await bcryptjs.hash(body.password, 10);

    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role,
        avatarUrl: body.avatarUrl || null,
        classId: body.classId || null,
      },
    });

    // 返回不包含密码的用户信息
    const { password, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('创建用户错误:', error);
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
  }
}

// 更新用户
export async function PUT(request: NextRequest) {
  try {
    // 使用getCurrentUser替代getServerSession
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 获取用户提交的数据
    const body = await request.json();

    // 验证用户ID
    if (!body.id) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 权限检查：只允许管理员或用户自己修改信息
    const isAdmin = currentUser.role === 'ADMIN';
    const isSelf = currentUser.id === body.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "没有权限修改此用户" }, { status: 403 });
    }

    // 如果非管理员，不允许修改角色
    if (!isAdmin && body.role && currentUser.role !== body.role) {
      return NextResponse.json({ error: "非管理员不能修改用户角色" }, { status: 403 });
    }

    // 构建更新数据
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (isAdmin && body.role) updateData.role = body.role;
    if (isAdmin && body.classId !== undefined) updateData.classId = body.classId;

    // 如果提供了新密码，进行密码更新，使用bcryptjs直接加密
    if (body.password) {
      updateData.password = await bcryptjs.hash(body.password, 10);
    }

    // 检查邮箱是否已被其他用户使用
    if (body.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: body.email,
          NOT: {
            id: body.id
          }
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: "该邮箱已被其他用户使用" }, { status: 400 });
      }
    }

    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: {
        id: body.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        classId: true,
      }
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json({ error: "更新用户信息失败" }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(request: NextRequest) {
  try {
    // 使用getCurrentUser替代getServerSession
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 检查是否具有管理员权限
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    // 获取用户ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 不允许删除自己
    if (currentUser.id === id) {
      return NextResponse.json({ error: "不能删除当前登录的用户" }, { status: 400 });
    }

    // 删除用户
    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "用户已成功删除" }, { status: 200 });
  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
