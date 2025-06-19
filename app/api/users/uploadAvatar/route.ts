import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

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

export async function POST(request: NextRequest) {
    try {
        const currentUser = getCurrentUser(request);

        if (!currentUser) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const avatarFile = formData.get('avatar') as File;

        if (!avatarFile) {
            return NextResponse.json(
                { error: '没有上传文件' },
                { status: 400 }
            );
        }

        // 检查文件类型
        const fileType = avatarFile.type;
        if (!fileType.startsWith('image/')) {
            return NextResponse.json(
                { error: '只允许上传图片文件' },
                { status: 400 }
            );
        }

        // 读取文件内容
        const arrayBuffer = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        try {
            // 使用sharp库压缩图片
            const resizedImageBuffer = await sharp(buffer)
                .resize(200, 200) // 调整图片大小为200x200像素
                .jpeg({ quality: 80 }) // 降低质量到80%
                .toBuffer();

            // 转换为Base64
            const base64Image = `data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`;

            // 直接使用Base64编码的图片数据作为头像URL
            const uniqueAvatarUrl = base64Image;

            // 更新用户的头像URL，确保只更新当前用户的头像
            const updatedUser = await prisma.user.update({
                where: { id: currentUser.id },
                data: { avatarUrl: uniqueAvatarUrl }
            });

            // 更新cookie中的用户信息，包含新的头像URL
            const updatedUserSession = {
                ...currentUser,
                avatarUrl: uniqueAvatarUrl
            };

            cookies().set({
                name: 'user_session',
                value: JSON.stringify(updatedUserSession),
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24, // 24小时
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });

            return NextResponse.json({
                message: '头像上传成功',
                avatarUrl: uniqueAvatarUrl
            });
        } catch (processingError) {
            console.error('图片处理错误:', processingError);
            return NextResponse.json(
                { error: '图片处理失败' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('上传头像失败:', error);
        return NextResponse.json(
            { error: '上传头像失败' },
            { status: 500 }
        );
    }
}