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

// 获取成绩列表
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    let grades;

    // 根据用户角色获取不同范围的成绩
    if (currentUser.role === 'ADMIN') {
      // 管理员可以查看所有成绩
      grades = await prisma.grade.findMany({
        include: {
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } else if (currentUser.role === 'TEACHER') {
      // 教师只能查看自己添加的成绩
      grades = await prisma.grade.findMany({
        where: {
          teacherId: currentUser.id
        },
        include: {
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } else {
      // 学生只能查看自己的成绩
      grades = await prisma.grade.findMany({
        where: {
          studentId: currentUser.id
        },
        include: {
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
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    return NextResponse.json({ grades }, { status: 200 });
  } catch (error) {
    console.error('获取成绩列表失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 添加成绩
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    if (currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '只有教师可以添加成绩' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, courseId, score } = body;

    // 验证必填字段
    if (!studentId || !courseId || score === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证分数范围
    if (score < 0 || score > 100) {
      return NextResponse.json(
        { error: '分数必须在0-100之间' },
        { status: 400 }
      );
    }

    // 检查学生是否存在
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: '学生不存在' },
        { status: 404 }
      );
    }

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    // 创建成绩
    const grade = await prisma.grade.create({
      data: {
        studentId,
        courseId,
        teacherId: currentUser.id,
        score,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // 记录添加成绩操作
    try {
      // 获取客户端IP
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

      // 记录操作日志
      await prisma.systemLog.create({
        data: {
          userId: currentUser.id,
          action: '添加成绩',
          details: `为学生 ${student.name} 添加课程 ${course.name}(${course.code}) 的成绩: ${score}分`,
          ipAddress
        }
      });
    } catch (logError) {
      console.error('记录添加成绩日志失败:', logError);
    }

    return NextResponse.json(
      { message: '成绩添加成功', grade },
      { status: 201 }
    );
  } catch (error) {
    console.error('添加成绩失败:', error);
    return NextResponse.json(
      { error: '添加成绩失败' },
      { status: 500 }
    );
  }
}

// 更新成绩
export async function PUT(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 只允许教师和管理员更新成绩
    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '禁止 - 只有教师和管理员可以更新成绩' },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { id, score, status } = body;

    // 验证必填字段
    if (!id) {
      return NextResponse.json(
        { error: '请求无效 - 缺少成绩ID' },
        { status: 400 }
      );
    }

    // 至少需要有一个要更新的字段
    if ((score === undefined || score === null) && !status) {
      return NextResponse.json(
        { error: '请求无效 - 至少需要提供一个要更新的字段' },
        { status: 400 }
      );
    }

    // 如果提供了成绩，验证范围
    if (score !== undefined && score !== null) {
      if (score < 0 || score > 100) {
        return NextResponse.json(
          { error: '请求无效 - 成绩必须在0-100之间' },
          { status: 400 }
        );
      }
    }

    // 验证状态值
    if (status && !['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: '请求无效 - 状态值无效' },
        { status: 400 }
      );
    }

    // 查找成绩记录
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingGrade) {
      return NextResponse.json(
        { error: '未找到 - 成绩记录不存在' },
        { status: 404 }
      );
    }

    // 权限检查：教师只能更新自己添加的成绩
    if (currentUser.role === 'TEACHER' && existingGrade.teacherId !== currentUser.id) {
      return NextResponse.json(
        { error: '禁止 - 您只能更新自己添加的成绩' },
        { status: 403 }
      );
    }

    // 更新成绩记录
    const updateData: any = {};
    if (score !== undefined && score !== null) {
      updateData.score = score;
    }
    if (status) {
      updateData.status = status;
    }

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: updateData,
      include: {
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

    return NextResponse.json(
      { message: '成绩更新成功', grade: updatedGrade },
      { status: 200 }
    );
  } catch (error) {
    console.error('更新成绩失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除成绩
export async function DELETE(request: NextRequest) {
  try {
    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 只允许管理员和教师删除成绩
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: '禁止 - 只有管理员和教师可以删除成绩' },
        { status: 403 }
      );
    }

    // 获取要删除的成绩ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '请求无效 - 缺少成绩ID' },
        { status: 400 }
      );
    }

    // 查找成绩记录
    const existingGrade = await prisma.grade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      return NextResponse.json(
        { error: '未找到 - 成绩记录不存在' },
        { status: 404 }
      );
    }

    // 权限检查：教师只能删除自己添加的成绩
    if (currentUser.role === 'TEACHER' && existingGrade.teacherId !== currentUser.id) {
      return NextResponse.json(
        { error: '禁止 - 您只能删除自己添加的成绩' },
        { status: 403 }
      );
    }

    // 删除成绩记录
    await prisma.grade.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: '成绩删除成功' },
      { status: 200 }
    );
  } catch (error) {
    console.error('删除成绩失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 