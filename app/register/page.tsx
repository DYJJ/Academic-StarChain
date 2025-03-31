'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Select, Typography, Card, Steps, message, Space, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TeamOutlined, RocketOutlined, ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

export default function Register() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (values: { email: string; password: string; name: string; role: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }

      setRegistrationSuccess(true);
      setCurrentStep(2);

      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);

    } catch (err: any) {
      message.error(err.message || '注册过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  // 学生角色特性
  const studentFeatures = [
    '查看个人所有课程成绩',
    '查看成绩统计与分析',
    '导出成绩认证报告',
    '一键分享成绩证明'
  ];

  // 教师角色特性
  const teacherFeatures = [
    '管理课程和班级',
    '录入和修改学生成绩',
    '生成成绩分析报告',
    '查看课程统计数据'
  ];

  // 根据当前步骤渲染不同内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: '20px 10px' }}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="邮箱地址"
                size="large"
                autoComplete="email"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入您的姓名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入您的姓名"
                size="large"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请设置密码' },
                { min: 6, message: '密码至少6位字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请设置密码（至少6位）"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => {
                  form.validateFields(['email', 'name', 'password']).then(() => {
                    setCurrentStep(1);
                  });
                }}
                icon={<ArrowLeftOutlined />}
                style={{
                  height: '44px',
                  fontWeight: 500,
                  fontSize: '16px',
                  background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                }}
              >
                下一步
              </Button>
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div style={{ padding: '20px 10px' }}>
            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择您的身份' }]}
              initialValue="STUDENT"
            >
              <Select size="large">
                <Option value="STUDENT">
                  <Space>
                    <TeamOutlined /> 学生
                  </Space>
                </Option>
                <Option value="TEACHER">
                  <Space>
                    <TeamOutlined /> 教师
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <div style={{ marginBottom: '20px' }}>
              <Card
                title={
                  <Text strong>
                    {form.getFieldValue('role') === 'STUDENT' ? '学生账号特权' : '教师账号特权'}
                  </Text>
                }
                size="small"
                bordered={false}
                style={{ background: '#f5f5f5' }}
              >
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  {(form.getFieldValue('role') === 'STUDENT' ? studentFeatures : teacherFeatures).map((feature, index) => (
                    <li
                      key={index}
                      style={{ margin: '8px 0' }}
                    >
                      <Text>{feature}</Text>
                    </li>
                  ))}
                </ul>
              </Card>

              <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginTop: '8px' }}>
                注：管理员账号需由系统管理员手动创建
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                style={{ width: '48%' }}
                size="large"
                onClick={() => setCurrentStep(0)}
              >
                上一步
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  width: '48%',
                  height: '44px',
                  background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                }}
                size="large"
                loading={loading}
              >
                完成注册
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <Result
            status="success"
            title="注册成功！"
            subTitle={`欢迎加入，${form.getFieldValue('name')}！我们正在跳转到登录页面...`}
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={() => router.push('/login?registered=true')}
              >
                立即登录
              </Button>
            ]}
          />
        );

      default:
        return null;
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
      <div
        style={{ width: '100%', maxWidth: '480px' }}
      >
        <Card
          bordered={false}
          style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            borderRadius: '12px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Title level={3} style={{ fontFamily: '"Noto Sans SC", sans-serif', margin: 0 }}>
              {registrationSuccess ? '注册成功' : '创建新账号'}
            </Title>
            {!registrationSuccess && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                加入我们，探索成绩管理的全新体验
              </Text>
            )}
          </div>

          {!registrationSuccess && (
            <Steps
              current={currentStep}
              items={[
                { title: '基本信息', icon: <UserOutlined /> },
                { title: '角色选择', icon: <TeamOutlined /> },
                { title: '完成', icon: <KeyOutlined /> }
              ]}
              style={{ marginBottom: '24px' }}
            />
          )}

          <Spin spinning={loading && currentStep !== 2} tip="处理中...">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              {renderStepContent()}
            </Form>
          </Spin>

          {currentStep === 0 && (
            <>
              <Divider plain style={{ fontSize: '12px', color: '#8c8c8c' }}>
                已有账号?
              </Divider>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Space>
                  <Link href="/login">
                    <Button type="link">直接登录</Button>
                  </Link>
                  <Link href="/">
                    <Button icon={<RocketOutlined />}>返回首页</Button>
                  </Link>
                </Space>
              </div>
            </>
          )}
        </Card>

        <div style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(0,0,0,0.45)' }}>
          © 2023 学生成绩认证系统 - 保障教育数据真实可信
        </div>
      </div>
    </div>
  );
} 