'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Avatar, Spin, Typography, Card, List, Divider, Empty } from 'antd';
import { SendOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface User {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    isRead: boolean;
    createdAt: string;
    sender: User;
}

interface Conversation {
    id: string;
    title?: string;
    lastMessageAt: string;
    participants: {
        userId: string;
        user: User;
    }[];
}

const ConversationPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // 获取当前用户信息
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data.user);
                    setCurrentUserId(data.user.id);
                }
            } catch (error) {
                console.error('获取当前用户信息失败:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    // 获取对话和消息
    useEffect(() => {
        const fetchConversation = async () => {
            if (!currentUserId) return; // 确保有当前用户ID

            try {
                setLoading(true);
                const response = await fetch(`/api/messages?conversationId=${conversationId}`);

                if (!response.ok) {
                    throw new Error('获取对话失败');
                }

                const data = await response.json();

                if (data) {
                    setConversation(data.conversation);
                    setMessages(data.messages || []);
                }
            } catch (err: any) {
                console.error('获取对话出错:', err);
                setError(err.message || '获取对话失败');
            } finally {
                setLoading(false);
            }
        };

        if (conversationId && currentUserId) {
            fetchConversation();
        }
    }, [conversationId, currentUserId]);

    // 滚动到最新消息
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 获取对话中的另一个用户
    const getOtherParticipant = () => {
        if (!conversation || !currentUserId) return null;

        return conversation.participants.find(
            p => p.userId !== currentUserId
        )?.user;
    };

    // 发送消息
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !conversationId || !currentUserId) return;

        try {
            setSending(true);
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: messageInput,
                    conversationId,
                }),
            });

            if (!response.ok) {
                throw new Error('发送消息失败');
            }

            const newMessage = await response.json();

            // 更新消息列表
            setMessages(prevMessages => [...prevMessages, newMessage]);
            // 清空输入框
            setMessageInput('');
        } catch (err: any) {
            console.error('发送消息出错:', err);
            alert(`发送失败: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    // 格式化消息时间
    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // 格式化消息日期（用于日期分割线）
    const formatMessageDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // 如果是今天
        if (date.toDateString() === today.toDateString()) {
            return '今天';
        }
        // 如果是昨天
        else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }
        // 其他日期
        else {
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    };

    // 判断是否需要显示日期分割线
    const shouldShowDateDivider = (index: number, messages: Message[]) => {
        if (index === 0) return true;

        const currentDate = new Date(messages[index].createdAt).toDateString();
        const prevDate = new Date(messages[index - 1].createdAt).toDateString();

        return currentDate !== prevDate;
    };

    // 处理键盘事件，按Enter发送消息
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const otherUser = getOtherParticipant();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <Spin size="large" tip="加载对话..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Title level={4} style={{ color: '#ff4d4f' }}>出错了</Title>
                <Text type="secondary">{error}</Text>
                <div style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={() => router.push('/messages')}>
                        返回消息列表
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
            <Card
                style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push('/messages')}
                            style={{ marginRight: 8 }}
                        />
                        <Avatar
                            src={otherUser?.avatarUrl}
                            icon={!otherUser?.avatarUrl && <UserOutlined />}
                            style={{ marginRight: 8, backgroundColor: !otherUser?.avatarUrl ? '#1890ff' : undefined }}
                        />
                        <span>{otherUser?.name || '未知用户'}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#8c8c8c' }}>
                            {otherUser?.role === 'TEACHER' ? '教师' : otherUser?.role === 'STUDENT' ? '学生' : ''}
                        </span>
                    </div>
                }
                bodyStyle={{ display: 'flex', flexDirection: 'column', padding: 0, height: '100%' }}
            >
                {/* 消息列表 */}
                <div style={{ flexGrow: 1, overflow: 'auto', padding: '16px' }}>
                    {messages.length > 0 ? (
                        <div>
                            {messages.map((message, index) => {
                                const isCurrentUser = message.sender.id === currentUserId;

                                // 判断是否需要显示日期分割线
                                const showDateDivider = shouldShowDateDivider(index, messages);

                                return (
                                    <React.Fragment key={message.id}>
                                        {showDateDivider && (
                                            <Divider plain style={{ margin: '12px 0' }}>
                                                <Text type="secondary">{formatMessageDate(message.createdAt)}</Text>
                                            </Divider>
                                        )}

                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                                                marginBottom: 16,
                                            }}
                                        >
                                            <Avatar
                                                src={message.sender.avatarUrl}
                                                icon={!message.sender.avatarUrl && <UserOutlined />}
                                                style={{
                                                    marginRight: isCurrentUser ? 0 : 8,
                                                    marginLeft: isCurrentUser ? 8 : 0,
                                                    backgroundColor: !message.sender.avatarUrl ?
                                                        (isCurrentUser ? '#1890ff' : '#52c41a') : undefined
                                                }}
                                            />

                                            <div style={{ maxWidth: '70%' }}>
                                                <div
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: 8,
                                                        backgroundColor: isCurrentUser ? '#e6f7ff' : '#f5f5f5',
                                                        display: 'inline-block',
                                                        marginBottom: 4,
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    <Text>{message.content}</Text>
                                                </div>
                                                <div style={{ textAlign: isCurrentUser ? 'right' : 'left' }}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {formatMessageTime(message.createdAt)}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <Empty
                            description="暂无消息，开始对话吧"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ margin: '40px 0' }}
                        />
                    )}
                </div>

                {/* 输入框 */}
                <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex' }}>
                        <TextArea
                            ref={textAreaRef}
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入消息..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            style={{
                                resize: 'none',
                                borderRadius: '18px',
                                padding: '8px 12px'
                            }}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<SendOutlined />}
                            loading={sending}
                            onClick={() => handleSendMessage()}
                            disabled={!messageInput.trim()}
                            style={{ marginLeft: 8, alignSelf: 'flex-end' }}
                        />
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {sending ? '发送中...' : ''}
                            {error ? `错误: ${error}` : ''}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            按Enter发送，Shift+Enter换行
                        </Text>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ConversationPage; 