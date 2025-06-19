import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取当前用户信息的函数
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

// 获取系统日志
export async function GET(request: NextRequest) {
    console.log('GET /api/logs 被调用');
    
    try {
        // 检查cookie详情
        const cookieStr = request.headers.get('cookie');
        console.log('请求Cookie:', cookieStr);
        
        const allCookies = request.cookies.getAll();
        console.log('所有Cookie:', allCookies);
        
        const userSessionCookie = request.cookies.get('user_session');
        console.log('用户会话Cookie:', userSessionCookie);
        
        const currentUser = getCurrentUser(request);
        console.log('当前用户:', currentUser);

        if (!currentUser) {
            console.log('未获取到用户会话');
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        // 只允许管理员访问系统日志
        if (currentUser.role !== 'ADMIN') {
            console.log('非管理员尝试访问日志:', currentUser.role);
            return NextResponse.json(
                { error: '只有管理员可以查看系统日志' },
                { status: 403 }
            );
        }

        // 解析查询参数
        const { searchParams } = new URL(request.url);
        console.log('原始查询字符串:', request.url);
        console.log('解析后的参数:', Object.fromEntries(searchParams.entries()));
        
        let page = parseInt(searchParams.get('page') || '1');
        let limit = parseInt(searchParams.get('limit') || '20');

        // 确保分页参数有效
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100; // 限制最大返回数量

        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const details = searchParams.get('details');
        const ipAddress = searchParams.get('ipAddress');

        console.log('查询参数:', {
            page, limit, userId, action, startDate, endDate, details, ipAddress
        });

        // 构建查询条件
        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (ipAddress) where.ipAddress = { contains: ipAddress };

        // 按日期范围筛选
        if (startDate || endDate) {
            where.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.createdAt.gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // 按详情搜索
        if (details) {
            where.details = {
                contains: details
            };
        }

        console.log('构建的查询条件:', where);

        try {
            // 检查数据库连接是否正常
            await prisma.$queryRaw`SELECT 1`;
            console.log('数据库连接正常');
            
            // 查询日志总数
            const total = await prisma.systemLog.count({ where });
            console.log('日志总数:', total);

            // 查询日志列表
            const logs = await prisma.systemLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit
            });

            console.log(`获取到 ${logs.length} 条日志`);
            
            // 检查日志数据样本
            if (logs.length > 0) {
                console.log('第一条日志样本:', JSON.stringify(logs[0]));
            }

            const response = {
                logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
            
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
        console.error('获取系统日志失败:', error);
        return NextResponse.json(
            { error: '获取系统日志失败', details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}

// 添加系统日志
export async function POST(request: NextRequest) {
    try {
        const { userId, action, details, ipAddress } = await request.json();

        // 验证必要字段
        if (!userId || !action) {
            return NextResponse.json(
                { error: '缺少必要字段' },
                { status: 400 }
            );
        }

        // 创建日志记录
        const log = await prisma.systemLog.create({
            data: {
                userId,
                action,
                details: details || '',
                ipAddress: ipAddress || request.headers.get('x-forwarded-for') || '未知IP'
            }
        });

        return NextResponse.json({
            success: true,
            log,
            message: '日志记录成功'
        });
    } catch (error) {
        console.error('记录日志失败:', error);
        return NextResponse.json(
            { error: '服务器内部错误', details: error instanceof Error ? error.message : '未知错误' },
            { status: 500 }
        );
    }
}

// 获取单个日志详情
export async function PUT(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        // 只允许管理员访问系统日志
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '只有管理员可以查看系统日志' },
                { status: 403 }
            );
        }

        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: '缺少日志ID' },
                { status: 400 }
            );
        }

        // 查询日志详情
        const log = await prisma.systemLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!log) {
            return NextResponse.json(
                { error: '日志不存在' },
                { status: 404 }
            );
        }

        // 记录查看日志详情的操作
        await prisma.systemLog.create({
            data: {
                userId: currentUser.id,
                action: '查看日志详情',
                details: `查看日志ID: ${id}`,
                ipAddress: request.headers.get('x-forwarded-for') || '未知IP'
            }
        });

        return NextResponse.json({ log });
    } catch (error) {
        console.error('获取日志详情失败:', error);
        return NextResponse.json(
            { error: '获取日志详情失败' },
            { status: 500 }
        );
    }
} 