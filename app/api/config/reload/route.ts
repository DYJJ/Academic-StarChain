import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import ethereumService from '@/lib/ethereum';
import { Role } from '@prisma/client';

/**
 * 重新加载区块链配置的API端点
 * 仅管理员可访问
 */
export async function POST(request: NextRequest) {
    try {
        // 检查用户权限
        const user = await getCurrentUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
        }

        if (user.role !== Role.ADMIN) {
            return NextResponse.json({ success: false, message: '仅管理员可访问此API' }, { status: 403 });
        }

        // 获取请求体
        const body = await request.json().catch(() => ({}));
        const forceMockMode = body.forceMockMode === true;

        // 如果请求中指定了强制模拟模式，修改环境变量
        if (forceMockMode) {
            process.env.FORCE_MOCK_MODE = 'true';
            console.log('管理员设置了强制模拟模式');
        } else {
            // 否则，根据当前配置决定
            process.env.FORCE_MOCK_MODE = 'false';
        }

        // 重新加载配置
        await ethereumService.reloadConfig();

        // 检查连接状态
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
            message: '区块链配置已重新加载',
            mockMode: ethereumService.mockMode,
            connected,
            compatibilityError
        });
    } catch (error) {
        console.error('重新加载区块链配置失败:', error);
        return NextResponse.json(
            { success: false, message: '重新加载区块链配置时发生错误' },
            { status: 500 }
        );
    }
} 