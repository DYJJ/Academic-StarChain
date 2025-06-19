'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Button, Avatar, Tag, Card, Statistic, Skeleton } from 'antd';
import { UserOutlined, LoginOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ProfileAnimation from '../components/ProfileAnimation';

const { Content } = Layout;
const { Title, Text } = Typography;

interface UserStats {
    loginCount: number;
    operationsToday: number;
}

interface UserClass {
    id: string;
    name: string;
    year: string;
    description?: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<UserStats>({ loginCount: 0, operationsToday: 0 });
    const [userClass, setUserClass] = useState<UserClass | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchUserData();
        fetchUserStats();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/user/profile');
            const data = await response.json();
            if (data.user) {
                setUser(data.user);

                // 如果是学生且有班级ID，获取班级信息
                if (data.user.role === 'STUDENT' && data.user.classId) {
                    fetchUserClass(data.user.classId);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setLoading(false);
        }
    };

    const fetchUserClass = async (classId: string) => {
        try {
            const response = await fetch(`/api/classes?id=${classId}`);
            const data = await response.json();
            if (data.class) {
                setUserClass(data.class);
            }
        } catch (error) {
            console.error('Error fetching class data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await fetch('/api/user/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    if (loading) {
        return (
            <Layout className="min-h-screen bg-gray-50">
                <Content className="p-6">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton active avatar paragraph={{ rows: 6 }} />
                    </div>
                </Content>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout className="min-h-screen bg-gray-50">
                <Content className="p-6">
                    <div className="max-w-4xl mx-auto">
                        <Card>
                            <Text>用户未登录或数据加载失败</Text>
                        </Card>
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout className="min-h-screen bg-gray-50">
            <Content className="p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Button
                            icon={<UserOutlined />}
                            onClick={() => router.back()}
                            className="mb-4"
                        >
                            返回
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <Card title="基本信息" className="shadow-md">
                                <div className="text-center mb-6">
                                    <Avatar
                                        size={100}
                                        src={user.avatarUrl}
                                        icon={<UserOutlined />}
                                        className="mb-4"
                                    />
                                    <Title level={3}>{user.name}</Title>
                                    <Tag color={user.role === 'STUDENT' ? 'blue' : user.role === 'TEACHER' ? 'green' : 'red'}>
                                        {user.role === 'STUDENT' ? '学生' : user.role === 'TEACHER' ? '教师' : '管理员'}
                                    </Tag>

                                    {user.role === 'STUDENT' && userClass && (
                                        <Tag color="cyan" icon={<TeamOutlined />} className="ml-2">
                                            {userClass.name} ({userClass.year})
                                        </Tag>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Text type="secondary">邮箱</Text>
                                        <div>{user.email}</div>
                                    </div>

                                    {user.role === 'STUDENT' && (
                                        <div>
                                            <Text type="secondary">班级</Text>
                                            <div>
                                                {userClass ? (
                                                    <>
                                                        {userClass.name} ({userClass.year})
                                                        {userClass.description && (
                                                            <div>
                                                                <Text type="secondary" className="text-sm">{userClass.description}</Text>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Text type="secondary">未分配班级</Text>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Text type="secondary">注册时间</Text>
                                        <div>{new Date(user.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <Text type="secondary">最后更新</Text>
                                        <div>{new Date(user.updatedAt).toLocaleString()}</div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="账户统计" className="shadow-md">
                                <div className="grid grid-cols-2 gap-4">
                                    <Statistic
                                        title="登录次数"
                                        value={stats.loginCount}
                                        prefix={<LoginOutlined />}
                                    />
                                    <Statistic
                                        title="今日操作"
                                        value={stats.operationsToday}
                                        prefix={<EditOutlined />}
                                    />
                                </div>
                            </Card>
                        </div>

                        <div className="h-full">
                            <ProfileAnimation />
                        </div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
} 