import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAction, logApiError, logApiSuccess } from '@/utils/logger';

/**
 * 获取当前用户信息函数
 */
function getCurrentUser(request: NextRequest) {
    const userSession = request.cookies.get('user_session')?.value;
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

// 创建测试数据 - 仅用于开发环境
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证用户是否登录且是管理员
        const currentUser = getCurrentUser(request);
        if (!currentUser || currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '未授权 - 只有管理员可以添加测试数据' },
                { status: 401 }
            );
        }

        const courseId = params.id;

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

        // 获取所有学生用户
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            take: 5 // 最多获取5名学生
        });

        if (students.length === 0) {
            return NextResponse.json(
                { error: '系统中没有学生用户', course },
                { status: 400 }
            );
        }

        // 清除现有选课记录
        await prisma.enrollment.deleteMany({
            where: { courseId }
        });

        // 创建测试选课记录
        const testScores = [95, 88, 72, 65, 59];
        const statuses = ['enrolled', 'completed', 'enrolled', 'enrolled', 'dropped'];

        const enrollments = await Promise.all(students.map(async (student, index) => {
            return prisma.enrollment.create({
                data: {
                    courseId,
                    userId: student.id,
                    score: testScores[index % testScores.length],
                    status: statuses[index % statuses.length] as any
                }
            });
        }));

        // 记录操作
        await logApiSuccess(
            request,
            '添加测试选课数据',
            `课程: ${course.name} (${course.code}), 添加学生数: ${enrollments.length}`,
            currentUser.id
        );

        return NextResponse.json({
            message: '测试数据创建成功',
            enrollments,
            course
        });
    } catch (error) {
        console.error('添加测试数据失败:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 