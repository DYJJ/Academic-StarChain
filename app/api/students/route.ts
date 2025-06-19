import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { cookies } from 'next/headers';

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

// 获取学生列表
export async function GET(request: NextRequest) {
    try {
        // 获取当前用户
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未授权 - 请先登录' },
                { status: 401 }
            );
        }

        // 教师和管理员才能查看学生列表
        if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '禁止访问 - 没有权限' },
                { status: 403 }
            );
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // 构建查询条件
        let where: any = {
            role: 'STUDENT'
        };

        // 如果有搜索词
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } }
            ];
        }

        // 查询学生列表
        const students = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ students });
    } catch (error) {
        console.error('获取学生列表失败:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 