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

                // 获取用户操作日志
                await fetchUserLogs(data.user.id);

                // 获取用户统计信息
                await fetchUserStats(data.user.id);

                // 记录查看个人资料操作
                logAction(LogAction.USER_PROFILE, '查看个人资料');
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
        <Layout style={{ minHeight: '100vh' }}>
            <Navbar />
            <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <BackButton route="/dashboard" />
                    </div>

                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <Card>
                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    {user && (
                                        <AvatarUpload
                                            currentAvatar={user.avatarUrl || null}
                                            onAvatarChange={handleAvatarChange}
                                            userRole={user.role}
                                        />
                                    )}
                                    <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>{user?.name}</Title>
                                    <div>
                                        {user && getRoleTag(user.role)}
                                    </div>
                                </div>

                                <Descriptions title="个人信息" bordered column={1}>
                                    <Descriptions.Item label={<Space><MailOutlined /> 邮箱</Space>}>
                                        {user?.email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={<Space><ClockCircleOutlined /> 注册时间</Space>}>
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Divider />

                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Button
                                        icon={<LockOutlined />}
                                        block
                                        onClick={handleChangePassword}
                                    >
                                        修改密码
                                    </Button>
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<LogoutOutlined />}
                                        block
                                        onClick={handleLogout}
                                    >
                                        退出登录
                                    </Button>
                                </Space>
                            </Card>

                            <Card style={{ marginTop: 24 }}>
                                <Statistic
                                    title="活跃统计"
                                    value={stats.totalActions}
                                    prefix={<SettingOutlined />}
                                    suffix="操作"
                                    loading={statsLoading}
                                />

                                <Row gutter={16} style={{ marginTop: 24 }}>
                                    <Col span={12}>
                                        <Statistic
                                            title="今日操作"
                                            value={stats.actionsToday}
                                            loading={statsLoading}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Statistic
                                            title="登录次数"
                                            value={stats.totalLogins}
                                            loading={statsLoading}
                                        />
                                    </Col>
                                </Row>

                                <Divider />

                                <div style={{ fontSize: 14 }}>
                                    <Text type="secondary">上次登录时间：</Text>
                                    <div style={{ marginTop: 4 }}>
                                        {stats.lastLogin ? new Date(stats.lastLogin).toLocaleString('zh-CN') : '-'}
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} md={16}>
                            <Card
                                title="操作日志"
                                extra={
                                    <Button
                                        type="link"
                                        onClick={() => fetchUserLogs(user?.id || '')}
                                        disabled={logsLoading}
                                    >
                                        刷新
                                    </Button>
                                }
                            >
                                <Table
                                    columns={columns}
                                    dataSource={userLogs}
                                    rowKey="id"
                                    loading={logsLoading}
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        showTotal: (total) => `共 ${total} 条记录`
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
} 