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

// 获取申诉列表
export async function GET(request: NextRequest) {
  try {
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

    let appeals;

    // 根据用户角色获取不同范围的申诉
    if (currentUser.role === 'ADMIN') {
      console.log('管理员查询所有申诉');
      // 管理员可以查看所有申诉
      appeals = await prisma.appeal.findMany({
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (currentUser.role === 'TEACHER') {
      // 教师只能查看与自己相关的申诉
      appeals = await prisma.appeal.findMany({
        where: {
          grade: {
            teacherId: currentUser.id
          }
        },
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // 学生只能查看自己的申诉
      appeals = await prisma.appeal.findMany({
        where: {
          studentId: currentUser.id
        },
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({ appeals }, { status: 200 });
  } catch (error) {
    console.error('获取申诉列表失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建申诉
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理创建申诉请求');
    const currentUser = getCurrentUser(request);
    console.log('当前用户:', currentUser);

    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 只有学生可以创建申诉
    if (currentUser.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '只有学生可以提交成绩申诉' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('提交申诉数据:', body);
    const { gradeId, type, reason, expectedScore, evidence } = body;

    // 验证必填字段
    if (!gradeId || !type || !reason) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    try {
      // 检查成绩是否存在
      console.log('检查成绩是否存在, gradeId:', gradeId);
      const grade = await prisma.grade.findUnique({
        where: { id: gradeId }
      });

      console.log('查询到的成绩:', grade);

      if (!grade) {
        return NextResponse.json(
          { error: '成绩不存在' },
          { status: 404 }
        );
      }

      // 检查成绩是否属于当前学生
      if (grade.studentId !== currentUser.id) {
        return NextResponse.json(
          { error: '您无权对此成绩提出申诉' },
          { status: 403 }
        );
      }

      // 检查是否已经存在未处理的申诉
      console.log('检查是否存在未处理申诉');
      const existingAppeal = await prisma.appeal.findFirst({
        where: {
          gradeId,
          studentId: currentUser.id,
          status: {
            in: ['PENDING', 'REVIEWING']
          }
        }
      });

      console.log('已存在的申诉:', existingAppeal);

      if (existingAppeal) {
        return NextResponse.json(
          { error: '您已经对该成绩提交了申诉，请等待处理结果' },
          { status: 400 }
        );
      }

      // 创建申诉
      console.log('开始创建申诉记录');
      const appealData = {
        gradeId,
        studentId: currentUser.id,
        type,
        reason,
        expectedScore,
        evidence,
        status: 'PENDING',
      };
      
      console.log('申诉数据:', appealData);
      
      const appeal = await prisma.appeal.create({
        data: appealData
      });

      console.log('申诉创建成功:', appeal);

      // 记录系统日志
      await prisma.systemLog.create({
        data: {
          userId: currentUser.id,
          action: '创建成绩申诉',
          details: `学生 ${currentUser.name} 对成绩ID: ${gradeId} 提交申诉`,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      });

      return NextResponse.json({ appeal }, { status: 201 });
    } catch (prismaError) {
      console.error('Prisma操作错误:', prismaError);
      throw prismaError; // 重新抛出以便被外层catch捕获
    }
  } catch (error: any) {
    console.error('创建申诉失败:', error);
    console.error('错误详情:', error.stack);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 