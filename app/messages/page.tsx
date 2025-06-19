'use client';

import React, { useEffect, useState } from 'react';
import { Card, List, Avatar, Badge, Spin, Empty, Typography, Divider } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface User {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
}

interface Conversation {
    id: string;
    title?: string;
    lastMessageAt: string;
    participants: {
        userId: string;
        user: User;
    }[];
    messages: {
        id: string;
        content: string;
        createdAt: string;
    }[];
}

interface ConversationWithUnreadCount {
    conversationId: string;
    userId: string;
    conversation: Conversation;
    unreadCount: number;
}

const MessagesPage: React.FC = () => {
    const [conversations, setConversations] = useState<ConversationWithUnreadCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const router = useRouter();

    // 获取当前用户信息
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data.user);
                }
            } catch (error) {
                console.error('获取当前用户信息失败:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) return; // 确保有当前用户信息

            try {
                setLoading(true);
                const response = await fetch('/api/messages');

                if (!response.ok) {
                    throw new Error('获取对话列表失败');
                }

                const data = await response.json();
                setConversations(data);
            } catch (err: any) {
                console.error('获取对话出错:', err);
                setError(err.message || '获取对话列表时出错');
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser]);

    // 获取对话中的另一个用户
    const getOtherParticipant = (conversation: Conversation) => {
        if (!currentUser) return null;

        const otherParticipant = conversation.participants.find(p =>
            p.userId !== currentUser.id
        )?.user;

        return otherParticipant;
    };

    // 格式化日期时间
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            // 今天 - 显示时间
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays === 1) {
            // 昨天
            return '昨天';
        } else if (diffInDays < 7) {
            // 一周内 - 显示星期几
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            return weekdays[date.getDay()];
        } else {
            // 超过一周 - 显示日期
            return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        }
    };

    const handleConversationClick = (conversationId: string) => {
        router.push(`/messages/${conversationId}`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <Spin size="large" tip="加载消息列表..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Title level={4} style={{ color: '#ff4d4f' }}>出错了</Title>
                <Text type="secondary">{error}</Text>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <MessageOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <span>我的消息</span>
                    </div>
                }
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
                {conversations.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={conversations}
                        renderItem={item => {
                            const otherUser = getOtherParticipant(item.conversation);
                            const lastMessage = item.conversation.messages[0];

                            return (
                                <List.Item
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleConversationClick(item.conversation.id)}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Badge count={item.unreadCount} size="small">
                                                <Avatar
                                                    src={otherUser?.avatarUrl}
                                                    icon={!otherUser?.avatarUrl && <UserOutlined />}
                                                    style={{ backgroundColor: !otherUser?.avatarUrl ? '#1890ff' : undefined }}
                                                />
                                            </Badge>
                                        }
                                        title={
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text strong>{otherUser?.name || '未知用户'}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {item.conversation.lastMessageAt && formatDateTime(item.conversation.lastMessageAt)}
                                                </Text>
                                            </div>
                                        }
                                        description={
                                            <Text
                                                type="secondary"
                                                ellipsis
                                                style={{ maxWidth: '80%', display: 'inline-block' }}
                                            >
                                                {lastMessage?.content || '暂无消息'}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                ) : (
                    <Empty
                        description={
                            <div style={{ margin: '20px 0' }}>
                                <p>您还没有任何对话</p>
                                <p>使用下方的"快速联系"开始一个新对话</p>
                            </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}
            </Card>

            <Divider orientation="left">快速联系</Divider>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* 始终显示可用的联系选项，无论当前用户角色如何 */}
                {currentUser?.role === 'STUDENT' && (
                    <>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=TEACHER')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#1890ff', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系我的老师</Title>
                                <Text type="secondary">向您的课程老师发送消息</Text>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=STUDENT')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#52c41a', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系同学</Title>
                                <Text type="secondary">与其他学生交流互动</Text>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=ADMIN')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#722ed1', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系管理员</Title>
                                <Text type="secondary">需要帮助? 联系系统管理员</Text>
                            </div>
                        </Card>
                    </>
                )}

                {currentUser?.role === 'TEACHER' && (
                    <>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=STUDENT')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#52c41a', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系我的学生</Title>
                                <Text type="secondary">向您的课程学生发送消息</Text>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=ADMIN')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#722ed1', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系管理员</Title>
                                <Text type="secondary">需要帮助? 联系系统管理员</Text>
                            </div>
                        </Card>
                    </>
                )}

                {currentUser?.role === 'ADMIN' && (
                    <>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=TEACHER')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#1890ff', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系教师</Title>
                                <Text type="secondary">向教师发送消息</Text>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            style={{ width: 240 }}
                            onClick={() => router.push('/messages/new?role=STUDENT')}
                        >
                            <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                <Avatar
                                    style={{ backgroundColor: '#52c41a', marginBottom: 12 }}
                                    icon={<UserOutlined />}
                                    size={64}
                                />
                                <Title level={5}>联系学生</Title>
                                <Text type="secondary">向学生发送消息</Text>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessagesPage; 