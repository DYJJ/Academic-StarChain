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

// 获取学生的学习进度
export async function GET(request: NextRequest) {
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

        // 检查是否是教师或管理员
        if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '禁止访问 - 仅限教师和管理员使用' },
                { status: 403 }
            );
        }

        // 获取URL参数
        const url = new URL(request.url);
        const studentId = url.searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { error: '缺少必填参数 studentId' },
                { status: 400 }
            );
        }

        // 获取学生信息
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true
            }
        });

        if (!student || student.role !== 'STUDENT') {
            return NextResponse.json(
                { error: '学生不存在' },
                { status: 404 }
            );
        }

        // 获取学生的选课记录
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: studentId },
            include: {
                course: true
            }
        });

        // 获取学生的成绩记录
        const grades = await prisma.grade.findMany({
            where: { studentId: studentId },
            include: {
                course: true
            }
        });

        // 计算学习进度
        const courseProgress = enrollments.map(enrollment => {
            // 查找相应课程的成绩，如果有的话
            const courseGrade = grades.find(g => g.courseId === enrollment.courseId);
            
            // 计算进度，基于分数或者其他参数
            let progress = 0;
            if (enrollment.status === 'completed') {
                progress = 100;
            } else if (enrollment.status === 'enrolled') {
                // 如果有课程进度信息，使用它
                if (enrollment.course.progress) {
                    progress = enrollment.course.progress;
                } else if (courseGrade) {
                    // 否则基于成绩估算进度
                    progress = Math.min(Math.round((courseGrade.score / 100) * 100), 100);
                } else {
                    // 默认进度
                    progress = 30; // 假设刚开始
                }
            }

            return {
                courseId: enrollment.courseId,
                courseName: enrollment.course.name,
                courseCode: enrollment.course.code,
                status: enrollment.status,
                progress: progress,
                score: courseGrade?.score || null,
                lastUpdated: enrollment.updatedAt
            };
        });

        // 计算总体学习进度
        const totalProgress = courseProgress.length > 0
            ? Math.round(courseProgress.reduce((sum, course) => sum + course.progress, 0) / courseProgress.length)
            : 0;

        // 记录成功操作
        await logApiSuccess(
            request,
            '获取学生学习进度',
            `学生: ${student.name} (${student.email})`,
            currentUser.id
        );

        return NextResponse.json({
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                avatarUrl: student.avatarUrl
            },
            courses: courseProgress,
            totalProgress: totalProgress,
            enrollmentCount: enrollments.length
        });
    } catch (error) {
        console.error('获取学生学习进度失败:', error);
        await logApiError(request, '获取学生学习进度', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 