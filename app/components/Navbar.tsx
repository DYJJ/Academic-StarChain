'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Layout, Menu, Dropdown, Button, Avatar, Typography, Space,
    Drawer, Divider, message, Spin, Badge
} from 'antd';
import type { MenuProps } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    MenuOutlined,
    HomeOutlined,
    BookOutlined,
    FileTextOutlined,
    TeamOutlined,
    SettingOutlined,
    ProfileOutlined,
    DashboardOutlined,
    BarChartOutlined,
    AppstoreOutlined,
    BankOutlined,
    AuditOutlined,
    MessageOutlined,
    FileDoneOutlined,
    BellOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { LogAction, logAction } from '../utils/logger';
import { useChat } from './ChatProvider';

const { Header } = Layout;
const { Title, Text } = Typography;

type User = {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    avatarUrl?: string;
};

type MenuItem = Required<MenuProps>['items'][number];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { unreadCount } = useChat();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerVisible, setDrawerVisible] = useState(false);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) return;
                const data = await response.json();

                // 优先使用API返回的头像
                if (data.user && data.user.avatarUrl) {
                    setUser(data.user);
                    // 更新本地存储的头像
                    localStorage.setItem('userAvatar', data.user.avatarUrl);
                } else {
                    // 如果API没有返回头像，检查本地存储
                    const cachedAvatarUrl = localStorage.getItem('userAvatar');
                    if (cachedAvatarUrl && data.user && cachedAvatarUrl.includes(`userId=${data.user.id}`)) {
                        data.user.avatarUrl = cachedAvatarUrl;
                        setUser(data.user);
                    } else {
                        setUser(data.user);
                    }
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();

        // 添加事件监听器，当头像更新时刷新用户数据
        const handleProfileUpdate = (event: CustomEvent) => {
            if (event.detail?.avatarUrl && user?.id) {
                // 确保更新的头像URL包含当前用户的ID
                if (event.detail.avatarUrl.includes(`userId=${user.id}`)) {
                    setUser(prev => prev ? { ...prev, avatarUrl: event.detail.avatarUrl } : null);
                    localStorage.setItem('userAvatar', event.detail.avatarUrl);
                }
            } else {
                fetchUserData();
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
        };
    }, []);

    const handleLogout = async () => {
        try {
            if (user?.id) {
                await logAction(LogAction.AUTH, '用户退出登录', user.id);
            }

            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                message.success('退出登录成功');
                router.push('/login');
            } else {
                message.error('退出登录失败');
            }
        } catch (error) {
            console.error('退出登录失败:', error);
            message.error('操作失败，请重试');
        }
    };

    // 根据用户角色返回不同的菜单项
    const getMenuItems = () => {
        // 默认菜单项（学生）
        const menuItems = [
            {
                key: 'dashboard',
                label: <Link href="/dashboard">仪表板</Link>,
                icon: <DashboardOutlined />,
            },
            {
                key: 'courses',
                label: <Link href="/dashboard/my-courses">我的课程</Link>,
                icon: <BookOutlined />,
            },
            {
                key: 'messages',
                label: (
                    <Link href="/messages">
                        <Space>
                            我的私信
                            {unreadCount > 0 && (
                                <Badge count={unreadCount} size="small" />
                            )}
                        </Space>
                    </Link>
                ),
                icon: <MessageOutlined />,
            },
        ];

        // 教师特有菜单项
        if (user?.role === 'TEACHER') {
            menuItems.push(
                {
                    key: '/dashboard/my-students',
                    icon: <TeamOutlined />,
                    label: <Link href="/dashboard/my-students">学生管理</Link>,
                },
            );
        }

        // 管理员特有菜单项
        if (user?.role === 'ADMIN') {
            return [
                {
                    key: '/dashboard',
                    icon: <DashboardOutlined />,
                    label: <Link href="/dashboard">仪表板</Link>,
                },
                {
                    key: '/dashboard/users',
                    icon: <UserOutlined />,
                    label: <Link href="/dashboard/users">用户管理</Link>,
                },
                {
                    key: '/dashboard/courses',
                    icon: <BookOutlined />,
                    label: <Link href="/dashboard/courses">课程管理</Link>,
                },
                {
                    key: '/dashboard/grades',
                    icon: <BarChartOutlined />,
                    label: <Link href="/dashboard/grades">成绩管理</Link>,
                },
                {
                    key: '/dashboard/settings',
                    icon: <SettingOutlined />,
                    label: <Link href="/dashboard/settings">系统设置</Link>,
                },
            ];
        }

        // 学生端不显示账户设置
        if (user?.role === 'STUDENT') {
            // 已经包含在默认菜单中，不需要额外处理
        }

        return menuItems;
    };

    const userMenu = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/dashboard/profile">个人资料</Link>
        },
        ...(user?.role !== 'STUDENT' ? [{
            key: 'settings',
            icon: <SettingOutlined />,
            label: <Link href="/dashboard/settings">账户设置</Link>
        }] : []),
        {
            type: 'divider'
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout
        }
    ];

    return (
        <>
            <Header className="glass-navbar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                height: 64,
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', marginRight: 24 }}>
                        <Title level={4} style={{ margin: 0, fontSize: '18px', color: '#1677ff' }}>成绩认证系统</Title>
                    </Link>

                    {/* 仅在桌面端显示水平菜单 */}
                    <div className="desktop-menu" style={{ display: 'flex' }}>
                        <Menu
                            mode="horizontal"
                            selectedKeys={[pathname || '']}
                            style={{
                                minWidth: 400,
                                border: 'none',
                            }}
                            items={getMenuItems()}
                        />
                    </div>
                </div>

                {/* 用户信息和移动端菜单按钮 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {loading ? (
                        <Spin size="small" style={{ marginRight: 8 }} />
                    ) : user ? (
                        <Space>
                            <Dropdown menu={{ items: userMenu, onClick: ({ key }) => key === 'logout' && handleLogout() }} placement="bottomRight">
                                <Space style={{
                                    cursor: 'pointer',
                                    color: 'rgba(0, 0, 0, 0.85)',
                                    padding: '0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s',
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.025)',
                                    },
                                }}>
                                    <Avatar
                                        size="small"
                                        src={user.avatarUrl}
                                        icon={!user.avatarUrl && <UserOutlined />}
                                        style={{
                                            backgroundColor: !user.avatarUrl ? '#1677ff' : undefined,
                                            marginRight: 8
                                        }}
                                    />
                                    <span className="username">{user.name}</span>
                                </Space>
                            </Dropdown>
                            <Button
                                type="text"
                                icon={<MenuOutlined />}
                                onClick={() => setDrawerVisible(true)}
                                className="mobile-menu-button"
                                style={{
                                    display: 'none',
                                    '@media (max-width: 768px)': {
                                        display: 'block',
                                    },
                                }}
                            />
                        </Space>
                    ) : (
                        <Space>
                            <Button type="link" onClick={() => router.push('/login')}>登录</Button>
                            <Button type="primary" onClick={() => router.push('/register')}>注册</Button>
                        </Space>
                    )}
                </div>
            </Header>

            {/* 移动端菜单抽屉 */}
            <Drawer
                title="菜单"
                placement="right"
                closable={true}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={250}
            >
                <Menu
                    mode="vertical"
                    selectedKeys={[pathname || '']}
                    style={{ border: 'none' }}
                    items={getMenuItems()}
                />

                <Divider />

                {user && (
                    <div style={{ padding: '8px 16px' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Link href="/dashboard/profile" style={{ display: 'block', width: '100%' }}>
                                <Button icon={<UserOutlined />} style={{ width: '100%', textAlign: 'left' }}>
                                    个人资料
                                </Button>
                            </Link>

                            {user.role !== 'STUDENT' && (
                                <Link href="/dashboard/settings" style={{ display: 'block', width: '100%' }}>
                                    <Button icon={<SettingOutlined />} style={{ width: '100%', textAlign: 'left' }}>
                                        账户设置
                                    </Button>
                                </Link>
                            )}

                            <Button
                                danger
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                style={{ width: '100%', textAlign: 'left' }}
                            >
                                退出登录
                            </Button>
                        </Space>
                    </div>
                )}
            </Drawer>

            <style jsx>{`
                @media (max-width: 768px) {
                    .desktop-menu {
                        display: none !important;
                    }
                    .mobile-menu-button {
                        display: block !important;
                    }
                }
                @media (min-width: 769px) {
                    .desktop-menu {
                        display: flex !important;
                    }
                    .mobile-menu-button {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
} 