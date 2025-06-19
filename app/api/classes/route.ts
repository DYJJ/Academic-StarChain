import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';

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

// 获取班级列表
export async function GET(request: NextRequest) {
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

        // 查询参数
        const { searchParams } = new URL(request.url);
        const withStudents = searchParams.get('withStudents') === 'true';

        // 查询班级列表
        const classes = await prisma.classes.findMany({
            include: {
                users: withStudents ? true : false
            }
        });

        return NextResponse.json({ classes });
    } catch (error) {
        console.error('获取班级列表失败:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 添加班级
export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '只有管理员可以添加班级' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, year } = body;

        // 验证必填字段
        if (!name || !year) {
            return NextResponse.json(
                { error: '班级名称和年级为必填项' },
                { status: 400 }
            );
        }

        // 创建班级
        const newClass = await prisma.classes.create({
            data: {
                id: crypto.randomUUID(), // 生成随机UUID作为ID
                name,
                description,
                year,
                updatedAt: new Date() // 添加更新时间
            }
        });

        // 记录操作日志
        try {
            // 获取客户端IP
            const forwardedFor = request.headers.get('x-forwarded-for');
            const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

            // 记录操作日志
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '添加班级',
                    details: `添加班级: ${name} (${year})`,
                    ipAddress
                }
            });
        } catch (logError) {
            console.error('记录添加班级日志失败:', logError);
        }

        return NextResponse.json(
            { message: '班级添加成功', class: newClass },
            { status: 201 }
        );
    } catch (error) {
        console.error('添加班级失败:', error);
        return NextResponse.json(
            { error: '添加班级失败' },
            { status: 500 }
        );
    }
}

// 更新班级
export async function PUT(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '只有管理员可以更新班级' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, name, description, year } = body;

        // 验证必填字段
        if (!id) {
            return NextResponse.json(
                { error: '缺少班级ID' },
                { status: 400 }
            );
        }

        // 检查班级是否存在
        const existingClass = await prisma.classes.findUnique({
            where: { id },
            include: {
                users: true
            }
        });

        if (!existingClass) {
            return NextResponse.json(
                { error: '班级不存在' },
                { status: 404 }
            );
        }

        // 更新班级信息
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (year !== undefined) updateData.year = year;

        const updatedClass = await prisma.classes.update({
            where: { id },
            data: updateData
        });

        // 记录操作日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '更新班级',
                    details: `更新班级: ${updatedClass.name} (${updatedClass.year})`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });
        } catch (logError) {
            console.error('记录更新班级日志失败:', logError);
        }

        return NextResponse.json({
            message: '班级更新成功',
            class: updatedClass
        });
    } catch (error) {
        console.error('更新班级失败:', error);
        return NextResponse.json(
            { error: '更新班级失败' },
            { status: 500 }
        );
    }
}

// 删除班级
export async function DELETE(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '只有管理员可以删除班级' },
                { status: 403 }
            );
        }

        // 获取班级ID
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: '缺少班级ID' },
                { status: 400 }
            );
        }

        // 检查班级是否存在
        const existingClass = await prisma.classes.findUnique({
            where: { id },
            include: {
                users: true
            }
        });

        if (!existingClass) {
            return NextResponse.json(
                { error: '班级不存在' },
                { status: 404 }
            );
        }

        // 检查班级是否有学生
        if (existingClass.users.length > 0) {
            return NextResponse.json(
                { error: '无法删除有学生的班级，请先移除班级中的所有学生' },
                { status: 400 }
            );
        }

        // 删除班级
        await prisma.classes.delete({
            where: { id }
        });

        // 记录操作日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '删除班级',
                    details: `删除班级: ${existingClass.name} (${existingClass.year})`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });
        } catch (logError) {
            console.error('记录删除班级日志失败:', logError);
        }

        return NextResponse.json({
            message: '班级删除成功'
        });
    } catch (error) {
        console.error('删除班级失败:', error);
        return NextResponse.json(
            { error: '删除班级失败' },
            { status: 500 }
        );
    }
} 