import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logAction } from '@/app/utils/logger';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});

// 默认头像配置
const DEFAULT_AVATARS = {
    STUDENT: '/avatars/default-student.svg',
    TEACHER: '/avatars/default-teacher.svg',
    ADMIN: '/avatars/default-admin.svg'
};

// 通过表单提交来处理
async function handleFormData(request: NextRequest) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;

    return { email, password, name, role };
}

// 通过JSON处理
async function handleJsonData(request: NextRequest) {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        try {
            const rawBody = await request.text();
            console.log('原始请求体:', rawBody);

            const body = JSON.parse(rawBody);
            return body;
        } catch (error) {
            console.error('JSON解析错误:', error);
            throw new Error('无效的JSON格式');
        }
    } else if (contentType.includes('multipart/form-data')) {
        return handleFormData(request);
    } else {
        console.error('不支持的内容类型:', contentType);
        throw new Error('不支持的内容类型');
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('注册API被调用');
        console.log('Content-Type:', request.headers.get('content-type'));

        // 尝试解析请求体
        const body = await handleJsonData(request);
        const { email, password, name, role } = body;

        // 检查内码
        const nameCodes = [];
        for (let i = 0; i < name.length; i++) {
            nameCodes.push(name.charCodeAt(i));
        }

        console.log('名称内码:', nameCodes);
        console.log('注册数据:', JSON.stringify({
            email,
            name,
            nameLength: name.length,
            role,
            passwordLength: password?.length
        }));

        // 基本验证
        if (!email || !password || !name || !role) {
            console.log('验证失败: 缺少必填字段', { email: !!email, password: !!password, name: !!name, role: !!role });
            return NextResponse.json(
                { error: '所有字段都是必填的' },
                { status: 400 }
            );
        }

        // 验证角色是否有效
        const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
        if (!validRoles.includes(role)) {
            console.log('验证失败: 无效的角色', { role });
            return NextResponse.json(
                { error: '无效的用户角色' },
                { status: 400 }
            );
        }

        // 检查用户是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('验证失败: 用户已存在', { email });
            return NextResponse.json(
                { error: '该邮箱已注册' },
                { status: 409 } // 409 Conflict
            );
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 获取对应角色的默认头像
        const defaultAvatarUrl = DEFAULT_AVATARS[role as keyof typeof DEFAULT_AVATARS];
        console.log('使用默认头像:', defaultAvatarUrl);

        // 创建用户
        try {
            console.log('正在创建用户，名称长度:', name.length);
            console.log('创建用户数据:', { email, name, role });

            const newUser = await prisma.user.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    name: name,
                    role: role,
                    avatarUrl: defaultAvatarUrl // 设置默认头像
                }
            });
            console.log('用户创建成功:', { id: newUser.id, email: newUser.email, name: newUser.name });

            // 记录注册操作
            try {
                // 获取客户端IP
                const forwardedFor = request.headers.get('x-forwarded-for');
                const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '未知IP';

                // 记录注册日志
                await prisma.systemLog.create({
                    data: {
                        userId: newUser.id,
                        action: '用户注册',
                        details: `注册账号 - ${email} (${role})`,
                        ipAddress
                    }
                });
                console.log('注册日志记录成功');
            } catch (logError) {
                console.error('记录注册日志失败:', logError);
                // 继续处理，不影响注册流程
            }

            // 返回用户信息（不包含密码）
            return NextResponse.json({
                message: '注册成功',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    avatarUrl: newUser.avatarUrl
                }
            });
        } catch (createError) {
            console.error('创建用户失败:', createError);
            return NextResponse.json(
                { error: '创建用户失败，请稍后再试' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('注册错误:', error);
        return NextResponse.json(
            { error: '注册过程中出现错误' },
            { status: 500 }
        );
    }
} 