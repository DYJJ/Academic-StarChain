import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

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

// 获取特定的申诉
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取申诉ID
    const { id } = params;
    console.log('获取申诉ID:', id);

    // 获取当前用户
    const currentUser = getCurrentUser(request);
    console.log('当前用户:', currentUser);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 查询申诉
    console.log('查询申诉:', id);
    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        grade: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            teacher: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // 检查是否找到申诉
    if (!appeal) {
      return NextResponse.json(
        { error: '申诉不存在' },
        { status: 404 }
      );
    }

    // 检查用户是否有权限查看申诉
    if (
      currentUser.role !== 'ADMIN' &&
      currentUser.id !== appeal.studentId &&
      currentUser.id !== appeal.grade.teacherId
    ) {
      return NextResponse.json(
        { error: '您无权查看此申诉' },
        { status: 403 }
      );
    }

    return NextResponse.json({ appeal }, { status: 200 });
  } catch (error) {
    console.error('获取申诉详情失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新申诉
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取申诉ID
    const { id } = params;

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 查询申诉
    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        grade: true
      }
    });

    // 检查是否找到申诉
    if (!appeal) {
      return NextResponse.json(
        { error: '申诉不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // 基于角色的权限控制和更新逻辑
    if (currentUser.role === 'ADMIN') {
      // 管理员可以更新任何字段
      const { status, teacherComment, meetingTime } = body;
      
      const updatedAppeal = await prisma.appeal.update({
        where: { id },
        data: {
          status: status,
          teacherComment: teacherComment,
          meetingTime: meetingTime ? new Date(meetingTime) : undefined
        }
      });

      // 记录系统日志
      await prisma.systemLog.create({
        data: {
          userId: currentUser.id,
          action: '更新申诉',
          details: `管理员 ${currentUser.name} 更新了申诉ID: ${id} 的状态为: ${status}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      });

      return NextResponse.json({ appeal: updatedAppeal }, { status: 200 });
    } 
    else if (currentUser.role === 'TEACHER' && currentUser.id === appeal.grade.teacherId) {
      // 教师只能更新其教授课程相关的申诉状态和教师评论
      const { status, teacherComment, meetingTime } = body;
      
      const updatedAppeal = await prisma.appeal.update({
        where: { id },
        data: {
          status: status,
          teacherComment: teacherComment,
          meetingTime: meetingTime ? new Date(meetingTime) : undefined
        }
      });

      // 记录系统日志
      await prisma.systemLog.create({
        data: {
          userId: currentUser.id,
          action: '更新申诉',
          details: `教师 ${currentUser.name} 更新了申诉ID: ${id} 的状态为: ${status}`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      });

      return NextResponse.json({ appeal: updatedAppeal }, { status: 200 });
    } 
    else if (currentUser.role === 'STUDENT' && currentUser.id === appeal.studentId) {
      // 学生只能在申诉状态为待处理时更新自己的申诉内容
      if (appeal.status !== 'PENDING') {
        return NextResponse.json(
          { error: '已提交的申诉不能修改' },
          { status: 400 }
        );
      }

      const { reason, type, expectedScore, evidence } = body;
      
      const updatedAppeal = await prisma.appeal.update({
        where: { id },
        data: {
          reason,
          type,
          expectedScore,
          evidence
        }
      });

      // 记录系统日志
      await prisma.systemLog.create({
        data: {
          userId: currentUser.id,
          action: '更新申诉',
          details: `学生 ${currentUser.name} 更新了申诉ID: ${id} 的内容`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      });

      return NextResponse.json({ appeal: updatedAppeal }, { status: 200 });
    } 
    else {
      return NextResponse.json(
        { error: '您无权更新此申诉' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('更新申诉失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除申诉
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取申诉ID
    const { id } = params;

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 查询申诉
    const appeal = await prisma.appeal.findUnique({
      where: { id }
    });

    // 检查是否找到申诉
    if (!appeal) {
      return NextResponse.json(
        { error: '申诉不存在' },
        { status: 404 }
      );
    }

    // 检查用户是否有权限删除申诉（只有管理员或申诉状态为PENDING的学生本人）
    if (
      currentUser.role !== 'ADMIN' &&
      !(currentUser.role === 'STUDENT' && 
        currentUser.id === appeal.studentId && 
        appeal.status === 'PENDING')
    ) {
      return NextResponse.json(
        { error: '您无权删除此申诉' },
        { status: 403 }
      );
    }

    // 删除申诉
    await prisma.appeal.delete({
      where: { id }
    });

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        userId: currentUser.id,
        action: '删除申诉',
        details: `用户 ${currentUser.name} 删除了申诉ID: ${id}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('删除申诉失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 