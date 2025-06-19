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

export async function GET(req: NextRequest) {
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

        // 获取当前用户的所有未读消息数量
        const unreadCount = await prisma.message.count({
            where: {
                receiverId: currentUserId,
                isRead: false
            }
        });

        // 获取未读消息的会话
        const unreadConversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: currentUserId
                    }
                },
                messages: {
                    some: {
                        receiverId: currentUserId,
                        isRead: false
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                messages: {
                    where: {
                        receiverId: currentUserId,
                        isRead: false
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        // 获取最近的一条未读消息
        let latestMessage = null;
        let latestSender = null;

        if (unreadConversations.length > 0) {
            // 找出最近的未读消息
            let latestTime = new Date(0); // 初始化为最早的时间

            for (const conv of unreadConversations) {
                if (conv.messages.length > 0) {
                    const messageTime = new Date(conv.messages[0].createdAt);
                    if (messageTime > latestTime) {
                        latestTime = messageTime;
                        latestMessage = conv.messages[0];

                        // 找出发送者信息
                        const sender = conv.participants.find(p => p.userId === conv.messages[0].senderId)?.user;
                        if (sender) {
                            latestSender = sender;
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            unreadCount,
            latestMessage,
            latestSender,
            unreadConversations: unreadConversations.length
        });
    } catch (error) {
        console.error('获取未读消息出错:', error);
        return NextResponse.json(
            { error: '获取未读消息失败' },
            { status: 500 }
        );
    }
} 