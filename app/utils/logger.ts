/**
 * 系统操作日志记录工具
 */

// 定义操作类型
export enum LogAction {
<<<<<<< HEAD
    // 用户认证相关
    LOGIN = '用户登录',
    LOGOUT = '用户登出',
    REGISTER = '用户注册',
    AUTH = '用户认证',

    // 用户管理相关
    CREATE_USER = '创建用户',
    UPDATE_USER = '更新用户',
    DELETE_USER = '删除用户',
    RESET_PASSWORD = '重置密码',

    // 课程管理相关
    CREATE_COURSE = '创建课程',
    UPDATE_COURSE = '更新课程',
    DELETE_COURSE = '删除课程',
    ASSIGN_TEACHER = '分配教师',

    // 成绩管理相关
=======
    LOGIN = '用户登录',
    LOGOUT = '用户登出',
    CREATE_USER = '创建用户',
    UPDATE_USER = '更新用户',
    DELETE_USER = '删除用户',
    CREATE_COURSE = '创建课程',
    UPDATE_COURSE = '更新课程',
    DELETE_COURSE = '删除课程',
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    CREATE_GRADE = '创建成绩',
    UPDATE_GRADE = '更新成绩',
    DELETE_GRADE = '删除成绩',
    VERIFY_GRADE = '验证成绩',
<<<<<<< HEAD
    REJECT_GRADE = '拒绝成绩',

    // 系统相关
    SYSTEM_SETTING = '系统设置',
    VIEW_LOGS = '查看日志',
    EXPORT_DATA = '导出数据',

    // 个人相关
    USER_PROFILE = '个人资料',
    UPDATE_AVATAR = '更新头像',
    CHANGE_PASSWORD = '修改密码',

    // 浏览行为
    VIEW_COURSE = '查看课程',
    VIEW_STUDENT = '查看学生',
    VIEW_GRADE = '查看成绩',
    VIEW_DASHBOARD = '访问仪表盘',
=======
    SYSTEM_SETTING = '系统设置',
    USER_PROFILE = '查看个人资料',
    UPDATE_AVATAR = '更新头像',
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
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