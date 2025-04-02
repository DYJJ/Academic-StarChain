import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// 获取系统日志
export async function GET(request: NextRequest) {
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

        // 解析查询参数
        const { searchParams } = new URL(request.url);
        let page = parseInt(searchParams.get('page') || '1');
        let limit = parseInt(searchParams.get('limit') || '20');

        // 确保分页参数有效
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100; // 限制最大返回数量

        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
<<<<<<< HEAD
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const details = searchParams.get('details');
        const ipAddress = searchParams.get('ipAddress');
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f

        // 构建查询条件
        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
<<<<<<< HEAD
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
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f

        // 查询日志总数
        const total = await prisma.systemLog.count({ where });

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

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('获取系统日志失败:', error);
        return NextResponse.json(
            { error: '获取系统日志失败' },
            { status: 500 }
        );
    }
}

// 添加系统日志
export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        const { action, details } = await request.json();

        // 验证必填字段
        if (!action) {
            return NextResponse.json(
                { error: '操作类型不能为空' },
                { status: 400 }
            );
        }

        // 获取客户端IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

        // 创建日志记录
        const log = await prisma.systemLog.create({
            data: {
                userId: currentUser.id,
                action,
                details: details || null,
                ipAddress
            },
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

        return NextResponse.json(
            { message: '日志记录成功', log },
            { status: 201 }
        );
    } catch (error) {
        console.error('记录系统日志失败:', error);
        return NextResponse.json(
            { error: '记录系统日志失败' },
            { status: 500 }
        );
    }
<<<<<<< HEAD
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
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
} 