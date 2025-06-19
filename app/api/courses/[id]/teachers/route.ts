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

// 获取课程教师列表
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证用户是否登录
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        const courseId = params.id;

        // 查询课程及其教师
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                users: {
                    where: {
                        role: 'TEACHER'
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!course) {
            return NextResponse.json(
                { error: '课程不存在' },
                { status: 404 }
            );
        }

        // 记录成功操作
        await logApiSuccess(request, '获取课程教师列表', `课程ID: ${courseId}`, currentUser.id);

        return NextResponse.json({ teachers: course.users });
    } catch (error) {
        console.error('获取课程教师列表失败:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 更新课程教师
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证用户是否登录
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只有管理员可以修改课程教师
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '禁止访问 - 只有管理员可以修改课程教师' },
                { status: 403 }
            );
        }

        const courseId = params.id;
        const { teacherIds } = await request.json();

        if (!Array.isArray(teacherIds)) {
            return NextResponse.json(
                { error: '提供的教师ID列表无效' },
                { status: 400 }
            );
        }

        // 更新课程的教师列表
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                users: {
                    set: teacherIds.map((id: string) => ({ id }))
                }
            },
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
        });

        // 记录成功操作
        await logApiSuccess(
            request,
            '更新课程教师',
            `课程: ${updatedCourse.name} (${updatedCourse.code}), 教师数量: ${teacherIds.length}`,
            currentUser.id
        );

        return NextResponse.json({
            message: '课程教师更新成功',
            teachers: updatedCourse.users
        });
    } catch (error) {
        console.error('更新课程教师失败:', error);
        await logApiError(request, '更新课程教师', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 