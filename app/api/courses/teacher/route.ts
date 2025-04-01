import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';

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

// 获取教师的课程列表
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/courses/teacher 被调用');
    
    // 获取当前用户
    const currentUser = getCurrentUser(request);
    
    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }
    
    // 检查是否是教师
    if (currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '禁止访问 - 仅限教师使用' },
        { status: 403 }
      );
    }

    // 通过Grade表查询教师任教的课程
    try {
      // 获取该教师教授的所有课程ID（去重）
      const teacherGrades = await prisma.grade.findMany({
        where: { teacherId: currentUser.id },
        select: { courseId: true },
        distinct: ['courseId']
      });

      const courseIds = teacherGrades.map(grade => grade.courseId);
      
      // 如果没有教授任何课程
      if (courseIds.length === 0) {
        return NextResponse.json({ courses: [] }, { status: 200 });
      }
      
      // 获取课程详情
      const courses = await prisma.course.findMany({
        where: {
          id: { in: courseIds }
        },
        orderBy: {
          code: 'asc'
        }
      });
      
      console.log(`查询到 ${courses.length} 门教师课程`);
      
      return NextResponse.json({ courses }, { status: 200 });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库查询错误' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取教师课程失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 