import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

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

// 获取单个成绩详情
export async function GET(
  request: NextRequest,
  { params }: { params: { gradeId: string } }
) {
  try {
    // 获取成绩ID
    const { gradeId } = params;
    
    if (!gradeId) {
      return NextResponse.json(
        { error: '缺少成绩ID' },
        { status: 400 }
      );
    }

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 查询成绩记录
    const grade = await prisma.grade.findUnique({
      where: {
        id: gradeId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credit: true,
            semester: true
          }
        }
      }
    });

    // 检查成绩是否存在
    if (!grade) {
      return NextResponse.json(
        { error: '成绩不存在' },
        { status: 404 }
      );
    }

    // 检查权限
    // 只有管理员、成绩对应的学生和添加该成绩的老师可以查看成绩
    if (currentUser.role !== 'ADMIN' && 
        currentUser.id !== grade.studentId && 
        currentUser.id !== grade.teacherId) {
      return NextResponse.json(
        { error: '您没有权限查看该成绩' },
        { status: 403 }
      );
    }

    return NextResponse.json({ grade }, { status: 200 });
  } catch (error) {
    console.error('获取成绩详情失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新单个成绩（可选，如果需要PUT方法）
export async function PUT(
  request: NextRequest,
  { params }: { params: { gradeId: string } }
) {
  try {
    const { gradeId } = params;
    const currentUser = getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '只有教师和管理员可以修改成绩' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { score, comments } = body;

    // 检查成绩是否存在
    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId }
    });

    if (!existingGrade) {
      return NextResponse.json(
        { error: '成绩不存在' },
        { status: 404 }
      );
    }

    // 检查权限：教师只能修改自己添加的成绩
    if (currentUser.role === 'TEACHER' && existingGrade.teacherId !== currentUser.id) {
      return NextResponse.json(
        { error: '您只能修改自己添加的成绩' },
        { status: 403 }
      );
    }

    // 更新成绩信息
    const updatedGrade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        score: score !== undefined ? score : existingGrade.score,
        comments: comments !== undefined ? comments : existingGrade.comments,
        updatedAt: new Date()
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ grade: updatedGrade }, { status: 200 });
  } catch (error) {
    console.error('更新成绩失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 