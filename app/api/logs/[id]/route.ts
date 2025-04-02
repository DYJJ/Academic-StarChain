import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { logApiAction } from '../../../../lib/logMiddleware';

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
    const cookieStore = cookies();
    const userSession = cookieStore.get('user_session')?.value;

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

// 获取单个日志详情
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const logId = params.id;

        // 获取当前用户
        const currentUser = getCurrentUser(request);

        // 检查是否登录
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只有管理员可以查看日志详情
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '仅管理员可查看日志详情' },
                { status: 403 }
            );
        }

        // 查询日志详情
        const log = await prisma.systemLog.findUnique({
            where: { id: logId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!log) {
            return NextResponse.json(
                { error: '日志不存在' },
                { status: 404 }
            );
        }

        // 记录查看日志详情操作
        await logApiAction(
            request,
            '查看日志详情',
            `查看了ID为${logId}的日志详情，操作类型：${log.action}`
        );

        return NextResponse.json({ log });
    } catch (error) {
        console.error('获取日志详情失败:', error);
        return NextResponse.json(
            { error: '获取日志详情失败' },
            { status: 500 }
        );
    }
} 