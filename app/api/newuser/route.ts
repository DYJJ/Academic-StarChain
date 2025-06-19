import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';

// 创建Prisma客户端实例
const prismaClient = new PrismaClient();

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
export async function GET(req: NextRequest) {
  try {
    // 获取当前用户会话信息
    const user = await getCurrentUser(req);
    if (!user || !user.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const currentUserId = user.id;

    // 获取查询参数
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const courseId = url.searchParams.get('courseId');

    // 获取当前用户的详细信息包括角色
    const currentUserDetails = await prismaClient.user.findUnique({
      where: { id: currentUserId }
    });

    if (!currentUserDetails) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    let users = [];

    // 根据当前用户角色和目标角色获取适当的用户列表
    if (currentUserDetails.role === 'STUDENT') {
      // 学生只能联系其课程的教师
      if (role === 'TEACHER') {
        // 获取学生已选课程的教师
        const teacherQuery = courseId && courseId !== 'all'
          ? {
            // 查询特定课程的教师
            enrollments: {
              some: {
                userId: currentUserId,
                courseId: courseId
              }
            },
            users: {
              some: {
                role: 'TEACHER'
              }
            }
          }
          : {
            // 查询所有学生已选课程的教师
            enrollments: {
              some: {
                userId: currentUserId
              }
            },
            users: {
              some: {
                role: 'TEACHER'
              }
            }
          };

        const teacherCourses = await prismaClient.course.findMany({
          where: teacherQuery,
          include: {
            users: {
              where: { role: 'TEACHER' },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true
              }
            }
          }
        });

        // 提取教师信息并添加所属课程信息
        const teachersWithCourses = [];

        teacherCourses.forEach(course => {
          course.users.forEach(teacher => {
            teachersWithCourses.push({
              ...teacher,
              course: {
                id: course.id,
                name: course.name,
                code: course.code
              }
            });
          });
        });

        // 去重
        const uniqueTeachers = Array.from(
          new Map(teachersWithCourses.map(teacher => [teacher.id, teacher])).values()
        );

        users = uniqueTeachers;
      } else {
        // 学生不能联系其他学生
        users = [];
      }
    } else if (currentUserDetails.role === 'TEACHER') {
      // 教师只能联系其教授课程的学生
      if (role === 'STUDENT') {
        // 获取教师教授课程的学生
        const studentQuery = courseId && courseId !== 'all'
          ? {
            // 查询特定课程的学生
            users: {
              some: {
                id: currentUserId,
                role: 'TEACHER'
              }
            },
            enrollments: {
              some: {
                ...(courseId !== 'all' ? { courseId } : {})
              }
            }
          }
          : {
            // 查询所有教师教授课程的学生
            users: {
              some: {
                id: currentUserId,
                role: 'TEACHER'
              }
            }
          };

        // 首先查询课程
        const studentCourses = await prismaClient.course.findMany({
          where: studentQuery,
          include: {
            enrollments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        });

        // 提取学生信息并添加所属课程信息
        const studentsWithCourses = [];

        studentCourses.forEach(course => {
          course.enrollments.forEach(enrollment => {
            // 检查是否是学生角色
            if (enrollment.user && enrollment.user.role === 'STUDENT') {
              studentsWithCourses.push({
                ...enrollment.user,
                course: {
                  id: course.id,
                  name: course.name,
                  code: course.code
                }
              });
            }
          });
        });

        // 去重
        const uniqueStudents = Array.from(
          new Map(studentsWithCourses.map(student => [student.id, student])).values()
        );

        users = uniqueStudents;
      } else {
        // 教师不需要联系其他教师
        users = [];
      }
    } else if (currentUserDetails.role === 'ADMIN') {
      // 管理员可以联系所有用户
      users = await prismaClient.user.findMany({
        where: {
          id: { not: currentUserId },
          ...(role ? { role } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true
        }
      });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('获取用户列表出错:', error);
    return NextResponse.json(
      { error: '获取用户列表失败' },
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
    const { name, email, password, role, avatarUrl } = body;

    // 验证必填字段
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prismaClient.user.findUnique({
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
    const newUser = await prismaClient.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatarUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
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
    const { id, name, email, role, password, avatarUrl } = body;

    // 验证必填字段
    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prismaClient.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not Found - User not found' },
        { status: 404 }
      );
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await prismaClient.user.findUnique({
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
      role,
      avatarUrl
    };

    // 如果头像URL为null，移除该字段而不是设置为null
    if (updateData.avatarUrl === undefined) {
      delete updateData.avatarUrl;
    }

    // 如果提供了新密码，则哈希后更新
    if (password) {
      updateData.password = await bcryptjs.hash(password, 10);
    }

    // 更新用户
    const updatedUser = await prismaClient.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
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
    const user = await prismaClient.user.findUnique({
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
    await prismaClient.user.delete({
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