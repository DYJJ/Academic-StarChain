import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';

// 从cookie获取当前用户信息
function getCurrentUser(request: NextRequest) {
    const cookieStore = cookies();
    const userSessionStr = cookieStore.get('user_session')?.value;

    if (!userSessionStr) {
        return null;
    }

    try {
        return JSON.parse(userSessionStr);
    } catch (error) {
        console.error('解析用户会话错误:', error);
        return null;
    }
}

// 获取单个班级详情
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { searchParams } = new URL(request.url);
        const withStudents = searchParams.get('withStudents') === 'true';

        // 查询班级详情
        const classInfo = await prisma.classes.findUnique({
            where: { id },
            include: {
                users: withStudents ? true : false
            }
        });

        if (!classInfo) {
            return NextResponse.json(
                { error: '班级不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ class: classInfo });
    } catch (error) {
        console.error('获取班级详情失败:', error);
        return NextResponse.json(
            { error: '获取班级详情失败' },
            { status: 500 }
        );
    }
} 