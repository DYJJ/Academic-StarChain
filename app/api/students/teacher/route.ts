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

// 获取教师的学生列表
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/students/teacher 被调用');
    
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

    // 通过Grade表查询教师教授的学生
    try {
      // 获取URL参数
      const url = new URL(request.url);
      const courseId = url.searchParams.get('courseId');
      
      // 基础查询条件
      const whereCondition: any = { teacherId: currentUser.id };
      
      // 如果指定了课程ID，则添加到查询条件
      if (courseId) {
        whereCondition.courseId = courseId;
      }
      
      // 查询教师教授的所有学生成绩记录
      const grades = await prisma.grade.findMany({
        where: whereCondition,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              role: true,
              createdAt: true
            }
          },
          course: true
        },
        orderBy: {
          student: {
            name: 'asc'
          }
        }
      });
      
      // 按学生分组，提取每个学生的信息和所选课程
      const studentMap = new Map();
      
      grades.forEach(grade => {
        const studentId = grade.studentId;
        
        if (!studentMap.has(studentId)) {
          // 如果是新学生，添加基本信息
          studentMap.set(studentId, {
            id: studentId,
            name: grade.student.name,
            email: grade.student.email,
            avatarUrl: grade.student.avatarUrl,
            createdAt: grade.student.createdAt,
            courses: [],
            grades: []
          });
        }
        
        // 将课程信息添加到学生记录中
        const studentRecord = studentMap.get(studentId);
        studentRecord.courses.push({
          id: grade.course.id,
          code: grade.course.code,
          name: grade.course.name,
          credit: grade.course.credit,
          semester: grade.course.semester
        });
        
        // 将成绩信息添加到学生记录中
        studentRecord.grades.push({
          id: grade.id,
          score: grade.score,
          status: grade.status,
          courseId: grade.courseId,
          courseName: grade.course.name,
          updatedAt: grade.updatedAt
        });
      });
      
      // 将Map转换为数组
      const students = Array.from(studentMap.values());
      
      console.log(`查询到 ${students.length} 名学生`);
      
      // 查询所有课程作为筛选选项
      const teacherCourses = await prisma.grade.findMany({
        where: { teacherId: currentUser.id },
        select: { courseId: true },
        distinct: ['courseId']
      });
      
      const courseIds = teacherCourses.map(grade => grade.courseId);
      
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        orderBy: { name: 'asc' }
      });
      
      return NextResponse.json({ 
        students,
        courses,
        totalStudents: students.length
      }, { status: 200 });
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      return NextResponse.json(
        { error: '数据库查询错误' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取教师学生失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新学生成绩
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/students/teacher 被调用');
    
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

    // 解析请求体
    const body = await request.json();
    const { gradeId, score, status } = body;
    
    // 验证必填字段
    if (!gradeId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    // 验证教师是否有权限更新这个成绩
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId }
    });
    
    if (!grade) {
      return NextResponse.json(
        { error: '成绩记录不存在' },
        { status: 404 }
      );
    }
    
    if (grade.teacherId !== currentUser.id) {
      return NextResponse.json(
        { error: '无权修改其他教师的成绩' },
        { status: 403 }
      );
    }
    
    // 更新成绩
    const updateData: any = {};
    if (score !== undefined) updateData.score = score;
    if (status !== undefined) updateData.status = status;
    
    const updatedGrade = await prisma.grade.update({
      where: { id: gradeId },
      data: updateData
    });
    
    return NextResponse.json({ 
      message: '成绩更新成功',
      grade: updatedGrade
    }, { status: 200 });
  } catch (error) {
    console.error('更新成绩失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 