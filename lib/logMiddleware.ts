import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from './prisma';

/**
 * 获取当前用户信息
 */
export function getCurrentUser(request: NextRequest) {
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

/**
 * API操作日志记录函数
 */
export async function logApiAction(
    request: NextRequest,
    action: string,
    details: string,
    userId?: string
) {
    try {
        // 优先使用传入的userId，如果没有则从请求中获取
        let userIdToUse = userId;

        if (!userIdToUse) {
            const currentUser = getCurrentUser(request);
            if (!currentUser) {
                // 未登录用户的操作不记录
                return null;
            }
            userIdToUse = currentUser.id;
        }

        // 获取客户端IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

        // 创建日志记录
        const log = await prisma.systemLog.create({
            data: {
                userId: userIdToUse,
                action,
                details: details || null,
                ipAddress
            }
        });

        return log;
    } catch (error) {
        console.error('记录API操作日志失败:', error);
        return null;
    }
}

/**
 * 记录API错误日志
 */
export async function logApiError(
    request: NextRequest,
    action: string,
    error: any,
    userId?: string
) {
    const errorDetails = typeof error === 'object'
        ? (error.message || JSON.stringify(error))
        : String(error);

    return logApiAction(
        request,
        `${action} 失败`,
        `操作失败: ${errorDetails}`,
        userId
    );
}

/**
 * 记录API成功日志
 */
export async function logApiSuccess(
    request: NextRequest,
    action: string,
    details: string,
    userId?: string
) {
    return logApiAction(request, action, details, userId);
} 