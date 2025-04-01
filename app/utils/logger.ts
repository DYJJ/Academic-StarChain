/**
 * 系统操作日志记录工具
 */

// 定义操作类型
export enum LogAction {
    LOGIN = '用户登录',
    LOGOUT = '用户登出',
    CREATE_USER = '创建用户',
    UPDATE_USER = '更新用户',
    DELETE_USER = '删除用户',
    CREATE_COURSE = '创建课程',
    UPDATE_COURSE = '更新课程',
    DELETE_COURSE = '删除课程',
    CREATE_GRADE = '创建成绩',
    UPDATE_GRADE = '更新成绩',
    DELETE_GRADE = '删除成绩',
    VERIFY_GRADE = '验证成绩',
    SYSTEM_SETTING = '系统设置',
    USER_PROFILE = '查看个人资料',
    UPDATE_AVATAR = '更新头像',
}

/**
 * 记录系统操作日志
 * @param action 操作类型
 * @param details 操作详情
 * @returns 
 */
export async function logAction(action: string, details?: string) {
    try {
        const response = await fetch('/api/logs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, details }),
        });

        if (!response.ok) {
            console.error('记录日志失败:', await response.json());
        }

        return response.ok;
    } catch (error) {
        console.error('记录日志出错:', error);
        return false;
    }
} 