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

// 获取所有课程的选课学生和分数概览
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

        // 根据用户角色决定查询范围
        let courses = [];
        
        if (currentUser.role === 'ADMIN') {
            // 管理员可以查看所有课程
            courses = await prisma.course.findMany({
                include: {
                    enrollments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } else if (currentUser.role === 'TEACHER') {
            // 教师只能查看自己教授的课程
            courses = await prisma.course.findMany({
                where: {
                    users: {
                        some: {
                            id: currentUser.id
                        }
                    }
                },
                include: {
                    enrollments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        } else {
            // 学生只能查看自己选修的课程
            const enrollments = await prisma.enrollment.findMany({
                where: {
                    userId: currentUser.id
                },
                include: {
                    course: {
                        include: {
                            enrollments: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            courses = enrollments.map(enrollment => enrollment.course);
        }

        // 格式化数据
        const courseOverviews = courses.map(course => {
            const students = course.enrollments.map(enrollment => ({
                id: enrollment.user.id,
                name: enrollment.user.name,
                email: enrollment.user.email,
                score: enrollment.score,
                status: enrollment.status
            }));

            return {
                id: course.id,
                code: course.code,
                name: course.name,
                semester: course.semester,
                studentCount: students.length,
                students: students
            };
        });

        // 记录成功操作
        await logApiSuccess(request, '获取课程选课概览', '', currentUser.id);

        return NextResponse.json({
            courses: courseOverviews
        });
    } catch (error) {
        console.error('获取课程选课概览失败:', error);
        await logApiError(request, '获取课程选课概览', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 