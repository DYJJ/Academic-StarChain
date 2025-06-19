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

// 获取已选修课程的学生列表
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let currentUser = null;
    try {
        // 验证用户是否登录
        currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        const courseId = params.id;

        // 查询所有选修了该课程的学生
        const enrollments = await prisma.enrollment.findMany({
            where: { 
                courseId: courseId 
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 构建返回的学生数据
        const students = enrollments.map(enrollment => ({
            id: enrollment.user.id,
            name: enrollment.user.name,
            email: enrollment.user.email,
            avatarUrl: enrollment.user.avatarUrl,
            status: enrollment.status,
            score: enrollment.score,
            enrolledAt: enrollment.createdAt
        }));

        // 记录成功操作
        await logApiSuccess(
            request,
            '获取选课学生',
            `课程ID: ${courseId}`,
            currentUser.id
        );

        return NextResponse.json({ 
            students,
            totalCount: students.length
        });
    } catch (error) {
        console.error('获取选课学生失败:', error);
        await logApiError(request, '获取选课学生', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 学生选修课程
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let currentUser = null;
    try {
        // 验证用户是否登录
        currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只有学生可以选课
        if (currentUser.role !== 'STUDENT') {
            return NextResponse.json(
                { error: '禁止操作 - 只有学生可以选修课程' },
                { status: 403 }
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

        // 检查学生是否已选修该课程
        const existingEnrollment = await prisma.enrollment.findFirst({
            where: {
                courseId: courseId,
                userId: currentUser.id
            }
        });

        if (existingEnrollment) {
            return NextResponse.json(
                { error: '您已经选修了该课程', enrollment: existingEnrollment },
                { status: 400 }
            );
        }

        // 创建选课记录
        const enrollment = await prisma.enrollment.create({
            data: {
                courseId: courseId,
                userId: currentUser.id,
                status: 'enrolled'
            }
        });

        // 记录成功操作
        await logApiSuccess(
            request,
            '学生选课',
            `课程: ${course.name} (${course.code})`,
            currentUser.id
        );

        return NextResponse.json({
            message: '选课成功',
            enrollment
        });
    } catch (error) {
        console.error('选课失败:', error);
        await logApiError(request, '学生选课', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 取消选修课程
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let currentUser = null;
    try {
        // 验证用户是否登录
        currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        const courseId = params.id;

        // 查找选课记录
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                courseId: courseId,
                userId: currentUser.id
            },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            }
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: '您未选修该课程' },
                { status: 404 }
            );
        }

        // 管理员可以直接删除任何选课记录
        // 学生只能取消自己的选课
        if (currentUser.role !== 'ADMIN' && currentUser.id !== enrollment.userId) {
            return NextResponse.json(
                { error: '禁止操作 - 您无权取消此选课' },
                { status: 403 }
            );
        }

        // 删除选课记录
        await prisma.enrollment.delete({
            where: {
                id: enrollment.id
            }
        });

        // 记录成功操作
        await logApiSuccess(
            request,
            '学生退课',
            `课程: ${enrollment.course.name} (${enrollment.course.code})`,
            currentUser.id
        );

        return NextResponse.json({
            message: '退课成功'
        });
    } catch (error) {
        console.error('退课失败:', error);
        await logApiError(request, '学生退课', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 