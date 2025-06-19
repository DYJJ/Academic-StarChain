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

// POST - 验证成绩
export async function POST(request: NextRequest, { params }: { params: { gradeId: string } }) {
    try {
        const gradeId = params.gradeId;
        console.log('收到验证成绩请求:', gradeId, '路径参数:', params);

        // 获取当前用户
        const currentUser = getCurrentUser(request);
        console.log('当前用户:', currentUser?.name, '角色:', currentUser?.role);
        
        if (!currentUser) {
            console.log('用户未授权');
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        // 允许管理员和教师验证成绩
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'TEACHER') {
            return NextResponse.json({ error: '只有管理员和教师可以验证成绩' }, { status: 403 });
        }

        // 获取成绩记录，检查教师是否是该成绩的创建者
        const gradeRecord = await prisma.grade.findUnique({
            where: { id: gradeId },
            select: {
                teacherId: true,
                student: {
                    select: {
                        name: true,
                        avatarUrl: true
                    }
                },
                course: {
                    select: {
                        name: true,
                        code: true
                    }
                },
                score: true
            }
        });

        if (!gradeRecord) {
            return NextResponse.json({ error: '成绩记录不存在' }, { status: 404 });
        }

        // 如果是教师，只能验证自己添加的成绩
        if (currentUser.role === 'TEACHER' && gradeRecord.teacherId !== currentUser.id) {
            return NextResponse.json({ error: '您只能验证自己添加的成绩' }, { status: 403 });
        }

        // 获取请求体
        const body = await request.json();
        const { status } = body;

        if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
        }

        // 获取历史修改记录，确定这是第几次验证
        let historyCount = 0;
        try {
            historyCount = await prisma.gradeEditHistory.count({
                where: { gradeId: gradeId }
            });
        } catch (error) {
            console.error('获取历史记录失败，忽略次数:', error);
        }

        // 更新成绩状态
        const updatedGrade = await prisma.grade.update({
            where: { id: gradeId },
            data: { status },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    },
                },
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        credit: true,
                        semester: true
                    },
                },
            },
        });

        // 记录验证操作
        await prisma.systemLog.create({
            data: {
                userId: currentUser.id,
                action: '验证成绩',
                details: `${status === 'VERIFIED' ? '通过' : '拒绝'}了学生 ${gradeRecord.student.name} 的课程 ${gradeRecord.course.name}(${gradeRecord.course.code}) 成绩: ${gradeRecord.score}分${historyCount > 0 ? `（第${historyCount}次修改）` : ''}`,
                ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
            }
        });

        return NextResponse.json({
            message: `成绩已${status === 'VERIFIED' ? '验证' : '拒绝'}`,
            grade: updatedGrade,
            isAfterEdit: historyCount > 0,
            editCount: historyCount
        });
    } catch (error) {
        console.error('验证成绩失败:', error);
        return NextResponse.json({ error: `验证成绩失败: ${error instanceof Error ? error.message : '未知错误'}` }, { status: 500 });
    }
} 