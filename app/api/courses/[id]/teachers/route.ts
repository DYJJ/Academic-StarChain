import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../../lib/prisma';
import { logApiAction, logApiError, logApiSuccess } from '../../../../../lib/logMiddleware';

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

// 获取课程的教师列表
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;
        console.log(`GET /api/courses/${courseId}/teachers 被调用`);

        // 获取当前用户
        const currentUser = getCurrentUser(request);

        // 检查是否登录
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 检查课程是否存在
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teachers: {
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
                { error: '未找到 - 课程不存在' },
                { status: 404 }
            );
        }

        // 记录查询日志
        await logApiAction(
            request,
            '查询课程教师',
            `查询课程"${course.name}"(${course.code})的教师列表`
        );

        return NextResponse.json({
            teachers: course.teachers
        }, { status: 200 });
    } catch (error) {
        console.error('获取课程教师错误:', error);
        await logApiError(request, '查询课程教师', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 更新课程的教师列表
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;
        console.log(`PUT /api/courses/${courseId}/teachers 被调用`);

        // 获取当前用户
        const currentUser = getCurrentUser(request);

        // 检查是否登录
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 检查是否是管理员
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '禁止访问 - 需要管理员权限' },
                { status: 403 }
            );
        }

        // 检查课程是否存在
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return NextResponse.json(
                { error: '未找到 - 课程不存在' },
                { status: 404 }
            );
        }

        // 解析请求体
        const body = await request.json();
        const { teacherIds } = body;

        if (!teacherIds || !Array.isArray(teacherIds)) {
            return NextResponse.json(
                { error: '请求错误 - 无效的教师IDs' },
                { status: 400 }
            );
        }

        // 获取教师名单用于日志记录
        const teachers = await prisma.user.findMany({
            where: {
                id: { in: teacherIds },
                role: 'TEACHER'
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        const teacherNames = teachers.map(t => t.name).join(', ');

        // 更新课程教师关联
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                teachers: {
                    set: [], // 先清除现有关联
                    connect: teacherIds.map(id => ({ id })) // 添加新关联
                }
            },
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        // 记录成功操作日志
        await logApiSuccess(
            request,
            '分配课程教师',
            `为课程"${course.name}"(${course.code})分配教师: ${teacherNames || '无'}`
        );

        return NextResponse.json({
            message: '课程教师更新成功',
            teachers: updatedCourse.teachers
        }, { status: 200 });
    } catch (error) {
        console.error('更新课程教师错误:', error);
        await logApiError(request, '分配课程教师', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 