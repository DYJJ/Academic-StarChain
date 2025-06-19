'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Card, Button, Typography, Row, Col, Space, Avatar, Spin, Result, Tag, Badge, Statistic } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  TeamOutlined,
  BookFilled,
  FileProtectOutlined,
  DashboardOutlined,
  MessageOutlined,
  BellOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';
import ChatWidget from '../components/ChatWidget';
import WeatherWidget from '../components/WeatherWidget';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Meta } = Card;

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestSender, setLatestSender] = useState<any>(null);
  const [latestMessage, setLatestMessage] = useState<any>(null);

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

        // 获取未读消息信息
        fetchUnreadMessages();
      } catch (err: any) {
        setError(err.message || '加载数据失败');
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 获取未读消息数量和最新消息
  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
        setLatestSender(data.latestSender);
        setLatestMessage(data.latestMessage);
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // 调用登出API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // 重定向到登录页
      router.push('/login?logout=true');
    } catch (error) {
      console.error('登出错误:', error);
    }
  };

  // 角色对应的仪表板标题
  const roleTitles = {
    ADMIN: '管理员仪表板',
    TEACHER: '教师仪表板',
    STUDENT: '学生仪表板'
  };

  // 角色对应的图标颜色
  const roleColors = {
    ADMIN: '#f56a00',
    TEACHER: '#1677ff',
    STUDENT: '#52c41a'
  };

  // 在仪表板中添加未读消息卡片
  const renderUnreadMessagesCard = () => {
    if (unreadCount > 0) {
      return (
        <Col xs={24} sm={12} md={8}>
          <Badge.Ribbon text={`${unreadCount} 条新消息`} color="blue">
            <Card
              hoverable
              actions={[
                <Link key="view" href="/messages">
                  <Button type="primary">查看消息</Button>
                </Link>
              ]}
              onClick={() => router.push('/messages')}
            >
              <Meta
                avatar={
                  <Badge count={unreadCount}>
                    <Avatar style={{ backgroundColor: '#1890ff' }} icon={<MessageOutlined />} />
                  </Badge>
                }
                title="未读消息提醒"
                description={
                  latestSender && latestMessage ? (
                    <div>
                      <Text strong>最新消息来自: {latestSender.name}</Text>
                      <br />
                      <Text type="secondary" ellipsis>
                        {latestMessage.content.length > 20
                          ? latestMessage.content.substring(0, 20) + '...'
                          : latestMessage.content}
                      </Text>
                    </div>
                  ) : (
                    "您有未读消息，点击查看"
                  )
                }
              />
            </Card>
          </Badge.Ribbon>
        </Col>
      );
    }
    return null;
  };

  // 自定义卡片样式，适配壁纸背景
  const cardStyle = {
    className: 'card-with-wallpaper-bg',
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <Result
        status="403"
        title="未登录"
        subTitle="您需要登录才能访问此页面"
        extra={
          <Button type="primary" onClick={() => router.push('/login')}>
            前往登录
          </Button>
        }
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{roleTitles[user.role]}</Title>
          </div>

          <Row gutter={[24, 24]}>
            {/* 管理员特有功能 - 不包含"老师总体评价" */}
            {user.role === 'ADMIN' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    {...cardStyle}
                    actions={[
                      <Link key="manage" href="/dashboard/users">
                        <Button type="primary">管理用户</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#1677ff' }} icon={<TeamOutlined />} />}
                      title="用户管理"
                      description="添加、删除和修改学生和教师账号"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    {...cardStyle}
                    actions={[
                      <Link key="manage" href="/dashboard/courses">
                        <Button type="primary">管理课程</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#52c41a' }} icon={<BookOutlined />} />}
                      title="课程管理"
                      description="添加、删除和修改课程信息"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    {...cardStyle}
                    actions={[
                      <Link key="manage" href="/dashboard/settings">
                        <Button type="primary">系统设置</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#722ed1' }} icon={<SettingOutlined />} />}
                      title="系统设置"
                      description="配置系统参数和基本设置"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Badge.Ribbon text="新功能" color="red">
                    <Card
                      hoverable
                      {...cardStyle}
                      actions={[
                        <Link key="manage" href="/dashboard/appeals">
                          <Button type="primary">申诉管理</Button>
                        </Link>
                      ]}
                    >
                      <Meta
                        avatar={<Avatar style={{ backgroundColor: '#f5222d' }} icon={<FileProtectOutlined />} />}
                        title="成绩申诉管理"
                        description="处理学生提交的成绩异议申诉"
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>
              </>
            )}

            {/* 共享功能 - 成绩管理 */}
            <Col xs={24} sm={12} md={8}>
              <Badge.Ribbon text="常用" color="blue">
                <Card
                  hoverable
                  {...cardStyle}
                  actions={[
                    <Link key="manage" href="/dashboard/grades">
                      <Button type="primary">{user.role === 'STUDENT' ? '查看成绩' : '管理成绩'}</Button>
                    </Link>
                  ]}
                >
                  <Meta
                    avatar={<Avatar style={{ backgroundColor: '#fa8c16' }} icon={<FileTextOutlined />} />}
                    title="成绩管理"
                    description={
                      user.role === 'STUDENT'
                        ? "查看你的课程成绩与统计信息"
                        : user.role === 'TEACHER'
                          ? "为您的学生录入和管理成绩"
                          : "查看和管理所有学生成绩记录"
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>

            {/* 新增消息功能 */}
            {renderUnreadMessagesCard()}

            {/* 教师特有功能 */}
            {user.role === 'TEACHER' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="manage" href="/dashboard/my-courses">
                        <Button type="primary">课程管理</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#13c2c2' }} icon={<BookFilled />} />}
                      title="我的课程"
                      description="查看和管理您教授的课程"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="manage" href="/dashboard/my-students">
                        <Button type="primary">学生列表</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#eb2f96' }} icon={<TeamOutlined />} />}
                      title="学生管理"
                      description="查看您所教课程的学生名单"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Badge.Ribbon text="新功能" color="red">
                    <Card
                      hoverable
                      actions={[
                        <Link key="manage" href="/dashboard/appeals">
                          <Button type="primary">申诉管理</Button>
                        </Link>
                      ]}
                    >
                      <Meta
                        avatar={<Avatar style={{ backgroundColor: '#f5222d' }} icon={<FileProtectOutlined />} />}
                        title="成绩申诉管理"
                        description="处理学生对您课程的成绩申诉"
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>
              </>
            )}

            {/* 学生特有功能 - 包含"老师总体评价" */}
            {user.role === 'STUDENT' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Badge.Ribbon text="推荐" color="green">
                    <Card
                      hoverable
                      actions={[
                        <Link key="courses" href="/dashboard/my-courses">
                          <Button type="primary">我的课程</Button>
                        </Link>
                      ]}
                    >
                      <Meta
                        avatar={<Avatar style={{ backgroundColor: '#52c41a' }} icon={<BookFilled />} />}
                        title="我的选修课程"
                        description="查看你所选修的所有课程及详细信息"
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="analytics" href="/analytics">
                        <Button type="primary">成绩分析</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#eb2f96' }} icon={<DashboardOutlined />} />}
                      title="成绩分析"
                      description="查看成绩趋势图表和统计分析"
                    />
                  </Card>
                </Col>
             
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="analytics" href="/dashboard/teacher">
                        <Button type="primary">查看老师评价</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#eb2f96' }} icon={<DashboardOutlined />} />}
                      title="老师总体评价"
                      description="查看老师评价和对老师点赞"
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </div>
      </Content>

      {/* 添加天气小组件 */}
      <WeatherWidget />

      {/* 聊天小部件 */}
      <ChatWidget />
    </Layout>
  );
} 