'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Typography, Card, Space, message, Alert, Spin, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, HomeOutlined, SmileOutlined, MessageOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [welcomeIndex, setWelcomeIndex] = useState(0);

  // 欢迎语轮播
  const welcomeMessages = [
    "欢迎回来！准备好探索您的学习成绩了吗？",
    "知识的殿堂向您敞开大门，欢迎登录！",
    "您的每一步进步，我们都记录在案。",
    "成绩只是旅途中的驿站，学习才是终身的事业。",
    "数据安全，真实可靠，尽在成绩认证系统。"
  ];

  // 定时切换欢迎语
  useEffect(() => {
    const timer = setInterval(() => {
      setWelcomeIndex((prev) => (prev + 1) % welcomeMessages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 检查URL参数
    if (searchParams.get('registered') === 'true') {
      message.success('账号注册成功，请登录');
    }
    if (searchParams.get('logout') === 'true') {
      message.success('您已成功退出登录');
    }
  }, [searchParams]);

  // 检查未读消息
  const checkUnreadMessages = async () => {
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        if (data.unreadCount > 0) {
          // 显示有未读消息的通知
          message.info({
            content: (
              <div>
                <p>您有 <b>{data.unreadCount}</b> 条未读消息</p>
                {data.latestSender && data.latestMessage && (
                  <p>
                    来自 <strong>{data.latestSender.name}</strong>
                    {data.latestSender.role === 'TEACHER' ? ' 老师' :
                      data.latestSender.role === 'STUDENT' ? ' 同学' : ''} 的消息:
                    "<i>{data.latestMessage.content.length > 20
                      ? data.latestMessage.content.substring(0, 20) + '...'
                      : data.latestMessage.content}</i>"
                  </p>
                )}
                <div style={{ marginTop: 8 }}>
                  <Button type="link" size="small" onClick={() => router.push('/messages')} style={{ padding: 0 }}>
                    点击查看 →
                  </Button>
                </div>
              </div>
            ),
            duration: 6,
            icon: <MessageOutlined style={{ color: '#1890ff' }} />,
            style: {
              cursor: 'pointer'
            }
          });
        }
      }
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      message.success('登录成功，正在跳转...');

      // 登录成功后检查未读消息
      await checkUnreadMessages();

      // 跳转到仪表板
      router.push('/dashboard');
    } catch (err: any) {
      message.error(err.message || '登录过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <Card
          bordered={false}
          style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
          cover={
            <div style={{
              background: 'linear-gradient(120deg, #1890ff 0%, #096dd9 100%)',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <motion.div
                key={welcomeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SmileOutlined style={{ fontSize: '42px', marginBottom: '16px' }} />
                <Title level={3} style={{ color: 'white', margin: 0, fontFamily: '"Noto Sans SC", sans-serif' }}>
                  登录账号
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', display: 'block', marginTop: '8px', height: '40px' }}>
                  {welcomeMessages[welcomeIndex]}
                </Text>
              </motion.div>
            </div>
          }
        >
          <Spin spinning={loading} tip="登录中...">
            <div style={{ padding: '24px 16px 12px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="邮箱地址"
                    autoComplete="email"
                    allowClear
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                    placeholder="密码"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    icon={<LoginOutlined />}
                    loading={loading}
                    style={{
                      height: '44px',
                      fontWeight: 500,
                      fontSize: '16px',
                      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                    }}
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>

              <Divider plain style={{ fontSize: '12px', color: '#8c8c8c', margin: '16px 0' }}>
                还没有账号?
              </Divider>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0 8px' }}>
                <Link href="/register" style={{ display: 'block', width: '48%' }}>
                  <Button block>注册新账号</Button>
                </Link>
                <Link href="/" style={{ display: 'block', width: '48%' }}>
                  <Button block icon={<HomeOutlined />}>返回首页</Button>
                </Link>
              </div>
            </div>
          </Spin>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Text style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: 'rgba(0,0,0,0.45)' }}>
            © 2023 学生成绩认证系统 - 保障教育数据真实可信
          </Text>
        </motion.div>
      </motion.div>
    </div>
  );
} 