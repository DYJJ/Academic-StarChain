import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import ethereumService from '@/lib/ethereum';
import { Role } from '@prisma/client';

/**
 * 获取区块链状态的API端点
 * 仅管理员可访问
 */
export async function GET(request: NextRequest) {
    try {
        // 检查用户权限
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
        }

        if (user.role !== Role.ADMIN) {
            return NextResponse.json({ success: false, message: '仅管理员可访问此API' }, { status: 403 });
        }

        // 获取连接状态
        const connected = await ethereumService.checkConnection();

        // 查找可能存在的兼容性错误
        const recentLogs = await global.prisma?.systemLog.findMany({
            where: {
                action: {
                    in: ['BLOCKCHAIN_ERROR', 'BLOCKCHAIN_VERIFY_ERROR', 'BLOCKCHAIN_GET_RECORDS_ERROR']
                },
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 过去24小时
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 1
        });

        const compatibilityError = recentLogs && recentLogs.length > 0
            ? recentLogs[0].details
            : null;

        return NextResponse.json({
            success: true,
            connected,
            mockMode: ethereumService.mockMode,
            compatibilityError
        });
    } catch (error) {
        console.error('获取区块链状态失败:', error);
        return NextResponse.json(
            { success: false, message: '获取区块链状态时发生错误' },
            { status: 500 }
        );
    }
} 