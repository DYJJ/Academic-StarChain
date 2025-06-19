import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
    try {
        const userSession = request.cookies.get('user_session')?.value;
        
        if (!userSession) {
            return null;
        }
        
        return JSON.parse(userSession);
    } catch (error) {
        console.error('解析用户会话失败:', error);
        return null;
    }
}

// 清空所有日志
export async function DELETE(request: NextRequest) {
    try {
        // 获取当前用户
        const currentUser = getCurrentUser(request);

        // 检查是否登录
        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只允许管理员清空日志
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '仅管理员可清空系统日志' },
                { status: 403 }
            );
        }

        // 记录清空日志前的操作日志（这条记录不会被删除）
        const logsCountBeforeClear = await prisma.systemLog.count();
        const clearLogRecord = await prisma.systemLog.create({
            data: {
                userId: currentUser.id,
                action: '清空系统日志',
                details: `管理员清空了系统日志，共删除 ${logsCountBeforeClear} 条记录`,
                ipAddress: request.headers.get('x-forwarded-for') || '未知IP'
            }
        });

        // 删除所有日志，除了刚刚创建的清空日志记录
        const result = await prisma.systemLog.deleteMany({
            where: {
                id: {
                    not: clearLogRecord.id
                }
            }
        });

        return NextResponse.json({
            message: '系统日志已清空',
            deletedCount: result.count
        });
    } catch (error) {
        console.error('清空系统日志失败:', error);
        return NextResponse.json(
            { error: '清空系统日志失败' },
            { status: 500 }
        );
    }
} 