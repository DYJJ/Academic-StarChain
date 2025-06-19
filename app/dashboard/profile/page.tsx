'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layout, Card, Avatar, Typography, Tabs, Table,
    Tag, Descriptions, Button, Divider, List, Spin,
    Space, Statistic, Row, Col, Timeline, message, Form, Input, Upload, Badge, Skeleton
} from 'antd';
import {
    UserOutlined, ClockCircleOutlined, EnvironmentOutlined,
    PhoneOutlined, MailOutlined, TeamOutlined, KeyOutlined,
    LockOutlined, LogoutOutlined, SettingOutlined,
    UploadOutlined, EditOutlined, IdcardOutlined, BankOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { LogAction, logAction } from '../../utils/logger';
import AvatarUpload from './components/AvatarUpload';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    phone?: string;
    studentId?: string;  // 学生学号
    teacherId?: string;  // 教师工号
    department?: string; // 院系
    class?: string;      // 班级（学生特有）
    major?: string;      // 专业（学生特有）
    title?: string;      // 职称（教师特有）
    office?: string;     // 办公室（教师特有）
    createdAt: string;
    updatedAt: string;
}

type LogEntry = {
    id: string;
    userId: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLogins: 0,
        lastLogin: '',
        actionsToday: 0,
        totalActions: 0,
    });
    const [passwordForm] = Form.useForm();
    const [profileForm] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');

    // 模拟用户数据
    const mockStudent: User = {
        id: '1',
        name: '李同学',
        email: 'student@example.com',
        role: 'STUDENT',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=1',
        phone: '13800138000',
        studentId: '2023010101',
        department: '计算机科学与技术学院',
        class: '计算机科学1班',
        major: '计算机科学与技术',
        createdAt: '2023-09-01',
        updatedAt: '2023-12-01'
    };

    const mockTeacher: User = {
        id: '2',
        name: '张教授',
        email: 'teacher@example.com',
        role: 'TEACHER',
        avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=2',
        phone: '13900139000',
        teacherId: 'T20230201',
        department: '计算机科学与技术学院',
        title: '副教授',
        office: '科技楼A区405',
        createdAt: '2023-09-01',
        updatedAt: '2023-12-01'
    };

    useEffect(() => {
        // 获取用户信息
        async function fetchData() {
            try {
                // 从API获取用户信息
                const response = await fetch('/api/auth/me');

                if (!response.ok) {
                    if (response.status === 401) {
                        // 未登录或会话已过期，重定向到登录页
                        router.push('/login');
                        return;
                    }
                    throw new Error('获取用户信息失败');
                }

                const data = await response.json();

                // 从localStorage中获取缓存的头像URL（与Navbar组件同步）
                const cachedAvatarUrl = localStorage.getItem('userAvatar');
                if (cachedAvatarUrl && data.user) {
                    data.user.avatar = cachedAvatarUrl;
                }

                setUser(data.user);
                setLoading(false);

                // 只有管理员才需要获取用户操作日志
                if (data.user.role === 'ADMIN') {
                    await fetchUserLogs(data.user.id);
                } else {
                    setLogsLoading(false);
                }

                // 获取用户统计信息
                await fetchUserStats(data.user.id);

                // 记录查看个人资料操作 - 放在最后，隔离API调用
                try {
                    await logAction(LogAction.USER_PROFILE, '查看个人资料', data.user.id);
                } catch (logError) {
                    console.error('记录日志失败:', logError);
                }
            } catch (err: any) {
                console.error('加载数据失败:', err);
                message.error(err.message || '加载数据失败');
                setLoading(false);
            }
        }

        fetchData();

        // 监听头像更新事件
        const handleProfileUpdate = (event: CustomEvent) => {
            if (event.detail?.avatarUrl) {
                setUser(prev => prev ? { ...prev, avatar: event.detail.avatarUrl } : null);
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate as EventListener);

        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
        };
    }, [router]);

    // 获取用户操作日志
    const fetchUserLogs = async (userId: string) => {
        try {
            setLogsLoading(true);
            const response = await fetch(`/api/logs?userId=${userId}&limit=50`);

            if (!response.ok) {
                throw new Error('获取用户操作日志失败');
            }

            const data = await response.json();
            setUserLogs(data.logs || []);
        } catch (err: any) {
            console.error('获取用户操作日志失败:', err);
            message.error('获取用户操作日志失败');
        } finally {
            setLogsLoading(false);
        }
    };

    // 获取用户统计信息
    const fetchUserStats = async (userId: string) => {
        let retryCount = 0;
        const maxRetries = 2;

        const tryFetchStats = async () => {
            try {
                setStatsLoading(true);
                const response = await fetch(`/api/users/${userId}/stats`);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`获取用户统计信息失败: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                setStats(data.stats || {
                    totalLogins: 0,
                    lastLogin: '',
                    actionsToday: 0,
                    totalActions: 0,
                });
                return true;
            } catch (err: any) {
                console.error('获取用户统计信息失败:', err);

                // 如果还有重试次数，则重试
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`重试获取用户统计 (${retryCount}/${maxRetries})...`);
                    return new Promise(resolve => setTimeout(() => resolve(tryFetchStats()), 1000));
                }

                // 失败时使用默认数据而不是模拟数据
                setStats({
                    totalLogins: 0,
                    lastLogin: '',
                    actionsToday: 0,
                    totalActions: 0,
                });

                message.error('获取用户统计信息失败，显示默认数据');
                return false;
            } finally {
                setStatsLoading(false);
            }
        };

        return tryFetchStats();
    };

    // 处理头像更新
    const handleAvatarChange = (newAvatarUrl: string) => {
        if (user) {
            // 确保头像URL包含用户ID
            if (!newAvatarUrl.includes(`userId=${user.id}`)) {
                console.warn('头像URL不包含用户ID，这可能导致问题');
                return;
            }

            // 更新用户状态
            setUser({
                ...user,
                avatar: newAvatarUrl
            });

            // 同步更新localStorage
            localStorage.setItem('userAvatar', newAvatarUrl);

            // 更新所有使用此用户头像的组件
            const profileUpdateEvent = new CustomEvent('profile-updated', {
                detail: { avatarUrl: newAvatarUrl, userId: user.id }
            });
            window.dispatchEvent(profileUpdateEvent);
        }
    };

    // 退出登录
    const handleLogout = async () => {
        try {
            const userId = user?.id; // 保存用户ID以备后用

            await logAction(LogAction.AUTH, '用户退出登录', userId);

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

    // 修改密码
    const handleChangePassword = () => {
        router.push('/dashboard/change-password');
    };

    // 角色对应的标签颜色
    const getRoleTag = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <Tag color="red" icon={<KeyOutlined />}>管理员</Tag>;
            case 'TEACHER':
                return <Tag color="blue" icon={<TeamOutlined />}>教师</Tag>;
            case 'STUDENT':
                return <Tag color="green" icon={<UserOutlined />}>学生</Tag>;
            default:
                return <Tag>未知角色</Tag>;
        }
    };

    // 日志表格列定义
    const columns = [
        {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (text: string) => {
                return new Date(text).toLocaleString('zh-CN');
            }
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            width: 180,
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true,
        },
        {
            title: 'IP地址',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            width: 150,
        }
    ];

    const handlePasswordChange = (values: any) => {
        console.log('修改密码:', values);
        message.success('密码修改成功，请重新登录');
        if (user?.id) {
            logAction(LogAction.CHANGE_PASSWORD, '用户修改了密码', user.id);
        }
        passwordForm.resetFields();
    };

    const handleProfileUpdate = (values: any) => {
        console.log('更新个人信息:', values);
        setUser(prev => prev ? { ...prev, ...values } : null);
        message.success('个人信息更新成功');
        if (user?.id) {
            logAction(LogAction.UPDATE_USER, '用户更新了个人信息', user.id);
        }
    };

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Navbar />
                <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                        <Skeleton active avatar paragraph={{ rows: 6 }} />
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
            <Navbar />

            <Content style={{ padding: '24px', position: 'relative' }}>
                <BackButton />

                <Spin spinning={loading} tip="加载中...">
                    {user && (
                        <div>
                            <Row gutter={24}>
                                {/* 左侧个人信息卡片 */}
                                <Col xs={24} sm={24} md={8} lg={6} xl={5}>
                                    <Card style={{ marginBottom: '24px' }}>
                                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                            <AvatarUpload
                                                currentAvatar={user.avatar}
                                                onAvatarChange={handleAvatarChange}
                                                userRole={user.role}
                                                userId={user.id}
                                            />
                                            <Title level={4} style={{ marginTop: '16px', marginBottom: '4px' }}>
                                                {user.name}
                                            </Title>
                                            {getRoleTag(user.role)}
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <div>
                                            <p>
                                                <MailOutlined style={{ marginRight: '8px' }} />
                                                {user.email}
                                            </p>
                                            <p>
                                                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                                                注册于 {new Date(user.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Button
                                                icon={<LockOutlined />}
                                                onClick={handleChangePassword}
                                                style={{ flex: 1, marginRight: '8px' }}
                                            >
                                                修改密码
                                            </Button>
                                            <Button
                                                danger
                                                icon={<LogoutOutlined />}
                                                onClick={handleLogout}
                                                style={{ flex: 1 }}
                                            >
                                                退出登录
                                            </Button>
                                        </div>
                                    </Card>

                                    <Card
                                        title={
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <TeamOutlined style={{ marginRight: '8px' }} />
                                                <span>账户统计</span>
                                            </div>
                                        }
                                        loading={statsLoading}
                                        className="shadow-md hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <Row gutter={[24, 24]}>
                                            <Col span={12}>
                                                <Statistic
                                                    title={<div style={{ fontSize: '14px', color: '#555' }}>登录次数</div>}
                                                    value={stats.totalLogins}
                                                    valueStyle={{
                                                        color: '#1890ff',
                                                        fontSize: '24px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    prefix={<UserOutlined style={{ marginRight: '8px' }} />}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title={<div style={{ fontSize: '14px', color: '#555' }}>今日操作</div>}
                                                    value={stats.actionsToday}
                                                    valueStyle={{
                                                        color: '#52c41a',
                                                        fontSize: '24px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    prefix={<EditOutlined style={{ marginRight: '8px' }} />}
                                                />
                                            </Col>
                                            <Col span={24}>
                                                <Divider style={{ margin: '12px 0' }} />
                                                <div style={{ fontSize: '13px', color: '#8c8c8c', display: 'flex', alignItems: 'center' }}>
                                                    <ClockCircleOutlined style={{ marginRight: '5px' }} />
                                                    <span>
                                                        最近登录: {stats.lastLogin
                                                            ? new Date(stats.lastLogin).toLocaleString()
                                                            : <span style={{ color: '#ccc', fontStyle: 'italic' }}>暂无记录</span>}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                                                    <CalendarOutlined style={{ marginRight: '5px' }} />
                                                    <span>总操作次数: {stats.totalActions}</span>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>

                                {/* 右侧内容区域 */}
                                <Col xs={24} sm={24} md={16} lg={18} xl={19}>
                                    <Card style={{ marginBottom: '24px' }}>
                                        <Tabs defaultActiveKey="profile">
                                            <TabPane tab="个人资料" key="profile">
                                                <Descriptions
                                                    title="基本信息"
                                                    bordered
                                                    column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                                                >
                                                    <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
                                                    <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
                                                    <Descriptions.Item label="角色">
                                                        {user.role === 'ADMIN' ? '管理员' : user.role === 'TEACHER' ? '教师' : '学生'}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="注册时间">
                                                        {new Date(user.createdAt).toLocaleString()}
                                                    </Descriptions.Item>
                                                    {user.updatedAt && (
                                                        <Descriptions.Item label="最后更新">
                                                            {new Date(user.updatedAt).toLocaleString()}
                                                        </Descriptions.Item>
                                                    )}
                                                </Descriptions>

                                                <Divider />

                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <Title level={5}>账户安全</Title>
                                                    <List>
                                                        <List.Item
                                                            actions={[
                                                                <Button
                                                                    key="change-password"
                                                                    onClick={handleChangePassword}
                                                                >
                                                                    修改
                                                                </Button>,
                                                            ]}
                                                        >
                                                            <List.Item.Meta
                                                                avatar={<LockOutlined />}
                                                                title="密码"
                                                                description="用于保护账户安全，建议定期更换"
                                                            />
                                                        </List.Item>
                                                    </List>
                                                </Space>
                                            </TabPane>

                                            {user.role === 'ADMIN' && (
                                                <TabPane tab="操作日志" key="logs">
                                                    <Spin spinning={logsLoading}>
                                                        <Table
                                                            dataSource={userLogs}
                                                            columns={columns}
                                                            rowKey="id"
                                                            pagination={{ pageSize: 10 }}
                                                        />
                                                    </Spin>
                                                </TabPane>
                                            )}
                                        </Tabs>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Spin>
            </Content>
        </Layout>
    );
} 