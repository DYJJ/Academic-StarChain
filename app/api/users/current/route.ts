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

// 获取当前登录用户的详细信息
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

        // 从数据库获取最新的用户信息
        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                classId: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            );
        }

        // 记录成功操作
        await logApiSuccess(request, '获取当前用户信息', '', currentUser.id);

        return NextResponse.json({ user });
    } catch (error) {
        console.error('获取当前用户信息失败:', error);
        await logApiError(request, '获取当前用户信息', error, currentUser?.id);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 