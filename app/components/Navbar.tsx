'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layout, Menu, Dropdown, Button, Avatar, Typography, Space,
    Drawer, Divider, message
} from 'antd';
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
    DashboardOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { Header } = Layout;
const { Title, Text } = Typography;

type User = {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    avatarUrl?: string;
};

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerVisible, setDrawerVisible] = useState(false);

    useEffect(() => {
        async function fetchUserData() {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) return;
                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error('获取用户信息失败:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserData();

        // 添加事件监听器，当头像更新时刷新用户数据
        const handleProfileUpdate = () => {
            fetchUserData();
        };

        window.addEventListener('profile-updated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            router.push('/login?logout=true');
        } catch (error) {
            console.error('登出错误:', error);
            message.error('退出失败，请重试');
        }
    };

    // 管理员菜单项
    const adminMenuItems = [
        { key: 'dashboard', label: '仪表板', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'users', label: '用户管理', icon: <TeamOutlined />, path: '/dashboard/users' },
        { key: 'courses', label: '课程管理', icon: <BookOutlined />, path: '/dashboard/courses' },
        { key: 'grades', label: '成绩管理', icon: <FileTextOutlined />, path: '/dashboard/grades' },
        { key: 'settings', label: '系统设置', icon: <SettingOutlined />, path: '/dashboard/settings' },
    ];

    // 教师菜单项
    const teacherMenuItems = [
        { key: 'dashboard', label: '仪表板', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'my-courses', label: '我的课程', icon: <BookOutlined />, path: '/dashboard/my-courses' },
        { key: 'grades', label: '成绩管理', icon: <FileTextOutlined />, path: '/dashboard/grades' },
        { key: 'my-students', label: '学生管理', icon: <TeamOutlined />, path: '/dashboard/my-students' },
    ];

    // 学生菜单项
    const studentMenuItems = [
        { key: 'dashboard', label: '仪表板', icon: <DashboardOutlined />, path: '/dashboard' },
        { key: 'my-courses', label: '我的课程', icon: <BookOutlined />, path: '/dashboard/my-courses' },
        { key: 'grades', label: '我的成绩', icon: <FileTextOutlined />, path: '/dashboard/grades' },
        { key: 'transcript', label: '成绩单', icon: <FileTextOutlined />, path: '/dashboard/transcript' },
    ];

    // 根据用户角色获取对应菜单项
    const getMenuItems = () => {
        if (!user) return [];
        switch (user.role) {
            case 'ADMIN':
                return adminMenuItems;
            case 'TEACHER':
                return teacherMenuItems;
            case 'STUDENT':
                return studentMenuItems;
            default:
                return [];
        }
    };

    // 用户下拉菜单
    const userMenu = (
        <Menu>
            <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => router.push('/dashboard/profile')}>
                个人中心
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => router.push('/dashboard/settings')}>
                设置
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    // 移动端侧栏菜单内容
    const mobileMenuContent = (
        <div>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Space align="center">
                    <Avatar
                        size="large"
                        src={user?.avatarUrl}
                        icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
                        style={{
                            backgroundColor: !user?.avatarUrl ? (user?.role === 'ADMIN' ? '#f56a00' : user?.role === 'TEACHER' ? '#1677ff' : '#52c41a') : undefined
                        }}
                    />
                    <div>
                        <Text strong>{user?.name || '加载中...'}</Text>
                        <div>
                            <Text type="secondary">{user?.role === 'ADMIN' ? '管理员' : user?.role === 'TEACHER' ? '教师' : '学生'}</Text>
                        </div>
                    </div>
                </Space>
            </div>

            <Menu mode="inline" style={{ border: 'none' }}>
                {getMenuItems().map((item) => (
                    <Menu.Item key={item.key} icon={item.icon} onClick={() => { router.push(item.path); setDrawerVisible(false); }}>
                        {item.label}
                    </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => { router.push('/dashboard/profile'); setDrawerVisible(false); }}>
                    个人中心
                </Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                    退出登录
                </Menu.Item>
            </Menu>
        </div>
    );

    return (
        <Header style={{ padding: '0 24px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo 和标题 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        shape="square"
                        size={40}
                        style={{ backgroundColor: '#1677ff', marginRight: 10 }}
                        icon={<DashboardOutlined />}
                    />
                    <Title level={4} style={{ margin: 0, display: { xs: 'none', sm: 'inline-block' } }}>
                        学生成绩认证系统
                    </Title>
                </Link>
            </div>

            {/* 桌面端导航菜单 */}
            <div style={{ display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'center' }}>
                <Menu mode="horizontal" selectedKeys={[]} style={{ width: '100%', justifyContent: 'center', border: 'none' }}>
                    {getMenuItems().map((item) => (
                        <Menu.Item key={item.key} icon={item.icon}>
                            <Link href={item.path}>{item.label}</Link>
                        </Menu.Item>
                    ))}
                </Menu>
            </div>

            {/* 用户头像和信息 */}
            <div>
                {user ? (
                    <Space>
                        <Dropdown overlay={userMenu} placement="bottomRight" arrow>
                            <Space style={{ cursor: 'pointer', padding: '0 12px' }}>
                                <Avatar
                                    src={user.avatarUrl}
                                    icon={!user.avatarUrl ? <UserOutlined /> : undefined}
                                    style={{
                                        backgroundColor: !user.avatarUrl ? (user.role === 'ADMIN' ? '#f56a00' : user.role === 'TEACHER' ? '#1677ff' : '#52c41a') : undefined
                                    }}
                                />
                                <span style={{ display: { xs: 'none', sm: 'inline-block' } }}>{user.name}</span>
                            </Space>
                        </Dropdown>

                        {/* 移动端菜单按钮 */}
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            style={{ display: { xs: 'inline-block', md: 'none' } }}
                            onClick={() => setDrawerVisible(true)}
                        />
                    </Space>
                ) : (
                    <Button type="primary" onClick={() => router.push('/login')}>
                        登录
                    </Button>
                )}
            </div>

            {/* 移动端侧栏菜单 */}
            <Drawer
                title="菜单"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={280}
            >
                {mobileMenuContent}
            </Drawer>
        </Header>
    );
} 