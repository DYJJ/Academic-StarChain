import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * 获取当前用户信息
 * 从cookie中解析用户会话数据
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