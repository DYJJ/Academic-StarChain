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

// 初始化系统日志
export async function POST(request: NextRequest) {
    console.log('POST /api/logs/init 被调用');
    
    try {
        // 获取当前用户
        const currentUser = getCurrentUser(request);

        // 检查是否登录
        if (!currentUser) {
            console.log('未登录用户尝试初始化日志');
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只允许管理员初始化日志
        if (currentUser.role !== 'ADMIN') {
            console.log('非管理员尝试初始化日志:', currentUser.role);
            return NextResponse.json(
                { error: '仅管理员可初始化系统日志' },
                { status: 403 }
            );
        }

        const now = new Date();
        const actions = [
            '用户登录', '用户登出', '创建用户', '更新用户', '删除用户', 
            '创建课程', '更新课程', '删除课程', '系统设置', '查看日志'
        ];
        
        // 首先查询现有日志数量
        const existingCount = await prisma.systemLog.count();
        console.log('现有日志数量:', existingCount);
        
        if (existingCount > 0) {
            console.log('已有日志存在，不需要初始化');
            return NextResponse.json({
                message: '系统日志已存在',
                count: existingCount
            });
        }
        
        console.log('开始创建示例日志...');
        
        // 创建20条示例日志记录
        const logs = [];
        for (let i = 0; i < 20; i++) {
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const date = new Date(now);
            date.setHours(date.getHours() - Math.floor(Math.random() * 72)); // 随机时间，最近72小时内
            
            logs.push({
                userId: currentUser.id,
                action: randomAction,
                details: `示例日志记录 #${i+1}`,
                ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
                createdAt: date
            });
        }
        
        // 批量创建日志
        const result = await prisma.systemLog.createMany({
            data: logs
        });
        
        console.log('成功创建示例日志数量:', result.count);
        
        // 记录初始化操作本身
        await prisma.systemLog.create({
            data: {
                userId: currentUser.id,
                action: '初始化系统日志',
                details: `管理员初始化了系统日志，创建了 ${result.count} 条示例记录`,
                ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1'
            }
        });

        return NextResponse.json({
            message: '系统日志已初始化',
            createdCount: result.count + 1 // 加上初始化操作本身的记录
        });
    } catch (error) {
        console.error('初始化系统日志失败:', error);
        return NextResponse.json(
            { error: '初始化系统日志失败', details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
} 