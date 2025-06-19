'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Button, Typography, Input, Radio, Spin, Empty, Tabs, Badge, Alert } from 'antd';
import { UserOutlined, TeamOutlined, ArrowLeftOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

interface Course {
    id: string;
    name: string;
    code: string;
}

interface UserWithRelation extends User {
    course?: Course;
}

const NewMessagePage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams?.get('role');

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [targetRole, setTargetRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>(
        (roleParam as 'STUDENT' | 'TEACHER' | 'ADMIN') || 'TEACHER'
    );
    const [showRoleSelection, setShowRoleSelection] = useState(!roleParam);
    const [users, setUsers] = useState<UserWithRelation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [courses, setCourses] = useState<Course[]>([]);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    console.log('初始状态:', { targetRole, showRoleSelection, roleParam });

    // 获取当前用户信息
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data.user);
                    console.log('当前用户:', data.user);
                } else {
                    console.log('获取当前用户失败，以匿名方式继续');
                }
            } catch (error) {
                console.error('获取当前用户信息失败:', error);
            } finally {
                // 无论是否获取到用户信息，都继续加载其他数据
                fetchCoursesAndUsers();
            }
        };

        // 获取课程和用户列表
        const fetchCoursesAndUsers = async () => {
            try {
                // 获取用户所有关联的课程
                const coursesResponse = await fetch('/api/courses');
                if (coursesResponse.ok) {
                    const coursesData = await coursesResponse.json();
                    setCourses(coursesData);
                    console.log('获取到课程:', coursesData.length);
                }

                // 只有在不显示角色选择时才立即加载用户列表
                if (!showRoleSelection) {
                    await fetchUsersByRole(targetRole);
                } else {
                    // 如果是显示角色选择界面，则不需要加载用户列表
                    setLoading(false);
                }
            } catch (err) {
                console.error('获取初始数据出错:', err);
                setErrorMessage('获取数据失败，请重试');
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    // 获取指定角色的用户列表
    const fetchUsersByRole = async (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
        try {
            setLoading(true);
            setErrorMessage(null);

            // 构建API URL
            const url = `/api/users?role=${role}${selectedCourse !== 'all' ? `&courseId=${selectedCourse}` : ''}`;
            console.log(`正在获取联系人: ${url}`);

            const response = await fetch(url);
            console.log('API响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`获取联系人失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('API返回数据:', data);

            // 正确处理API返回的数据格式
            if (data && data.users) {
                setUsers(data.users);
                console.log(`获取到 ${data.users.length} 个用户`);
            } else if (Array.isArray(data)) {
                // 兼容直接返回数组的旧API格式
                setUsers(data);
                console.log(`获取到 ${data.length} 个用户（数组格式）`);
            } else {
                setUsers([]);
                console.error('API返回数据格式不正确:', data);
                setErrorMessage('数据格式错误，请联系管理员');
            }

            setInitialLoadDone(true);
        } catch (err: any) {
            console.error('获取联系人出错:', err);
            setUsers([]);
            setInitialLoadDone(true);
            setErrorMessage(`获取联系人失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 监听角色或课程变化，重新获取用户列表
    useEffect(() => {
        // 只有当不在角色选择界面时才获取用户列表
        if (!showRoleSelection) {
            fetchUsersByRole(targetRole);
        }
    }, [targetRole, selectedCourse, showRoleSelection]);

    // 过滤用户
    const filteredUsers = searchTerm
        ? users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : users;

    // 处理选择用户，开始对话
    const handleUserSelect = async (userId: string) => {
        try {
            // 创建或获取与该用户的对话
            const response = await fetch(`/api/messages?otherUserId=${userId}`);

            if (!response.ok) {
                throw new Error('创建对话失败');
            }

            const data = await response.json();

            if (data && data.conversation) {
                // 跳转到对话页面
                router.push(`/messages/${data.conversation.id}`);
            }
        } catch (err) {
            console.error('创建对话出错:', err);
            alert('创建对话失败，请重试');
        }
    };

    // 处理选择用户角色
    const handleRoleSelect = (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
        console.log(`选择角色: ${role}`);
        setTargetRole(role);
        setShowRoleSelection(false);
        // 更新URL但不触发导航
        const newUrl = `/messages/new?role=${role}`;
        window.history.pushState({}, '', newUrl);
    };

    // 返回角色选择
    const backToRoleSelection = () => {
        console.log('返回角色选择');
        setShowRoleSelection(true);
        // 更新URL但不触发导航
        window.history.pushState({}, '', '/messages/new');
    };

    // 获取当前角色选择的标题
    const getRoleTitle = () => {
        switch (targetRole) {
            case 'TEACHER': return '联系教师';
            case 'STUDENT': return '联系同学';
            case 'ADMIN': return '联系管理员';
            default: return '选择联系人';
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => showRoleSelection ? router.push('/messages') : backToRoleSelection()}
                            style={{ marginRight: 8 }}
                        />
                        <UserSwitchOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <span>{showRoleSelection ? '选择联系人类型' : getRoleTitle()}</span>
                    </div>
                }
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                extra={
                    !showRoleSelection && (
                        <Button
                            type="primary"
                            onClick={() => fetchUsersByRole(targetRole)}
                        >
                            刷新列表
                        </Button>
                    )
                }
            >
                {showRoleSelection ? (
                    // 角色选择界面
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', padding: '30px 0' }}>
                        <Card
                            hoverable
                            style={{ width: 240, textAlign: 'center' }}
                            onClick={() => handleRoleSelect('TEACHER')}
                        >
                            <Avatar size={64} style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                            <Title level={4} style={{ marginTop: 16 }}>联系教师</Title>
                            <Text type="secondary">向您的课程教师发送消息</Text>
                        </Card>

                        <Card
                            hoverable
                            style={{ width: 240, textAlign: 'center' }}
                            onClick={() => handleRoleSelect('STUDENT')}
                        >
                            <Avatar size={64} style={{ backgroundColor: '#52c41a' }} icon={<TeamOutlined />} />
                            <Title level={4} style={{ marginTop: 16 }}>联系同学</Title>
                            <Text type="secondary">与其他学生交流互动</Text>
                        </Card>

                        <Card
                            hoverable
                            style={{ width: 240, textAlign: 'center' }}
                            onClick={() => handleRoleSelect('ADMIN')}
                        >
                            <Avatar size={64} style={{ backgroundColor: '#722ed1' }} icon={<UserOutlined />} />
                            <Title level={4} style={{ marginTop: 16 }}>联系管理员</Title>
                            <Text type="secondary">需要帮助? 联系系统管理员</Text>
                        </Card>
                    </div>
                ) : (
                    // 用户列表界面
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            {courses.length > 0 && targetRole !== 'ADMIN' && (
                                <div style={{ marginTop: 16, marginBottom: 16 }}>
                                    <Text style={{ marginRight: 8 }}>选择课程:</Text>
                                    <Radio.Group
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="all">所有课程</Radio.Button>
                                        {courses.map(course => (
                                            <Radio.Button key={course.id} value={course.id}>
                                                {course.name}
                                            </Radio.Button>
                                        ))}
                                    </Radio.Group>
                                </div>
                            )}

                            <Alert
                                type="info"
                                showIcon
                                message={
                                    targetRole === 'TEACHER'
                                        ? '您可以联系您所选课程的任何教师'
                                        : targetRole === 'STUDENT'
                                            ? '您可以联系与您同课程的其他同学'
                                            : '您可以联系系统管理员寻求帮助'
                                }
                                style={{ marginBottom: 16 }}
                            />

                            <Search
                                placeholder="搜索联系人姓名或邮箱"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ marginTop: 16 }}
                                allowClear
                            />
                        </div>

                        {errorMessage && (
                            <Alert
                                type="error"
                                showIcon
                                message={errorMessage}
                                style={{ marginBottom: 16 }}
                                action={
                                    <Button size="small" type="primary" onClick={() => fetchUsersByRole(targetRole)}>
                                        重试
                                    </Button>
                                }
                            />
                        )}

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin size="large" tip="加载联系人..." />
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={filteredUsers}
                                renderItem={user => (
                                    <List.Item
                                        key={user.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleUserSelect(user.id)}
                                        actions={[
                                            <Button key="message" type="primary" size="small">
                                                发送消息
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    size="large"
                                                    src={user.avatarUrl}
                                                    icon={!user.avatarUrl && <UserOutlined />}
                                                    style={{
                                                        backgroundColor: user.avatarUrl ? 'transparent' :
                                                            targetRole === 'TEACHER' ? '#1890ff' :
                                                                targetRole === 'STUDENT' ? '#52c41a' : '#722ed1'
                                                    }}
                                                />
                                            }
                                            title={user.name}
                                            description={
                                                <div>
                                                    <div>{user.email}</div>
                                                    {user.course && <Badge status="processing" text={`课程: ${user.course.name}`} />}
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : initialLoadDone ? (
                            <Empty
                                description={
                                    <div>
                                        <p>
                                            {targetRole === 'TEACHER'
                                                ? '没有找到可联系的教师'
                                                : targetRole === 'STUDENT'
                                                    ? '没有找到可联系的同学'
                                                    : '没有找到可联系的管理员'}
                                        </p>
                                        <Button
                                            type="primary"
                                            onClick={() => fetchUsersByRole(targetRole)}
                                            style={{ marginTop: 8 }}
                                        >
                                            重新加载
                                        </Button>
                                    </div>
                                }
                            />
                        ) : null}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default NewMessagePage; 