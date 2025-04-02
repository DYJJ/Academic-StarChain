<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromCookie } from '@/app/utils/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        // 获取当前用户
        const currentUser = await getUserFromCookie();
        if (!currentUser) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 只有管理员可以验证成绩
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: '只有管理员可以验证成绩' }, { status: 403 });
        }

        // 获取请求体
        const body = await request.json();
        const { status } = body;

        if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
        }

        // 更新成绩状态并创建验证记录
        const updatedGrade = await prisma.$transaction(async (prisma) => {
            // 更新成绩状态
            const updatedGrade = await prisma.grade.update({
                where: { id },
                data: { status },
                include: {
                    student: {
                        select: {
                            name: true,
                        },
                    },
                    teacher: {
                        select: {
                            name: true,
                        },
                    },
                    course: {
                        select: {
                            name: true,
                            code: true,
                        },
                    },
                },
            });

            // 创建验证记录
            await prisma.verification.create({
                data: {
                    gradeId: id,
                    userId: currentUser.id,
                    message: status === 'VERIFIED' ? '成绩已通过验证' : '成绩未通过验证',
                },
            });

            // 记录验证操作
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '验证成绩',
                    details: `${status === 'VERIFIED' ? '通过' : '拒绝'}了学生 ${updatedGrade.student.name} 的课程 ${updatedGrade.course.name}(${updatedGrade.course.code}) 成绩: ${updatedGrade.score}分`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });

            return updatedGrade;
        });

        return NextResponse.json({
            message: `成绩已${status === 'VERIFIED' ? '验证' : '拒绝'}`,
            grade: updatedGrade
        });
    } catch (error) {
        console.error('验证成绩失败:', error);
        return NextResponse.json({ error: '验证成绩失败' }, { status: 500 });
    }
=======
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromCookie } from '@/app/utils/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;

        // 获取当前用户
        const currentUser = await getUserFromCookie();
        if (!currentUser) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 只有管理员可以验证成绩
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: '只有管理员可以验证成绩' }, { status: 403 });
        }

        // 获取请求体
        const body = await request.json();
        const { status } = body;

        if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
        }

        // 更新成绩状态并创建验证记录
        const updatedGrade = await prisma.$transaction(async (prisma) => {
            // 更新成绩状态
            const updatedGrade = await prisma.grade.update({
                where: { id },
                data: { status },
                include: {
                    student: {
                        select: {
                            name: true,
                        },
                    },
                    teacher: {
                        select: {
                            name: true,
                        },
                    },
                    course: {
                        select: {
                            name: true,
                            code: true,
                        },
                    },
                },
            });

            // 创建验证记录
            await prisma.verification.create({
                data: {
                    gradeId: id,
                    userId: currentUser.id,
                    message: status === 'VERIFIED' ? '成绩已通过验证' : '成绩未通过验证',
                },
            });

            // 记录验证操作
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '验证成绩',
                    details: `${status === 'VERIFIED' ? '通过' : '拒绝'}了学生 ${updatedGrade.student.name} 的课程 ${updatedGrade.course.name}(${updatedGrade.course.code}) 成绩: ${updatedGrade.score}分`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });

            return updatedGrade;
        });

        return NextResponse.json({
            message: `成绩已${status === 'VERIFIED' ? '验证' : '拒绝'}`,
            grade: updatedGrade
        });
    } catch (error) {
        console.error('验证成绩失败:', error);
        return NextResponse.json({ error: '验证成绩失败' }, { status: 500 });
    }
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
} 