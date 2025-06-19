import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from "zod";

// 创建Prisma客户端实例
const prismaClient = new PrismaClient();

// 用户输入验证
const userSchema = z.object({
    name: z.string().min(2, { message: "姓名至少需要2个字符" }),
    email: z.string().email({ message: "请提供有效的邮箱地址" }),
    password: z.string().min(6, { message: "密码至少需要6个字符" }).optional(),
    role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
});

// 获取当前用户会话
async function getCurrentUser(req: NextRequest) {
    const userSession = req.cookies.get('user_session')?.value;

    if (!userSession) {
        return null;
    }

    try {
        // 解析用户会话
        return JSON.parse(userSession);
    } catch (error) {
        console.error('解析会话错误:', error);
        return null;
    }
}

// 获取用户列表
export async function GET(request: NextRequest) {
    try {
        // 验证用户登录
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 获取查询参数
        const url = new URL(request.url);
        const role = url.searchParams.get('role');
        const courseId = url.searchParams.get('courseId');

        // 构建查询条件
        let users = [];

        // 如果是管理员，可以查看所有用户
        if (currentUser.role === 'ADMIN') {
            // 根据角色参数筛选
            const whereCondition: any = {};
            if (role) {
                whereCondition.role = role;
            }

            users = await prisma.user.findMany({
                where: whereCondition,
                orderBy: {
                    name: 'asc',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    avatarUrl: true,
                    classId: true,
                }
            });
        }
        // 如果是教师，查询其教授课程的学生，或者其他教师，或者管理员
        else if (currentUser.role === 'TEACHER') {
            if (role === 'STUDENT') {
                // 查询该教师教授的课程
                const teacherCourses = await prisma.course.findMany({
                    where: {
                        users: {
                            some: {
                                id: currentUser.id
                            }
                        }
                    },
                    include: {
                        enrollments: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                        avatarUrl: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        classId: true,
                                    }
                                }
                            },
                            where: {
                                user: {
                                    role: 'STUDENT'
                                }
                            }
                        }
                    }
                });

                // 如果指定了课程ID，只返回该课程的学生
                if (courseId && courseId !== 'all') {
                    const specificCourse = teacherCourses.find(course => course.id === courseId);
                    users = specificCourse
                        ? specificCourse.enrollments.map(enrollment => enrollment.user)
                        : [];
                } else {
                    // 收集所有学生并去重
                    const allStudents: Array<any> = [];
                    teacherCourses.forEach(course => {
                        course.enrollments.forEach(enrollment => {
                            if (enrollment.user && !allStudents.some(s => s.id === enrollment.user.id)) {
                                allStudents.push(enrollment.user);
                            }
                        });
                    });
                    users = allStudents;
                }
            } else if (role === 'TEACHER') {
                // 查询所有教师，除了自己
                users = await prisma.user.findMany({
                    where: {
                        role: 'TEACHER',
                        id: { not: currentUser.id }
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        avatarUrl: true,
                        classId: true,
                    }
                });
            } else if (role === 'ADMIN') {
                // 查询所有管理员
                users = await prisma.user.findMany({
                    where: {
                        role: 'ADMIN'
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        avatarUrl: true,
                        classId: true,
                    }
                });
            } else {
                // 默认返回所有用户（除了学生外）
                users = await prisma.user.findMany({
                    where: {
                        role: { not: 'STUDENT' }
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        avatarUrl: true,
                        classId: true,
                    }
                });
            }
        }
        // 如果是学生，查询其课程的教师，或者管理员，或其他同学
        else if (currentUser.role === 'STUDENT') {
            if (role === 'TEACHER') {
                // 查询学生所选课程的教师
                const studentCourses = await prisma.enrollment.findMany({
                    where: {
                        userId: currentUser.id
                    },
                    include: {
                        course: {
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                        avatarUrl: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        classId: true,
                                    },
                                    where: {
                                        role: 'TEACHER'
                                    }
                                }
                            }
                        }
                    }
                });

                // 如果指定了课程ID，只返回该课程的教师
                if (courseId && courseId !== 'all') {
                    const specificCourse = studentCourses.find(enrollment => enrollment.courseId === courseId);
                    users = specificCourse ? specificCourse.course.users : [];
                } else {
                    // 收集所有教师并去重
                    const allTeachers: Array<any> = [];
                    studentCourses.forEach(enrollment => {
                        enrollment.course.users.forEach(teacher => {
                            if (!allTeachers.some(t => t.id === teacher.id)) {
                                allTeachers.push(teacher);
                            }
                        });
                    });
                    users = allTeachers;
                }
            } else if (role === 'STUDENT') {
                // 查询同一课程的其他学生
                const studentEnrollments = await prisma.enrollment.findMany({
                    where: {
                        userId: currentUser.id
                    },
                    select: {
                        courseId: true
                    }
                });

                const courseIds = studentEnrollments.map(e => e.courseId);

                // 如果指定了课程ID，只查询特定课程的学生
                if (courseId && courseId !== 'all') {
                    if (courseIds.includes(courseId)) {
                        const courseStudents = await prisma.enrollment.findMany({
                            where: {
                                courseId: courseId,
                                user: {
                                    role: 'STUDENT',
                                    id: { not: currentUser.id }
                                }
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                        avatarUrl: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        classId: true,
                                    }
                                },
                                course: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        });

                        // 合并用户与课程信息
                        users = courseStudents.map(e => ({
                            ...e.user,
                            course: e.course
                        }));
                    } else {
                        users = [];
                    }
                } else {
                    // 查询所有选修相同课程的学生
                    const courseStudents = await prisma.enrollment.findMany({
                        where: {
                            courseId: { in: courseIds },
                            user: {
                                role: 'STUDENT',
                                id: { not: currentUser.id }
                            }
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true,
                                    avatarUrl: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    classId: true,
                                }
                            },
                            course: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            }
                        }
                    });

                    // 去重时需要保留课程信息
                    const uniqueStudents: any[] = [];
                    const seenIds = new Set();

                    courseStudents.forEach(enrollment => {
                        if (!seenIds.has(enrollment.user.id)) {
                            seenIds.add(enrollment.user.id);
                            uniqueStudents.push({
                                ...enrollment.user,
                                course: enrollment.course
                            });
                        }
                    });

                    users = uniqueStudents;
                }
            } else if (role === 'ADMIN') {
                // 查询所有管理员
                users = await prisma.user.findMany({
                    where: {
                        role: 'ADMIN'
                    },
                    orderBy: {
                        name: 'asc',
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        avatarUrl: true,
                        classId: true,
                    }
                });
            } else {
                // 默认情况：查询学生所选课程的教师和管理员
                const teachers = await prisma.enrollment.findMany({
                    where: {
                        userId: currentUser.id
                    },
                    include: {
                        course: {
                            include: {
                                users: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                        avatarUrl: true,
                                        createdAt: true,
                                        updatedAt: true,
                                        classId: true,
                                    },
                                    where: {
                                        role: 'TEACHER'
                                    }
                                }
                            }
                        }
                    }
                });

                const admins = await prisma.user.findMany({
                    where: {
                        role: 'ADMIN'
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        avatarUrl: true,
                        classId: true,
                    }
                });

                // 合并教师和管理员，并去重
                const allUsers = [...admins];
                teachers.forEach(enrollment => {
                    enrollment.course.users.forEach(teacher => {
                        if (!allUsers.some(user => user.id === teacher.id)) {
                            allUsers.push(teacher);
                        }
                    });
                });

                users = allUsers;
            }
        }

        // 对结果按名称排序
        users.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
    }
}

// 添加新用户
export async function POST(request: NextRequest) {
    try {
        // 使用getCurrentUser替代getServerSession
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 检查是否具有管理员权限
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
        }

        // 获取用户提交的数据
        const body = await request.json();

        // 验证用户输入
        const validationResult = userSchema.safeParse(body);
        if (!validationResult.success) {
            const errors = validationResult.error.format();
            return NextResponse.json({ error: "输入验证失败", details: errors }, { status: 400 });
        }

        // 密码处理
        if (!body.password) {
            return NextResponse.json({ error: "新用户必须提供密码" }, { status: 400 });
        }

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (existingUser) {
            return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
        }

        // 使用bcryptjs直接加密密码，而不是使用不存在的hashPassword函数
        const hashedPassword = await bcryptjs.hash(body.password, 10);

        // 创建用户
        const newUser = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: hashedPassword,
                role: body.role,
                avatarUrl: body.avatarUrl || null,
                classId: body.classId || null,
            },
        });

        // 返回不包含密码的用户信息
        const { password, ...userWithoutPassword } = newUser;
        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('创建用户错误:', error);
        return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
    }
}

// 更新用户
export async function PUT(request: NextRequest) {
    try {
        // 使用getCurrentUser替代getServerSession
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 获取用户提交的数据
        const body = await request.json();

        // 验证用户ID
        if (!body.id) {
            return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
        }

        // 权限检查：只允许管理员或用户自己修改信息
        const isAdmin = currentUser.role === 'ADMIN';
        const isSelf = currentUser.id === body.id;

        if (!isAdmin && !isSelf) {
            return NextResponse.json({ error: "没有权限修改此用户" }, { status: 403 });
        }

        // 如果非管理员，不允许修改角色
        if (!isAdmin && body.role && currentUser.role !== body.role) {
            return NextResponse.json({ error: "非管理员不能修改用户角色" }, { status: 403 });
        }

        // 构建更新数据
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.email) updateData.email = body.email;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (isAdmin && body.role) updateData.role = body.role;
        if (isAdmin && body.classId !== undefined) updateData.classId = body.classId;

        // 如果提供了新密码，进行密码更新，使用bcryptjs直接加密
        if (body.password) {
            updateData.password = await bcryptjs.hash(body.password, 10);
        }

        // 检查邮箱是否已被其他用户使用
        if (body.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: body.email,
                    NOT: {
                        id: body.id
                    }
                }
            });

            if (existingUser) {
                return NextResponse.json({ error: "该邮箱已被其他用户使用" }, { status: 400 });
            }
        }

        // 更新用户信息
        const updatedUser = await prisma.user.update({
            where: {
                id: body.id,
            },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                avatarUrl: true,
                classId: true,
            }
        });

        return NextResponse.json({ user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        return NextResponse.json({ error: "更新用户信息失败" }, { status: 500 });
    }
}

// 删除用户
export async function DELETE(request: NextRequest) {
    try {
        // 使用getCurrentUser替代getServerSession
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 检查是否具有管理员权限
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
        }

        // 获取用户ID
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
        }

        // 不允许删除自己
        if (currentUser.id === id) {
            return NextResponse.json({ error: "不能删除当前登录的用户" }, { status: 400 });
        }

        // 删除用户
        await prisma.user.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({ message: "用户已成功删除" }, { status: 200 });
    } catch (error) {
        console.error('删除用户错误:', error);
        return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
    }
} 