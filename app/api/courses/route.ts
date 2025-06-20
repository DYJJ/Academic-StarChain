import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { logApiAction, logApiSuccess, logApiError } from '../../../lib/logMiddleware';

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

// 获取课程列表
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/courses 被调用');

    // 使用Prisma查询课程
    console.log('开始查询课程数据');
    try {
      const courses = await prisma.course.findMany({
        orderBy: {
          code: 'asc'
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      console.log(`查询到 ${courses.length} 门课程`);

      // 记录查询日志
      const currentUser = getCurrentUser(request);
      if (currentUser) {
        await logApiAction(
          request,
          '查询课程列表',
          `查询了 ${courses.length} 门课程`
        );
      }

      return NextResponse.json({ courses }, { status: 200 });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);

      // 记录错误日志
      const currentUser = getCurrentUser(request);
      if (currentUser) {
        await logApiError(
          request,
          '查询课程列表',
          dbError
        );
      }

      // 返回模拟数据作为备选
      const mockCourses = [
        {
          id: '1',
          code: 'CS101',
          name: '计算机科学导论',
          description: '这是一门计算机科学的入门课程，涵盖了计算机科学的基本概念和原理。',
          credit: 3,
          semester: '2023-2024-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teachers: []
        },
        {
          id: '2',
          code: 'CS201',
          name: '数据结构与算法',
          description: '这门课程详细讲解了常见的数据结构和算法设计技术。',
          credit: 4,
          semester: '2023-2024-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teachers: []
        },
        {
          id: '3',
          code: 'CS301',
          name: '数据库系统',
          description: '这门课程介绍了数据库系统的设计和实现原理。',
          credit: 3,
          semester: '2023-2024-2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teachers: []
        }
      ];
      return NextResponse.json({ courses: mockCourses }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 添加新课程
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
      await logApiAction(
        request,
        '创建课程',
        `尝试创建课程但权限不足，当前角色: ${currentUser.role}`
      );

      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { code, name, description, credit, semester, teacherIds } = body;

    // 验证必填字段
    if (!code || !name || !description || !credit || !semester) {
      await logApiError(
        request,
        '创建课程',
        '缺少必填字段'
      );

      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 检查课程代码是否已存在
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      await logApiError(
        request,
        '创建课程',
        `课程代码 ${code} 已存在`
      );

      return NextResponse.json(
        { error: 'Conflict - Course code already exists' },
        { status: 409 }
      );
    }

    // 创建新课程
    const newCourse = await prisma.course.create({
      data: {
        code,
        name,
        description,
        credit: Number(credit),
        semester,
        users: teacherIds && teacherIds.length > 0 ? {
          connect: teacherIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // 记录成功创建课程的日志
    const teacherNames = newCourse.users.map(t => t.name).join(', ');
    await logApiSuccess(
      request,
      '创建课程',
      `创建了新课程 ${newCourse.name}(${newCourse.code}), 学分: ${newCourse.credit}, 学期: ${newCourse.semester}, 分配教师: ${teacherNames || '无'}`
    );

    return NextResponse.json(
      { message: 'Course created successfully', course: newCourse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);

    // 记录错误日志
    const currentUser = getCurrentUser(request);
    if (currentUser) {
      await logApiError(
        request,
        '创建课程',
        error
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 更新课程
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
    const { id, code, name, description, credit, semester, teacherIds } = body;

    // 验证必填字段
    if (!id || !code || !name || !description || !credit || !semester) {
      return NextResponse.json(
        { error: 'Bad Request - Missing required fields' },
        { status: 400 }
      );
    }

    // 查找课程
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Not Found - Course not found' },
        { status: 404 }
      );
    }

    // 检查课程代码是否已被其他课程使用
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse && existingCourse.id !== id) {
      return NextResponse.json(
        { error: 'Conflict - Course code already exists' },
        { status: 409 }
      );
    }

    // 获取原教师列表
    const oldTeachers = await prisma.user.findMany({
      where: {
        id: {
          in: course.users.map(t => t.id)
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    const oldTeacherNames = oldTeachers.map(t => t.name).join(', ');

    // 获取新教师列表
    const newTeachers = teacherIds && teacherIds.length > 0
      ? await prisma.user.findMany({
        where: {
          id: {
            in: teacherIds
          }
        },
        select: {
          id: true,
          name: true
        }
      })
      : [];
    const newTeacherNames = newTeachers.map(t => t.name).join(', ');

    // 更新课程
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        code,
        name,
        description,
        credit: Number(credit),
        semester,
        users: {
          // 重置关联并连接新的教师
          set: [],
          connect: teacherIds && teacherIds.length > 0 ?
            teacherIds.map((id: string) => ({ id })) : []
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // 构建详细的修改记录
    const changes = [];
    if (course.code !== code) {
      changes.push(`课程代码: ${course.code} → ${code}`);
    }
    if (course.name !== name) {
      changes.push(`课程名称: ${course.name} → ${name}`);
    }
    if (course.description !== description) {
      changes.push(`课程描述已更新`);
    }
    if (course.credit !== Number(credit)) {
      changes.push(`学分: ${course.credit} → ${credit}`);
    }
    if (course.semester !== semester) {
      changes.push(`学期: ${course.semester} → ${semester}`);
    }
    if (oldTeacherNames !== newTeacherNames) {
      changes.push(`授课教师: ${oldTeacherNames || '无'} → ${newTeacherNames || '无'}`);
    }

    // 记录详细日志
    if (changes.length > 0) {
      const changeDetails = `修改了课程 ${course.name}(${course.code}):\n${changes.join('\n')}`;
      await logApiSuccess(
        request,
        '更新课程',
        changeDetails
      );
    }

    return NextResponse.json(
      { message: 'Course updated successfully', course: updatedCourse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating course:', error);

    // 记录错误日志
    const currentUser = getCurrentUser(request);
    if (currentUser) {
      await logApiError(
        request,
        '更新课程',
        error
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 删除课程
export async function DELETE(request: NextRequest) {
  try {
    // 获取课程ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bad Request - Missing course ID' },
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

    // 查找课程
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Not Found - Course not found' },
        { status: 404 }
      );
    }

    // 删除课程
    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检请求）
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });

  // 设置CORS头部
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 预检请求缓存24小时

  return response;
} 