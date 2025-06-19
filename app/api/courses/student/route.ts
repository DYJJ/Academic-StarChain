import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { LogAction, logAction } from '../../../utils/logger';

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
  const cookieStore = cookies();
  const userSession = cookieStore.get('user_session')?.value;

  if (!userSession) {
    console.log('未找到用户会话');
    return null;
  }

  try {
    const user = JSON.parse(userSession);
    console.log('当前用户:', user);
    return user;
  } catch (error) {
    console.error('解析用户会话失败:', error);
    return null;
  }
}

// 获取学生选修的课程列表
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/courses/student 被调用');

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      console.log('用户未登录');
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 检查是否是学生
    if (currentUser.role !== 'STUDENT') {
      console.log('用户角色不是学生:', currentUser.role);
      return NextResponse.json(
        { error: '禁止访问 - 仅限学生使用' },
        { status: 403 }
      );
    }

    // 记录日志 - 更新为新的logAction接口
    await logAction(LogAction.VIEW_COURSE, '学生查询选修课程列表', currentUser.id);

    // 查询该学生的所有成绩记录
    const studentGrades = await prisma.grade.findMany({
      where: {
        studentId: currentUser.id
      },
      include: {
        course: {
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
        }
      }
    });

    // 提取课程信息并去重
    const courseMap = new Map();
    studentGrades.forEach(grade => {
      if (!courseMap.has(grade.course.id)) {
        const courseData = {
          ...grade.course,
          progress: grade.course.progress || 0, // 确保返回进度数据
          teachers: grade.course.users.filter(user => user.role === 'TEACHER')
        };
        courseMap.set(grade.course.id, courseData);
      }
    });

    // 获取课程列表
    const courses = Array.from(courseMap.values());

    console.log(`查询到 ${courses.length} 门学生选修课程`);

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error('获取学生课程失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 