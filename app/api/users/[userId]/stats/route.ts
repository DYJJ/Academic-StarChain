import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

// 从cookie获取当前用户信息
function getCurrentUserFromCookie() {
    try {
        const cookieStore = cookies();
        const userSessionStr = cookieStore.get('user_session')?.value;

        if (!userSessionStr) {
            return null;
        }

        return JSON.parse(userSessionStr);
    } catch (error) {
        console.error('解析用户会话错误:', error);
        return null;
    }
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        // 1. 验证参数
        const { userId } = params;
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { error: 'Invalid user ID parameter' },
                { status: 400 }
            );
        }

        // 2. 获取当前用户
        const currentUser = getCurrentUserFromCookie();
        if (!currentUser || !currentUser.id) {
            return NextResponse.json(
                { error: 'Unauthorized - Please log in first' },
                { status: 401 }
            );
        }

        // 3. 权限检查
        const isAdmin = currentUser.role === 'ADMIN';
        const isSelf = currentUser.id === userId;

        if (!isAdmin && !isSelf) {
            return NextResponse.json(
                { error: 'Forbidden - You can only view your own statistics' },
                { status: 403 }
            );
        }

        // 4. 数据查询
        try {
            // 获取用户的登录次数
            const totalLogins = await prisma.systemLog.count({
                where: {
                    userId: userId,
                    action: '用户登录'
                }
            });

            // 获取今日操作次数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const actionsToday = await prisma.systemLog.count({
                where: {
                    userId: userId,
                    createdAt: {
                        gte: today
                    }
                }
            });

            // 获取最后一次登录时间
            const lastLoginLog = await prisma.systemLog.findFirst({
                where: {
                    userId: userId,
                    action: '用户登录'
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    createdAt: true
                }
            });

            // 获取总操作次数
            const totalActions = await prisma.systemLog.count({
                where: {
                    userId: userId
                }
            });

            // 5. 返回结果
            return NextResponse.json({
                stats: {
                    totalLogins,
                    lastLogin: lastLoginLog ? lastLoginLog.createdAt : null,
                    actionsToday,
                    totalActions
                }
            });
        } catch (dbError: any) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Database query failed', details: dbError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
} 