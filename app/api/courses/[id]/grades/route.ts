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

// 将分数转换为等级
function getGradeFromScore(score?: number): string | null {
    if (score === undefined || score === null) return null;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

// 获取课程学生成绩
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

        // 检查是否有权限访问这个课程的成绩
        // 教师只能查看自己教授的课程的成绩
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
                    { error: '无权查看 - 您不是该课程的教师' },
                    { status: 403 }
                );
            }
        }
        // 学生只能查看自己选修的课程的成绩
        else if (currentUser.role === 'STUDENT') {
            const isEnrolledStudent = await prisma.enrollment.findFirst({
                where: {
                    courseId: courseId,
                    userId: currentUser.id
                }
            });

            if (!isEnrolledStudent) {
                return NextResponse.json(
                    { error: '无权查看 - 您未选修此课程' },
                    { status: 403 }
                );
            }
        }

        // 查询课程成绩
        // 在真实环境中，应该从enrollment表或grade表获取数据
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // 格式化成绩数据
        const grades = enrollments.map(enrollment => ({
            studentId: enrollment.user.id,
            studentName: enrollment.user.name,
            email: enrollment.user.email,
            score: enrollment.score,
            grade: getGradeFromScore(enrollment.score),
            status: enrollment.status || 'enrolled',
            lastUpdated: enrollment.updatedAt ? enrollment.updatedAt.toISOString() : null
        }));

        // 记录成功操作
        await logApiSuccess(request, '获取课程学生成绩', `课程ID: ${courseId}`, currentUser.id);

        return NextResponse.json({ grades });
    } catch (error) {
        console.error('获取课程学生成绩失败:', error);
        await logApiError(request, '获取课程学生成绩', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 更新学生成绩
export async function PUT(
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

        // 只有教师和管理员可以修改成绩
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
            return NextResponse.json(
                { error: '禁止访问 - 只有教师或管理员可以修改成绩' },
                { status: 403 }
            );
        }

        const courseId = params.id;
        
        // 教师只能修改自己教授的课程成绩
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
                    { error: '无权修改 - 您不是该课程的教师' },
                    { status: 403 }
                );
            }
        }

        const { studentId, score, status } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { error: '学生ID不能为空' },
                { status: 400 }
            );
        }

        // 检查学生是否已选修该课程
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                courseId: courseId,
                userId: studentId
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                },
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
                { error: '该学生未选修此课程' },
                { status: 404 }
            );
        }

        // 更新学生成绩
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                id: enrollment.id
            },
            data: {
                score: score !== undefined ? score : enrollment.score,
                status: status || enrollment.status
            }
        });

        // 记录成功操作
        await logApiSuccess(
            request,
            '更新学生成绩',
            `课程: ${enrollment.course.name} (${enrollment.course.code}), 学生: ${enrollment.user.name}, 分数: ${score}`,
            currentUser.id
        );

        return NextResponse.json({
            message: '学生成绩更新成功',
            enrollment: updatedEnrollment
        });
    } catch (error) {
        console.error('更新学生成绩失败:', error);
        await logApiError(request, '更新学生成绩', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 