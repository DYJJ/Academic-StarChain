import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

// 创建Prisma客户端实例
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

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/users 被调用');

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const url = new URL(request.url);
    const roleParam = url.searchParams.get('role');

    // 查询条件
    const where: any = {};

    // 如果指定了角色参数，则按角色过滤
    if (roleParam) {
      where.role = roleParam;
    }
    // 如果不是管理员，则只允许查询教师
    else if (currentUser.role !== 'ADMIN') {
      where.role = 'TEACHER';
    }

    // 如果是普通教师查询，允许查询教师列表（用于分配教师时选择）
    if (currentUser.role === 'TEACHER' && (!roleParam || roleParam === 'TEACHER')) {
      // 允许教师查询其他教师
    }
    // 其他情况需要管理员权限
    else if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 使用Prisma查询用户列表
    console.log('开始查询用户数据');
    try {
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      console.log(`查询到 ${users.length} 个用户`);
      return NextResponse.json({ users }, { status: 200 });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库查询失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 添加新用户
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { name, email, password, role } = body;

    // 验证必填字段
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Conflict - Email already exists' },
        { status: 409 }
      );
    }

    // 创建新用户
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 更新用户
export async function PUT(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { id, name, email, role, password } = body;

    // 验证必填字段
    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found - User not found' },
        { status: 404 }
      );
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== id) {
      return NextResponse.json(
        { error: 'Conflict - Email already exists' },
        { status: 409 }
      );
    }

    // 准备更新数据
    const updateData: any = {
      name,
      email,
      role
    };

    // 如果提供了新密码，则哈希后更新
    if (password) {
      updateData.password = await bcryptjs.hash(password, 10);
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(
      { message: 'User updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(request: NextRequest) {
  try {
    // 获取用户ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request - Missing user ID' },
        { status: 400 }
      );
    }

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found - User not found' },
        { status: 404 }
      );
    }

    // 不允许删除自己
    if (user.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot delete your own account' },
        { status: 403 }
      );
    }

    // 删除用户
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 