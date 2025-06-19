/**
 * 系统操作日志记录工具
 */

import { NextRequest } from 'next/server';

// 定义操作类型作为字符串常量对象而不是枚举，使其在服务器和客户端都可用
export const LogAction = {
    // 用户认证相关
    LOGIN: '用户登录',
    LOGOUT: '用户登出',
    REGISTER: '用户注册',
    AUTH: '用户认证',

    // 用户管理相关
    CREATE_USER: '创建用户',
    UPDATE_USER: '更新用户',
    DELETE_USER: '删除用户',
    RESET_PASSWORD: '重置密码',

    // 课程管理相关
    CREATE_COURSE: '创建课程',
    UPDATE_COURSE: '更新课程',
    DELETE_COURSE: '删除课程',
    ASSIGN_TEACHER: '分配教师',

    // 成绩管理相关
    CREATE_GRADE: '创建成绩',
    UPDATE_GRADE: '更新成绩',
    DELETE_GRADE: '删除成绩',
    VERIFY_GRADE: '验证成绩',
    REJECT_GRADE: '拒绝成绩',
    EXPORT_GRADE: '导出成绩',

    // 系统相关
    SYSTEM_SETTING: '系统设置',
    VIEW_LOGS: '查看日志',
    EXPORT_DATA: '导出数据',

    // 个人相关
    USER_PROFILE: '个人资料',
    UPDATE_AVATAR: '更新头像',
    CHANGE_PASSWORD: '修改密码',

    // 浏览行为
    VIEW_COURSE: '查看课程',
    VIEW_STUDENT: '查看学生',
    VIEW_GRADE: '查看成绩',
    VIEW_DASHBOARD: '访问仪表盘',
    GRADE_ANALYSIS: '成绩分析'
};

/**
 * 记录系统操作日志
 * @param action 操作类型
 * @param details 操作详情
 * @param userId 用户ID
 * @returns 
 */
export async function logAction(action: string, details?: string, userId?: string) {
    try {
        if (!userId) {
            console.warn('未提供用户ID的操作日志');
            return;
        }

        // 获取当前环境下的完整URL
        let url;
        try {
            // 检查是否在浏览器环境
            const isClient = typeof window !== 'undefined';
            const baseUrl = isClient
                ? window.location.origin
                : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            url = new URL('/api/logs', baseUrl);
        } catch (urlError) {
            console.warn('构建URL失败，使用备用方式', urlError);
            // 备用方式
            url = process.env.NEXT_PUBLIC_API_URL
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/logs`
                : 'http://localhost:3000/api/logs';
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                action,
                details,
                ipAddress: 'unknown' // 客户端时无法获取真实IP
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('记录日志出错:', error);
    }
}

/**
 * 记录API错误
 * @param action 操作类型
 * @param error 错误对象
 * @param userId 用户ID
 */
export async function logApiError(action: string, error: any, userId?: string) {
    try {
        const errorDetails = error instanceof Error ?
            `${error.name}: ${error.message}` :
            JSON.stringify(error);

        await logAction(action, errorDetails, userId);
    } catch (logError) {
        console.error('记录API错误日志失败:', logError);
    }
}

/**
 * 记录API成功操作
 * @param request 请求对象
 * @param action 操作类型
 * @param details 操作详情
 * @param userId 用户ID
 */
export async function logApiSuccess(request: NextRequest | string, action: string, details: string, userId?: string) {
    try {
        await logAction(action, details, userId);
    } catch (error) {
        console.error('记录API成功操作日志失败:', error);
    }
} 