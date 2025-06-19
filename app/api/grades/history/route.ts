import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// 从cookie获取当前用户信息
function getCurrentUser(request: NextRequest) {
    const cookieStore = cookies();
    const userSessionStr = cookieStore.get('user_session')?.value;

    if (!userSessionStr) {
        return null;
    }

    try {
        return JSON.parse(userSessionStr);
    } catch (error) {
        console.error('解析用户会话错误:', error);
        return null;
    }
}

// GET - 获取成绩修改历史记录列表
export async function GET(request: NextRequest) {
    try {
        // 获取当前用户
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 获取分页参数
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // 构建查询条件
        const where: any = {};

        // 非管理员只能查看自己的成绩修改历史
        if (currentUser.role !== 'ADMIN') {
            where.OR = [
                { editor: { id: currentUser.id } },
                { grade: { teacherId: currentUser.id } }
            ];
        }

        // 如果有指定学生ID
        const studentId = searchParams.get('studentId');
        if (studentId) {
            where.grade = {
                ...where.grade,
                studentId
            };
        }

        // 如果有指定课程ID
        const courseId = searchParams.get('courseId');
        if (courseId) {
            where.grade = {
                ...where.grade,
                courseId
            };
        }

        // 总数统计
        const total = await prisma.gradeEditHistory.count({ where });

        // 获取历史记录
        const history = await prisma.gradeEditHistory.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
            include: {
                editor: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                grade: {
                    select: {
                        id: true,
                        score: true,
                        status: true,
                        student: {
                            select: {
                                id: true,
                                name: true,
                                studentId: true
                            }
                        },
                        course: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        teacher: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            history,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取成绩修改历史记录失败:', error);
        return NextResponse.json({ error: '获取成绩修改历史记录失败' }, { status: 500 });
    }
} 