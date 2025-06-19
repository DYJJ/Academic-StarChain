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

        // 获取查询参数
        const url = new URL(req.url);
        const conversationId = url.searchParams.get('conversationId');
        const otherUserId = url.searchParams.get('otherUserId');

        if (conversationId) {
            // 如果提供了conversationId，获取该对话的所有消息
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
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
                    }
                }
            });

            if (!conversation) {
                return NextResponse.json(
                    { error: '对话不存在' },
                    { status: 404 }
                );
            }

            // 检查当前用户是否为该对话的参与者
            const isParticipant = conversation.participants.some(
                p => p.userId === currentUserId
            );

            if (!isParticipant) {
                return NextResponse.json(
                    { error: '无权访问此对话' },
                    { status: 403 }
                );
            }

            // 获取该对话的所有消息
            const messages = await prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
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

            // 将当前用户在该对话中的未读消息标记为已读
            await prisma.message.updateMany({
                where: {
                    conversationId,
                    receiverId: currentUserId,
                    isRead: false
                },
                data: { isRead: true }
            });

            return NextResponse.json({
                conversation,
                messages
            });
        } else if (otherUserId) {
            // 如果提供了otherUserId，查找或创建与该用户的对话
            // 先查找是否存在包含这两个用户的对话
            const existingConversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        every: {
                            userId: {
                                in: [currentUserId, otherUserId]
                            }
                        }
                    },
                    participants: {
                        none: {
                            userId: {
                                notIn: [currentUserId, otherUserId]
                            }
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
                    }
                }
            });

            if (existingConversations.length > 0) {
                const conversation = existingConversations[0];

                // 获取该对话的所有消息
                const messages = await prisma.message.findMany({
                    where: { conversationId: conversation.id },
                    orderBy: { createdAt: 'asc' },
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

                // 将当前用户在该对话中的未读消息标记为已读
                await prisma.message.updateMany({
                    where: {
                        conversationId: conversation.id,
                        receiverId: currentUserId,
                        isRead: false
                    },
                    data: { isRead: true }
                });

                return NextResponse.json({
                    conversation,
                    messages
                });
            } else {
                // 如果不存在，创建新对话
                const otherUser = await prisma.user.findUnique({
                    where: { id: otherUserId },
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        avatarUrl: true
                    }
                });

                if (!otherUser) {
                    return NextResponse.json(
                        { error: '用户不存在' },
                        { status: 404 }
                    );
                }

                const newConversation = await prisma.conversation.create({
                    data: {
                        participants: {
                            create: [
                                { userId: currentUserId },
                                { userId: otherUserId }
                            ]
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
                        }
                    }
                });

                return NextResponse.json({
                    conversation: newConversation,
                    messages: []
                });
            }
        } else {
            // 如果没有提供conversationId或otherUserId，获取当前用户的所有对话
            const userConversations = await prisma.userConversation.findMany({
                where: { userId: currentUserId },
                include: {
                    conversation: {
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
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    }
                },
                orderBy: {
                    conversation: {
                        lastMessageAt: 'desc'
                    }
                }
            });

            // 获取每个对话的未读消息数量
            const conversationsWithUnreadCount = await Promise.all(
                userConversations.map(async (uc) => {
                    const unreadCount = await prisma.message.count({
                        where: {
                            conversationId: uc.conversationId,
                            receiverId: currentUserId,
                            isRead: false
                        }
                    });

                    return {
                        ...uc,
                        unreadCount
                    };
                })
            );

            return NextResponse.json(conversationsWithUnreadCount);
        }
    } catch (error) {
        console.error('获取消息列表时出错:', error);
        return NextResponse.json(
            { error: '获取消息列表时出错' },
            { status: 500 }
        );
    }
} 