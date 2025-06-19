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

// 添加学生到班级
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
                { error: '只有管理员可以添加学生到班级' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { classId, studentId } = body;

        // 验证必填字段
        if (!classId || !studentId) {
            return NextResponse.json(
                { error: '班级ID和学生ID为必填项' },
                { status: 400 }
            );
        }

        // 检查班级是否存在
        const existingClass = await prisma.classes.findUnique({
            where: { id: classId }
        });

        if (!existingClass) {
            return NextResponse.json(
                { error: '班级不存在' },
                { status: 404 }
            );
        }

        // 检查学生是否存在且是否为学生角色
        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return NextResponse.json(
                { error: '学生不存在' },
                { status: 404 }
            );
        }

        if (student.role !== 'STUDENT') {
            return NextResponse.json(
                { error: '只能将学生角色的用户添加到班级' },
                { status: 400 }
            );
        }

        // 更新学生的班级
        const updatedStudent = await prisma.user.update({
            where: { id: studentId },
            data: { classId }
        });

        // 记录操作日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '添加学生到班级',
                    details: `将学生 ${student.name} 添加到班级 ${existingClass.name}`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });
        } catch (logError) {
            console.error('记录添加学生到班级日志失败:', logError);
        }

        return NextResponse.json({
            message: '学生成功添加到班级',
            student: updatedStudent
        });
    } catch (error) {
        console.error('添加学生到班级失败:', error);
        return NextResponse.json(
            { error: '添加学生到班级失败' },
            { status: 500 }
        );
    }
}

// 从班级移除学生
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
                { error: '只有管理员可以从班级移除学生' },
                { status: 403 }
            );
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json(
                { error: '缺少学生ID' },
                { status: 400 }
            );
        }

        // 检查学生是否存在
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                classes: true
            }
        });

        if (!student) {
            return NextResponse.json(
                { error: '学生不存在' },
                { status: 404 }
            );
        }

        if (!student.classId) {
            return NextResponse.json(
                { error: '该学生未分配班级' },
                { status: 400 }
            );
        }

        const className = student.classes?.name || '';

        // 更新学生，移除班级关联
        const updatedStudent = await prisma.user.update({
            where: { id: studentId },
            data: { classId: null }
        });

        // 记录操作日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '从班级移除学生',
                    details: `将学生 ${student.name} 从班级 ${className} 移除`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });
        } catch (logError) {
            console.error('记录从班级移除学生日志失败:', logError);
        }

        return NextResponse.json({
            message: '学生已从班级移除',
            student: updatedStudent
        });
    } catch (error) {
        console.error('从班级移除学生失败:', error);
        return NextResponse.json(
            { error: '从班级移除学生失败' },
            { status: 500 }
        );
    }
}

// 批量将学生添加到班级
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
                { error: '只有管理员可以批量添加学生到班级' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { classId, studentIds } = body;

        // 验证必填字段
        if (!classId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json(
                { error: '班级ID和学生ID数组为必填项' },
                { status: 400 }
            );
        }

        // 检查班级是否存在
        const existingClass = await prisma.classes.findUnique({
            where: { id: classId }
        });

        if (!existingClass) {
            return NextResponse.json(
                { error: '班级不存在' },
                { status: 404 }
            );
        }

        // 检查所有学生是否存在且角色是否为学生
        const students = await prisma.user.findMany({
            where: {
                id: { in: studentIds }
            }
        });

        if (students.length !== studentIds.length) {
            return NextResponse.json(
                { error: '部分学生不存在' },
                { status: 404 }
            );
        }

        const nonStudents = students.filter(s => s.role !== 'STUDENT');
        if (nonStudents.length > 0) {
            return NextResponse.json(
                { error: '只能将学生角色的用户添加到班级' },
                { status: 400 }
            );
        }

        // 批量更新学生的班级
        const updatePromises = studentIds.map(id =>
            prisma.user.update({
                where: { id },
                data: { classId }
            })
        );

        await Promise.all(updatePromises);

        // 记录操作日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '批量添加学生到班级',
                    details: `将 ${studentIds.length} 名学生添加到班级 ${existingClass.name}`,
                    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
                }
            });
        } catch (logError) {
            console.error('记录批量添加学生到班级日志失败:', logError);
        }

        return NextResponse.json({
            message: `成功将 ${studentIds.length} 名学生添加到班级`
        });
    } catch (error) {
        console.error('批量添加学生到班级失败:', error);
        return NextResponse.json(
            { error: '批量添加学生到班级失败' },
            { status: 500 }
        );
    }
} 