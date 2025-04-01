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
  DashboardOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';

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
      } catch (err: any) {
        setError(err.message || '加载数据失败');
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

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
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3}>{roleTitles[user.role]}</Title>
          </div>

          <Row gutter={[24, 24]}>
            {/* 管理员特有功能 */}
            {user.role === 'ADMIN' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
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
              </>
            )}

            {/* 共享功能 - 成绩管理 */}
            <Col xs={24} sm={12} md={8}>
              <Badge.Ribbon text="常用" color="blue">
                <Card
                  hoverable
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
              </>
            )}

            {/* 学生特有功能 */}
            {user.role === 'STUDENT' && (
              <>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="manage" href="/dashboard/my-courses">
                        <Button type="primary">课程列表</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#7cb305' }} icon={<BookOutlined />} />}
                      title="我的课程"
                      description="查看您当前选修的课程"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    actions={[
                      <Link key="manage" href="/dashboard/transcript">
                        <Button type="primary">查看成绩单</Button>
                      </Link>
                    ]}
                  >
                    <Meta
                      avatar={<Avatar style={{ backgroundColor: '#1890ff' }} icon={<FileProtectOutlined />} />}
                      title="成绩单"
                      description="查看和导出您的完整成绩单"
                    />
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </div>
      </Content>
    </Layout>
  );
} 