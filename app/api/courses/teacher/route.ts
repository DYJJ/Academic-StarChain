import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { LogAction, logAction, logApiError } from '../../../utils/logger';

// 从cookie获取当前用户信息
function getCurrentUser(request: NextRequest) {
  const cookieStore = cookies();
  const userSessionStr = cookieStore.get('user_session')?.value;

  if (!userSessionStr) {
    return null;
  }

  try {
    return JSON.parse(userSessionStr);
  } catch (error) {
    console.error('解析用户会话错误:', error);
    return null;
  }
}

// 获取教师的课程列表
export async function GET(request: NextRequest) {
  const currentUser = getCurrentUser(request);
  
  try {
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('GET /api/courses/teacher 被调用');
    console.log('当前用户:', {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    });

    // 记录访问日志 - 更新为新的logAction接口
    await logAction(LogAction.VIEW_COURSE, '查询教师课程列表', currentUser.id);

    console.log('查询教师课程, 教师ID:', currentUser.id);

    // 使用Prisma查询该教师教授的课程
    const courses = await prisma.course.findMany({
      where: {
        users: { some: { id: currentUser.id } }
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        grades: {
          select: {
            id: true
          }
        }
      }
    });

    // 添加学生数量信息
    const coursesWithStudentCount = courses.map(course => {
      return {
        ...course,
        studentCount: course.grades.length,
        progress: course.progress || 0, // 确保返回进度数据
        grades: undefined // 不需要返回整个成绩列表
      };
    });

    return NextResponse.json({ courses: coursesWithStudentCount });
  } catch (error) {
    console.error('数据库查询错误:', error);
    // 更新为新的logApiError接口
    await logApiError('查询教师课程失败', error, currentUser?.id);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 