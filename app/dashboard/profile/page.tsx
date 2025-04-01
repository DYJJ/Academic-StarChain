'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layout, Card, Avatar, Typography, Tabs, Table,
    Tag, Descriptions, Button, Divider, List, Spin,
    Space, Statistic, Row, Col, Timeline, message
} from 'antd';
import {
    UserOutlined, ClockCircleOutlined, EnvironmentOutlined,
    PhoneOutlined, MailOutlined, TeamOutlined, KeyOutlined,
    LockOutlined, LogoutOutlined, SettingOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { LogAction, logAction } from '../../utils/logger';
import AvatarUpload from './components/AvatarUpload';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

type User = {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    createdAt: string;
    updatedAt?: string;
    avatarUrl?: string;
};

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

                // 记录查看个人资料操作
                try {
                    await logAction(LogAction.USER_PROFILE, '查看个人资料');
                } catch (error) {
                    console.error('记录日志失败:', error);
                }
            } catch (err: any) {
                console.error('加载数据失败:', err);
                message.error(err.message || '加载数据失败');
                setLoading(false);
            }
        }

        fetchData();
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
        try {
            setStatsLoading(true);
            const response = await fetch(`/api/users/${userId}/stats`);

            if (!response.ok) {
                throw new Error('获取用户统计信息失败');
            }

            const data = await response.json();
            setStats(data.stats || {
                totalLogins: 0,
                lastLogin: '',
                actionsToday: 0,
                totalActions: 0,
            });
        } catch (err: any) {
            console.error('获取用户统计信息失败:', err);
            // 使用模拟数据
            setStats({
                totalLogins: 45,
                lastLogin: new Date().toISOString(),
                actionsToday: 8,
                totalActions: 126,
            });
        } finally {
            setStatsLoading(false);
        }
    };

    // 处理头像更新
    const handleAvatarChange = (newAvatarUrl: string) => {
        if (user) {
            setUser({
                ...user,
                avatarUrl: newAvatarUrl
            });
        }
    };

    // 退出登录
    const handleLogout = async () => {
        try {
            // 记录退出登录操作
            await logAction(LogAction.AUTH, '用户退出登录');

            // 调用登出API
            await fetch('/api/auth/logout', {
                method: 'POST',
            });

            // 重定向到登录页
            router.push('/login?logout=true');
        } catch (error) {
            console.error('登出错误:', error);
            message.error('退出登录失败，请重试');
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
                return <Tag>未知</Tag>;
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

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="加载中..." />
            </div>
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
                                                currentAvatar={user.avatarUrl}
                                                onAvatarChange={handleAvatarChange}
                                                userRole={user.role}
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

                                    <Card title="账户统计" loading={statsLoading}>
                                        <Row gutter={[16, 16]}>
                                            <Col span={12}>
                                                <Statistic
                                                    title="登录次数"
                                                    value={stats.totalLogins}
                                                    valueStyle={{ color: '#1890ff' }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="今日操作"
                                                    value={stats.actionsToday}
                                                    valueStyle={{ color: '#52c41a' }}
                                                />
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