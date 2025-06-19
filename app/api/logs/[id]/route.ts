import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';
import { logApiAction } from '../../../../lib/logMiddleware';

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
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

// 获取单个日志详情
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const logId = params.id;
        console.log('GET /api/logs/[id] 被调用, 日志ID:', logId);
        
        // 检查cookie详情
        const cookieStr = request.headers.get('cookie');
        console.log('请求Cookie:', cookieStr);
        
        const cookieStore = cookies();
        const allCookies = cookieStore.getAll();
        console.log('所有Cookie:', allCookies);
        
        const userSessionCookie = cookieStore.get('user_session');
        console.log('用户会话Cookie:', userSessionCookie);

        // 获取当前用户
        const currentUser = getCurrentUser(request);
        console.log('当前用户:', currentUser);

        // 检查是否登录
        if (!currentUser) {
            console.log('未获取到用户会话');
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 只有管理员可以查看日志详情
        if (currentUser.role !== 'ADMIN') {
            console.log('非管理员尝试查看日志详情:', currentUser.role);
            return NextResponse.json(
                { error: '仅管理员可查看日志详情' },
                { status: 403 }
            );
        }

        try {
            // 检查数据库连接
            await prisma.$queryRaw`SELECT 1`;
            console.log('数据库连接正常');
            
            // 查询日志详情
            const log = await prisma.systemLog.findUnique({
                where: { id: logId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });

            if (!log) {
                console.log('日志不存在，ID:', logId);
                return NextResponse.json(
                    { error: '日志不存在' },
                    { status: 404 }
                );
            }

            console.log('查询到日志:', log);

            // 记录查看日志详情操作
            try {
                await logApiAction(
                    request,
                    '查看日志详情',
                    `查看了ID为${logId}的日志详情，操作类型：${log.action}`
                );
            } catch (logError) {
                console.error('记录日志查看操作失败，但不影响返回结果:', logError);
            }

            const response = { log };
            console.log('API响应数据:', JSON.stringify(response).substring(0, 1000) + '...(截断)');
            
            return NextResponse.json(response);
        } catch (dbError) {
            console.error('数据库查询错误:', dbError);
            return NextResponse.json(
                { error: '数据库查询错误', details: dbError instanceof Error ? dbError.message : '未知数据库错误' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('获取日志详情失败:', error);
        return NextResponse.json(
            { error: '获取日志详情失败', details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
} 