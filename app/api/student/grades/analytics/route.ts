import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { LogAction, logAction } from '../../../../utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 从请求中获取用户会话信息
    const userId = req.headers.get('x-user-id') || '';
    const userRole = req.headers.get('x-user-role') || '';

    // 如果没有用户信息，尝试从cookie中获取
    if (!userId || !userRole) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 确保当前用户是学生
    if (userRole !== 'STUDENT') {
      return NextResponse.json(
        { error: '只有学生可以访问此资源' },
        { status: 403 }
      );
    }

    // 记录日志 - 使用新的logAction接口
    await logAction(LogAction.GRADE_ANALYSIS, '学生查看成绩分析数据', userId);

    // 从数据库获取真实数据，注意使用映射后的表名
    const grades = await prisma.$queryRaw`
      SELECT 
        g.id,
        c.id AS courseId,
        c.name AS courseName,
        g.score,
        g.createdAt AS date,
        c.semester AS semester,
        g.status
      FROM grades g
      JOIN courses c ON g.courseId = c.id
      WHERE g.studentId = ${userId}
      ORDER BY g.createdAt ASC
    `;

    return NextResponse.json({ grades });
  } catch (error) {
    console.error('获取成绩分析数据失败:', error);
    return NextResponse.json(
      { error: '获取成绩数据时发生错误' },
      { status: 500 }
    );
  }
} 