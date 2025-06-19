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

// 添加学生到课程（批量）
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

        // 只有管理员和教师可以添加学生
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
            return NextResponse.json(
                { error: '禁止操作 - 只有管理员和教师可以添加学生' },
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

        // 获取请求体
        const { studentId, studentIds } = await request.json();
        
        // 处理单个学生或多个学生
        let studentIdsToAdd = studentIds || [];
        if (studentId && !studentIdsToAdd.includes(studentId)) {
            studentIdsToAdd.push(studentId);
        }

        if (studentIdsToAdd.length === 0) {
            return NextResponse.json(
                { error: '请提供学生ID' },
                { status: 400 }
            );
        }

        // 批量添加学生
        const results = await Promise.all(
            studentIdsToAdd.map(async (id: string) => {
                // 检查学生是否存在
                const student = await prisma.user.findFirst({
                    where: {
                        id,
                        role: 'STUDENT'
                    }
                });

                if (!student) {
                    return { id, success: false, error: '学生不存在' };
                }

                // 检查学生是否已选修该课程
                const existingEnrollment = await prisma.enrollment.findFirst({
                    where: {
                        courseId,
                        userId: id
                    }
                });

                if (existingEnrollment) {
                    return { id, success: false, error: '学生已选修该课程' };
                }

                // 创建选课记录
                await prisma.enrollment.create({
                    data: {
                        courseId,
                        userId: id,
                        status: 'enrolled'
                    }
                });

                return { id, success: true };
            })
        );

        // 记录成功操作
        await logApiSuccess(
            request,
            '添加学生到课程',
            `课程: ${course.name} (${course.code}), 添加学生数: ${results.filter(r => r.success).length}`,
            currentUser.id
        );

        return NextResponse.json({
            results,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        });
    } catch (error) {
        console.error('添加学生到课程失败:', error);
        await logApiError(request, '添加学生到课程', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 