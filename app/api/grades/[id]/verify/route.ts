import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/app/utils/jwt';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // 验证令牌
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: '无效的令牌' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!currentUser) {
            return NextResponse.json({ error: '用户不存在' }, { status: 404 });
        }

        // 检查用户是否有权限验证成绩
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
            return NextResponse.json({ error: '无权执行此操作' }, { status: 403 });
        }

        const id = params.id;
        const { status } = await request.json();

        if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
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

        return NextResponse.json({ message: '成绩状态更新成功', grade: updatedGrade });
    } catch (error) {
        console.error('验证成绩时出错:', error);
        return NextResponse.json({ error: '验证成绩时出错' }, { status: 500 });
    }
} 