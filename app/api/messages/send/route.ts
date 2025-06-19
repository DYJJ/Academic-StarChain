import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function POST(req: NextRequest) {
    try {
        // 获取当前用户会话信息
        const user = await getCurrentUser(req);
        if (!user || !user.id) {
            return NextResponse.json(
                { error: '未授权访问' },
                { status: 401 }
            );
        }

        const currentUserId = user.id;
        const body = await req.json();
        const { content, conversationId, receiverId } = body;

        if (!content) {
            return NextResponse.json(
                { error: '消息内容不能为空' },
                { status: 400 }
            );
        }

        if (conversationId) {
            // 检查对话是否存在，以及当前用户是否为参与者
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: true
                }
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: '对话不存在' },
                    { status: 404 }
                );
            }

            const isParticipant = conversation.participants.some(
                (p: { userId: string }) => p.userId === currentUserId
            );

            if (!isParticipant) {
                return NextResponse.json(
                    { error: '您不是该对话的参与者' },
                    { status: 403 }
                );
            }

            // 找到对话中的另一个用户
            const otherParticipant = conversation.participants.find(
                (p: { userId: string }) => p.userId !== currentUserId
            );

            if (!otherParticipant) {
                return NextResponse.json(
                    { error: '无法确定接收者' },
                    { status: 400 }
                );
            }

            // 发送消息
            const message = await prisma.message.create({
                data: {
                    content,
                    senderId: currentUserId,
                    receiverId: otherParticipant.userId,
                    conversationId
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            avatarUrl: true
                        }
                    }
                }
            });

            // 更新对话的最后消息时间
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }
            });

            return NextResponse.json(message);
        } else if (receiverId) {
            // 确保接收者存在
            const receiver = await prisma.user.findUnique({
                where: { id: receiverId }
            });

            if (!receiver) {
                return NextResponse.json(
                    { error: '接收者不存在' },
                    { status: 404 }
                );
            }

            // 查找是否已有与该用户的对话
            const existingConversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        every: {
                            userId: {
                                in: [currentUserId, receiverId]
                            }
                        }
                    }
                }
            });

            let conversation;

            if (existingConversations.length > 0) {
                conversation = existingConversations[0];
            } else {
                // 如果没有，创建新对话
                conversation = await prisma.conversation.create({
                    data: {
                        participants: {
                            create: [
                                { userId: currentUserId },
                                { userId: receiverId }
                            ]
                        }
                    }
                });
            }

            // 发送消息
            const message = await prisma.message.create({
                data: {
                    content,
                    senderId: currentUserId,
                    receiverId,
                    conversationId: conversation.id
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            avatarUrl: true
                        }
                    }
                }
            });

            // 更新对话的最后消息时间
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            return NextResponse.json({
                message,
                conversation
            });
        } else {
            return NextResponse.json(
                { error: '必须提供conversationId或receiverId' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('处理请求时发生错误:', error);
        return NextResponse.json(
            { error: '处理请求时发生错误' },
            { status: 500 }
        );
    }
} 