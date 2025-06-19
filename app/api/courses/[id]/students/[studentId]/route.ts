import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logApiError, logApiSuccess } from '@/utils/logger';

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

// 从课程中删除学生
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string, studentId: string } }
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

        // 只有管理员和教师可以删除学生
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
            return NextResponse.json(
                { error: '禁止操作 - 只有管理员和教师可以删除学生' },
                { status: 403 }
            );
        }

        const courseId = params.id;
        const studentId = params.studentId;

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

        // 如果是教师，检查是否是该课程的教师
        if (currentUser.role === 'TEACHER') {
            const isCourseTeacher = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    users: {
                        some: {
                            id: currentUser.id,
                            role: 'TEACHER'
                        }
                    }
                }
            });

            if (!isCourseTeacher) {
                return NextResponse.json(
                    { error: '无权操作 - 您不是该课程的教师' },
                    { status: 403 }
                );
            }
        }

        // 检查学生是否存在
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                role: 'STUDENT'
            }
        });

        if (!student) {
            return NextResponse.json(
                { error: '学生不存在' },
                { status: 404 }
            );
        }

        // 检查选课记录是否存在
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                courseId,
                userId: studentId
            }
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: '该学生未选修此课程' },
                { status: 404 }
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
            '从课程移除学生',
            `课程: ${course.name} (${course.code}), 学生: ${student.name}`,
            currentUser.id
        );

        return NextResponse.json({
            message: '学生已从课程中移除',
            student: {
                id: student.id,
                name: student.name
            },
            course: {
                id: course.id,
                name: course.name,
                code: course.code
            }
        });
    } catch (error) {
        console.error('从课程移除学生失败:', error);
        await logApiError(request, '从课程移除学生', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 