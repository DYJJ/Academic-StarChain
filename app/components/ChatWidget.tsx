'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Avatar, List, Input, Button, Badge, Typography, Divider, Spin, Empty } from 'antd';
import { MessageOutlined, UserOutlined, SendOutlined, CloseOutlined, ExpandOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useChat } from './ChatProvider';

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
    createdAt: string;
    senderId: string;
    sender: User;
}

interface Conversation {
    id: string;
    participants: {
        userId: string;
        user: User;
    }[];
    messages: Message[];
}

interface ConversationWithUnreadCount {
    conversationId: string;
    userId: string;
    conversation: Conversation;
    unreadCount: number;
}

const ChatWidget: React.FC = () => {
    const router = useRouter();
    const { unreadCount, setUnreadCount } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<ConversationWithUnreadCount[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // 获取对话列表
    useEffect(() => {
        const fetchConversations = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const response = await fetch('/api/messages');

                if (!response.ok) {
                    throw new Error('获取对话列表失败');
                }

                const data = await response.json();
                setConversations(data);
                
                // 计算总未读消息数
                const totalUnread = data.reduce((sum: number, conv: ConversationWithUnreadCount) => 
                    sum + conv.unreadCount, 0);
                setUnreadCount(totalUnread);
                
                // 如果有未读消息的对话且没有选中对话，默认选中第一个有未读消息的对话
                if (data.length > 0 && !selectedConversation) {
                    const unreadConv = data.find((c: ConversationWithUnreadCount) => c.unreadCount > 0);
                    if (unreadConv) {
                        setSelectedConversation(unreadConv.conversation.id);
                        fetchMessages(unreadConv.conversation.id);
                    }
                }
            } catch (err) {
                console.error('获取对话出错:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchConversations();
            
            // 每分钟刷新一次对话列表
            const intervalId = setInterval(fetchConversations, 60000);
            return () => clearInterval(intervalId);
        }
    }, [currentUser, selectedConversation, setUnreadCount]);

    // 获取指定对话的消息
    const fetchMessages = async (conversationId: string) => {
        if (!conversationId) return;

        try {
            const response = await fetch(`/api/messages?conversationId=${conversationId}`);

            if (!response.ok) {
                throw new Error('获取消息失败');
            }

            const data = await response.json();
            setMessages(data.messages || []);
            
            // 更新对话列表中的未读计数
            setConversations(prev => 
                prev.map(conv => 
                    conv.conversationId === conversationId 
                        ? { ...conv, unreadCount: 0 } 
                        : conv
                )
            );
            
            // 重新计算总未读消息数
            const currentUnreadCount = conversations.find(c => c.conversationId === conversationId)?.unreadCount || 0;
            setUnreadCount(Math.max(0, unreadCount - currentUnreadCount));
        } catch (err) {
            console.error('获取消息出错:', err);
        }
    };

    // 发送消息
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || !currentUser) return;

        try {
            setSending(true);
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: messageInput,
                    conversationId: selectedConversation,
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
        } catch (err) {
            console.error('发送消息出错:', err);
        } finally {
            setSending(false);
        }
    };

    // 滚动到最新消息
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 处理键盘事件，按Enter发送消息
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 获取对话中的另一个用户
    const getOtherParticipant = (conversation: Conversation) => {
        if (!currentUser) return null;

        const otherParticipant = conversation.participants.find(
            p => p.userId !== currentUser.id
        )?.user;

        return otherParticipant;
    };

    // 格式化消息时间
    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-widget-container">
            <div 
                className={`chat-window ${isExpanded ? 'expanded' : 'collapsed'}`}
                style={{ 
                    position: 'fixed', 
                    bottom: 20, 
                    right: 20, 
                    zIndex: 1000,
                    width: isExpanded ? 350 : 'auto',
                    height: isExpanded ? 500 : 'auto',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: isExpanded ? '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)' : 'none',
                    transformOrigin: 'bottom right'
                }}
            >
                {isExpanded ? (
                    <Card 
                        className="chat-card"
                        style={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            padding: 0, 
                            borderRadius: '8px', 
                            overflow: 'hidden'
                        }}
                        bodyStyle={{ 
                            padding: 0, 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            overflow: 'hidden' 
                        }}
                        title={
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '12px 16px 12px 16px',
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: '#fafafa' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <MessageOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                                    <Text strong>我的私信</Text>
                                    {unreadCount > 0 && (
                                        <Badge 
                                            count={unreadCount} 
                                            style={{ marginLeft: 8 }} 
                                        />
                                    )}
                                </div>
                                <Button 
                                    type="text" 
                                    icon={<CloseOutlined />} 
                                    onClick={() => setIsExpanded(false)}
                                    size="small"
                                    className="close-btn"
                                />
                            </div>
                        }
                        headStyle={{ padding: 0, margin: 0, border: 'none' }}
                    >
                        {selectedConversation ? (
                            // 显示选定的对话
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {conversations.find(c => c.conversationId === selectedConversation) && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar 
                                                    size="small" 
                                                    src={getOtherParticipant(conversations.find(c => c.conversationId === selectedConversation)!.conversation)?.avatarUrl}
                                                    icon={!getOtherParticipant(conversations.find(c => c.conversationId === selectedConversation)!.conversation)?.avatarUrl && <UserOutlined />}
                                                />
                                                <Text strong style={{ marginLeft: 8 }}>
                                                    {getOtherParticipant(conversations.find(c => c.conversationId === selectedConversation)!.conversation)?.name || '未知用户'}
                                                </Text>
                                            </div>
                                            <Button 
                                                type="link" 
                                                size="small" 
                                                onClick={() => {
                                                    setSelectedConversation(null);
                                                    setMessages([]);
                                                }}
                                            >
                                                返回
                                            </Button>
                                        </>
                                    )}
                                </div>
                                
                                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
                                    {messages.length > 0 ? (
                                        messages.map((message) => (
                                            <div 
                                                key={message.id}
                                                style={{ 
                                                    marginBottom: 16,
                                                    display: 'flex',
                                                    flexDirection: message.senderId === currentUser?.id ? 'row-reverse' : 'row',
                                                    alignItems: 'flex-start'
                                                }}
                                            >
                                                <Avatar 
                                                    size="small" 
                                                    src={message.sender.avatarUrl}
                                                    icon={!message.sender.avatarUrl && <UserOutlined />}
                                                    style={{ 
                                                        marginLeft: message.senderId === currentUser?.id ? 8 : 0,
                                                        marginRight: message.senderId === currentUser?.id ? 0 : 8,
                                                        backgroundColor: message.senderId === currentUser?.id ? '#1890ff' : '#f0f0f0'
                                                    }}
                                                />
                                                <div 
                                                    className={message.senderId === currentUser?.id ? "message-bubble sent" : "message-bubble received"}
                                                    style={{ 
                                                        padding: '10px 14px',
                                                        borderRadius: message.senderId === currentUser?.id ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                                                        maxWidth: '70%',
                                                        backgroundColor: message.senderId === currentUser?.id ? '#e6f7ff' : '#f5f5f5',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        border: message.senderId === currentUser?.id ? '1px solid #d6f0ff' : '1px solid #e8e8e8',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    <div>{message.content}</div>
                                                    <div style={{ fontSize: '0.8em', color: '#999', textAlign: 'right', marginTop: 4 }}>
                                                        {formatMessageTime(message.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <Empty description="暂无消息" style={{ margin: '30px 0' }} />
                                    )}
                                    <div ref={messagesEndRef}></div>
                                </div>
                                
                                <div style={{ 
                                    padding: '12px 16px', 
                                    borderTop: '1px solid #f0f0f0',
                                    backgroundColor: '#fafafa' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <TextArea
                                            value={messageInput}
                                            onChange={e => setMessageInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="输入消息..."
                                            autoSize={{ minRows: 1, maxRows: 3 }}
                                            style={{ 
                                                marginRight: 8, 
                                                flex: 1,
                                                borderRadius: '18px',
                                                padding: '8px 12px',
                                                resize: 'none'
                                            }}
                                        />
                                        <Button 
                                            type="primary" 
                                            icon={<SendOutlined />} 
                                            onClick={handleSendMessage} 
                                            loading={sending}
                                            shape="circle"
                                            style={{
                                                background: sending ? '' : 'linear-gradient(145deg, #1890ff, #36a9ff)',
                                                border: 'none',
                                                boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // 显示对话列表
                            <div style={{ height: '100%', overflow: 'auto' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Spin />
                                    </div>
                                ) : conversations.length > 0 ? (
                                    <List
                                        dataSource={conversations}
                                        renderItem={item => {
                                            const otherUser = getOtherParticipant(item.conversation);
                                            const lastMessage = item.conversation.messages[0];
                                            
                                            return (
                                                <List.Item 
                                                    className="conversation-item"
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        padding: '12px 16px',
                                                        borderLeft: item.unreadCount > 0 ? '3px solid #1890ff' : '3px solid transparent',
                                                        backgroundColor: item.unreadCount > 0 ? '#f0f7ff' : 'transparent',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedConversation(item.conversation.id);
                                                        fetchMessages(item.conversation.id);
                                                    }}
                                                >
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Badge count={item.unreadCount} size="small">
                                                                <Avatar 
                                                                    size="large"
                                                                    src={otherUser?.avatarUrl}
                                                                    icon={!otherUser?.avatarUrl && <UserOutlined />}
                                                                    style={{
                                                                        border: item.unreadCount > 0 ? '2px solid #1890ff' : '2px solid transparent',
                                                                        backgroundColor: !otherUser?.avatarUrl ? '#1890ff' : undefined,
                                                                    }}
                                                                />
                                                            </Badge>
                                                        }
                                                        title={
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <Text 
                                                                    strong={item.unreadCount > 0}
                                                                    style={{ 
                                                                        color: item.unreadCount > 0 ? '#1890ff' : undefined 
                                                                    }}
                                                                >
                                                                    {otherUser?.name || '未知用户'}
                                                                </Text>
                                                                {lastMessage?.createdAt && (
                                                                    <Text 
                                                                        type="secondary" 
                                                                        style={{ 
                                                                            fontSize: 12,
                                                                            color: item.unreadCount > 0 ? '#1890ff' : undefined,
                                                                            opacity: item.unreadCount > 0 ? 1 : 0.8
                                                                        }}
                                                                    >
                                                                        {formatMessageTime(lastMessage.createdAt)}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                        }
                                                        description={
                                                            <Text 
                                                                type="secondary" 
                                                                ellipsis 
                                                                style={{ 
                                                                    maxWidth: '100%',
                                                                    color: item.unreadCount > 0 ? '#1890ff' : undefined,
                                                                    fontWeight: item.unreadCount > 0 ? 600 : 400
                                                                }}
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
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <Empty description="暂无对话" />
                                        <Button 
                                            type="primary" 
                                            style={{ marginTop: 16 }}
                                            onClick={() => router.push('/messages/new')}
                                        >
                                            发起新对话
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                ) : (
                    <div className="chat-bubble-wrapper">
                        <div 
                            className="chat-bubble-container"
                            style={{
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Badge 
                                count={unreadCount} 
                                offset={[-5, 5]}
                                style={{ backgroundColor: '#ff4d4f' }}
                                className="unread-badge"
                            >
                                <Button 
                                    type="primary" 
                                    shape="circle"
                                    size="large"
                                    icon={<MessageOutlined style={{ fontSize: '22px' }} />}
                                    onClick={() => setIsExpanded(true)}
                                    className={unreadCount > 0 ? "pulse-button" : "chat-button"}
                                    style={{ 
                                        height: '64px', 
                                        width: '64px', 
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        background: 'linear-gradient(145deg, #1890ff, #36a9ff)',
                                        border: 'none'
                                    }}
                                />
                            </Badge>
                            {unreadCount > 0 && (
                                <div className="message-tooltip">
                                    <div className="message-tooltip-arrow"></div>
                                    <div className="message-tooltip-content">
                                        <span className="message-tooltip-count">{unreadCount}</span>
                                        <span className="message-tooltip-text">条未读消息</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                .chat-widget-container {
                    position: relative;
                }
                
                .chat-window {
                    perspective: 1000px;
                    will-change: transform, opacity, width, height;
                }
                
                .chat-window.expanded {
                    animation: expandChatWindow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                
                .chat-window.collapsed {
                    animation: collapseChatWindow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                
                .chat-bubble-wrapper {
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    animation: floatBubble 3s ease-in-out infinite;
                }
                
                .chat-card {
                    opacity: 0;
                    animation: showCard 0.4s ease forwards 0.1s;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                    border: none;
                }
                
                .chat-bubble-container {
                    transform: scale(1);
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .chat-bubble-container:hover {
                    transform: scale(1.05);
                }
                
                @keyframes expandChatWindow {
                    0% {
                        opacity: 0.5;
                        transform: scale(0.7);
                        border-radius: 50%;
                    }
                    30% {
                        border-radius: 25%;
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                        border-radius: 8px;
                    }
                }
                
                @keyframes collapseChatWindow {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                        border-radius: 8px;
                    }
                    70% {
                        opacity: 0.8;
                        border-radius: 25%;
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                        border-radius: 50%;
                    }
                }
                
                @keyframes showCard {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes floatBubble {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
                
                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 12px rgba(24, 144, 255, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
                    }
                }
                
                .pulse-button {
                    animation: pulse 2s infinite;
                }
                
                .chat-button:hover {
                    background: linear-gradient(145deg, #40a9ff, #1890ff) !important;
                    transform: rotate(15deg) scale(1.1);
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .unread-badge {
                    transition: all 0.3s ease;
                }
                
                .unread-badge:hover {
                    transform: scale(1.2);
                }
                
                .conversation-item:hover {
                    background-color: #f5f5f5 !important;
                }
                
                .message-tooltip {
                    position: absolute;
                    top: -38px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #fff;
                    padding: 6px 12px;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    white-space: nowrap;
                    animation: bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                    z-index: 1;
                }
                
                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, 20px) scale(0.8);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -5px) scale(1.05);
                    }
                    70% {
                        transform: translate(-50%, 2px) scale(0.95);
                    }
                    100% {
                        transform: translate(-50%, 0) scale(1);
                    }
                }
                
                .message-tooltip-content {
                    display: flex;
                    align-items: center;
                }
                
                .message-tooltip-count {
                    color: #ff4d4f;
                    font-weight: bold;
                    font-size: 14px;
                    margin-right: 2px;
                }
                
                .message-tooltip-text {
                    color: #333;
                    font-size: 13px;
                }
                
                .message-tooltip-arrow {
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid #fff;
                }
                
                @keyframes fadeRight {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes fadeLeft {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                .message-bubble.sent {
                    animation: fadeLeft 0.3s ease;
                }
                
                .message-bubble.received {
                    animation: fadeRight 0.3s ease;
                }
                
                .close-btn:hover {
                    background-color: #f0f0f0;
                    color: #ff4d4f;
                    transform: rotate(90deg);
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default ChatWidget; 