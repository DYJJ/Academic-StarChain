import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logAction } from '@/utils/logger';

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

// 获取单个课程信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否登录
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const courseId = params.id;

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    // 获取选课学生数量
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId },
    });

    // 处理返回数据，将users映射为teachers
    const courseData = {
      ...course,
      studentCount: enrollmentCount,
      teachers: course.users.filter(user => user.role === 'TEACHER')
    };

    // 记录日志
    await logAction('VIEW_COURSE', `查看课程详情: ${course.name} (${course.code})`, currentUser.id);

    return NextResponse.json({ course: courseData });
  } catch (error) {
    console.error('获取课程失败:', error);
    return NextResponse.json({ error: '获取课程失败' }, { status: 500 });
  }
}

// 更新课程信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);
    
    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 检查用户权限
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '禁止访问 - 需要管理员或教师权限' },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const body = await request.json();

    // 如果是教师，检查是否是该课程的教师
    if (currentUser.role === 'TEACHER') {
      const isTeacher = await prisma.course.findFirst({
        where: {
          id: courseId,
          users: { some: { id: currentUser.id } }
        }
      });
      
      if (!isTeacher) {
        return NextResponse.json(
          { error: '您没有权限编辑此课程' },
          { status: 403 }
        );
      }
    }

    // 验证输入
    const { name, description, credit, semester, progress } = body;
    if (!name) {
      return NextResponse.json(
        { error: '课程名称不能为空' },
        { status: 400 }
      );
    }

    // 验证进度值
    if (progress !== undefined && (isNaN(progress) || progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: '课程进度必须是0到100之间的数字' },
        { status: 400 }
      );
    }

    // 更新课程信息
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        name,
        description,
        credit: parseFloat(credit),
        semester,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        updatedAt: new Date(),
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

    // 记录操作日志
    await logAction('UPDATE_COURSE', `更新课程: ${updatedCourse.name} (${updatedCourse.code})`, currentUser.id);

    return NextResponse.json({ 
      course: {
        ...updatedCourse,
        teachers: updatedCourse.users.filter(user => user.role === 'TEACHER')
      } 
    });
  } catch (error) {
    console.error('更新课程失败:', error);
    return NextResponse.json({ error: '更新课程失败' }, { status: 500 });
  }
} 