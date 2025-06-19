import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { logApiSuccess, logApiError } from '@/utils/logger';

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

// 获取课程进度
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    // 验证课程ID
    if (!courseId) {
      return NextResponse.json(
        { error: '缺少课程ID' },
        { status: 400 }
      );
    }

    // 查询课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { progress: true }
    });

    // 检查课程是否存在
    if (!course) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    // 记录成功日志
    logApiSuccess(
      '获取课程进度',
      `成功获取课程ID:${courseId}的进度: ${course.progress || 0}%`
    );

    // 返回课程进度
    return NextResponse.json({ progress: course.progress || 0 }, { status: 200 });
  } catch (error) {
    console.error('获取课程进度时出错:', error);
    
    // 记录错误日志
    logApiError(
      '获取课程进度',
      `获取课程进度失败: ${(error as Error).message}`
    );
    
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新课程进度
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查用户是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 检查是否有权限（教师或管理员）
    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '禁止 - 需要教师或管理员权限' },
        { status: 403 }
      );
    }

    const courseId = params.id;
    const body = await request.json();
    const { progress } = body;

    // 验证参数
    if (!courseId) {
      return NextResponse.json(
        { error: '缺少课程ID' },
        { status: 400 }
      );
    }

    if (progress === undefined || typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: '进度必须是0到100之间的数字' },
        { status: 400 }
      );
    }

    // 检查课程是否存在
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    // 如果是教师，需要检查是否是该课程的教师
    if (currentUser.role === 'TEACHER') {
      const isTeacher = await prisma.course.findFirst({
        where: {
          id: courseId,
          users: { some: { id: currentUser.id } }
        }
      });

      if (!isTeacher) {
        return NextResponse.json(
          { error: '禁止 - 您不是此课程的教师' },
          { status: 403 }
        );
      }
    }

    // 更新课程进度
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { progress }
    });

    // 记录成功日志
    logApiSuccess(
      '更新课程进度',
      `用户ID:${currentUser.id} 将课程ID:${courseId}的进度更新为 ${progress}%`
    );

    // 返回更新后的课程进度
    return NextResponse.json(
      { message: '课程进度更新成功', progress: updatedCourse.progress },
      { status: 200 }
    );
  } catch (error) {
    console.error('更新课程进度时出错:', error);
    
    // 记录错误日志
    logApiError(
      '更新课程进度',
      `更新课程进度失败: ${(error as Error).message}`
    );
    
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 