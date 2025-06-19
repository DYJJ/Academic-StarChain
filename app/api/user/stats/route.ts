import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 获取用户的登录次数（通过系统日志中的登录操作计数）
        const loginCount = await prisma.systemLog.count({
            where: {
                userId: currentUser.id,
                action: '用户登录'
            }
        });

        // 获取今日操作次数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const operationsToday = await prisma.systemLog.count({
            where: {
                userId: currentUser.id,
                createdAt: {
                    gte: today
                }
            }
        });

        return NextResponse.json({
            loginCount,
            operationsToday
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 