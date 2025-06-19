'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Form, Input, Button, Select, message, Spin,
  Typography, Space, Divider, Upload, InputNumber, Slider, Tooltip
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, UploadOutlined,
  BookOutlined, TeamOutlined, ClockCircleOutlined, RollbackOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import Navbar from '@/app/components/Navbar';
import { LogAction, logAction } from '@/app/utils/logger';
import { Course } from '@/app/dashboard/my-courses/types';
import { COLORS, SHADOWS } from '@/app/dashboard/my-courses/styles/constants';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 学期选项
const SEMESTER_OPTIONS = [
  '2022-2023-1', '2022-2023-2',
  '2023-2024-1', '2023-2024-2',
  '2024-2025-1', '2024-2025-2',
];

export default function EditCourse({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCourseData();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id && course) {
      logAction(LogAction.VIEW_COURSE, `教师编辑课程"${course.name}"(${course.code})`, currentUser.id);
    }
  }, [currentUser?.id, course]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        
        // 如果不是老师，重定向回首页
        if (data.user.role !== 'TEACHER') {
          message.error('只有教师才能编辑课程');
          router.push('/dashboard/my-courses');
        }
      } else {
        // 未登录则重定向到登录页
        router.push('/login');
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          message.error('课程不存在');
          router.push('/dashboard/my-courses');
          return;
        }
        
        if (response.status === 403) {
          message.error('您没有权限编辑此课程');
          router.push('/dashboard/my-courses');
          return;
        }
        
        throw new Error('获取课程信息失败');
      }

      const data = await response.json();
      setCourse(data.course);
      form.setFieldsValue(data.course);
    } catch (error) {
      console.error('获取课程信息失败:', error);
      message.error('获取课程信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!course) return;
    
    try {
      setSubmitting(true);
      const response = await fetch(`/api/courses/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('更新课程失败');
      }

      message.success('课程更新成功');
      
      if (currentUser?.id) {
        logAction(
          LogAction.UPDATE_COURSE, 
          `成功更新课程"${course.name}"(${course.code})信息`, 
          currentUser.id
        );
      }
      
      router.push('/dashboard/my-courses');
    } catch (error) {
      message.error('更新课程失败，请稍后重试');
      console.error('更新课程错误:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: COLORS.bgLight,
        display: 'flex',
        flexDirection: 'column' 
      }}>
        <Navbar />
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <Spin size="large" tip="加载课程信息..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.bgLight,
      position: 'relative'
    }}>
      <Navbar />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* 页面标题 */}
        <Card
          style={{ 
            marginBottom: '24px', 
            borderRadius: '12px',
            boxShadow: SHADOWS.sm
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              <BookOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>
            
            <div>
              <Title level={3} style={{ margin: 0, marginBottom: '4px' }}>
                编辑课程
              </Title>
              {course && (
                <Text type="secondary">
                  {course.code} - {course.name}
                </Text>
              )}
            </div>
          </div>
        </Card>
        
        {/* 编辑表单 */}
        <Card
          style={{ 
            borderRadius: '12px',
            boxShadow: SHADOWS.sm
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              name: course?.name || '',
              description: course?.description || '',
              credit: course?.credit || 3,
              semester: course?.semester || '2023-2024-2',
              progress: course?.progress || 0
            }}
          >
            <Form.Item
              name="name"
              label="课程名称"
              rules={[{ required: true, message: '请输入课程名称' }]}
            >
              <Input placeholder="请输入课程名称" maxLength={100} />
            </Form.Item>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Form.Item
              name="credit"
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>学分</span>
                  <Tooltip title="已创建的课程不可修改学分">
                    <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>(不可修改)</Text>
                  </Tooltip>
                </div>
              }
              rules={[{ required: true, message: '请输入课程学分' }]}
              extra="已创建的课程不可修改学分，如需修改请联系系统管理员"
            >
              <InputNumber 
                min={0.5} 
                max={10} 
                step={0.5} 
                precision={1}
                style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                disabled={true} 
              />
            </Form.Item>
            
            <Form.Item
              name="semester"
              label="学期"
              rules={[{ required: true, message: '请选择课程学期' }]}
            >
              <Select placeholder="请选择课程学期">
                {SEMESTER_OPTIONS.map(semester => (
                  <Option key={semester} value={semester}>{semester}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="progress"
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <PercentageOutlined style={{ marginRight: '8px' }} />
                  <span>教学进度</span>
                </div>
              }
              rules={[{ required: true, message: '请设置教学进度' }]}
            >
              <Slider 
                min={0}
                max={100}
                step={1}
                tooltip={{ formatter: value => `${value}%` }}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%'
                }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-10px', marginBottom: '20px' }}>
              <div style={{ width: '80%' }}></div>
              <Form.Item
                name="progress"
                noStyle
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={1}
                  style={{ width: '80px' }}
                  addonAfter="%"
                />
              </Form.Item>
            </div>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Form.Item
              name="description"
              label="课程描述"
            >
              <TextArea 
                placeholder="请输入课程描述" 
                autoSize={{ minRows: 4, maxRows: 8 }}
                maxLength={2000}
                showCount
              />
            </Form.Item>
            
            <Form.Item style={{ marginTop: '24px' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  htmlType="submit"
                  loading={submitting}
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    background: COLORS.primary,
                    borderColor: COLORS.primary
                  }}
                >
                  保存修改
                </Button>
                
                <Button
                  icon={<RollbackOutlined />}
                  onClick={() => router.push('/dashboard/my-courses')}
                  style={{
                    height: '40px',
                    borderRadius: '8px'
                  }}
                >
                  返回列表
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
        
        {/* 不可编辑信息卡片 */}
        {course && (
          <Card
            title="课程基本信息（不可编辑）"
            style={{ 
              marginTop: '24px',
              borderRadius: '12px',
              boxShadow: SHADOWS.sm
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ minWidth: '200px' }}>
                <Text type="secondary">课程代码</Text>
                <Paragraph strong style={{ margin: '4px 0 0 0' }}>
                  {course.code}
                </Paragraph>
              </div>
              
              <div style={{ minWidth: '200px' }}>
                <Text type="secondary">学生人数</Text>
                <Paragraph strong style={{ margin: '4px 0 0 0' }}>
                  {course.studentCount || 0} 人
                </Paragraph>
              </div>
              
              <div style={{ minWidth: '200px' }}>
                <Text type="secondary">授课教师</Text>
                <Paragraph style={{ margin: '4px 0 0 0' }}>
                  {course.teachers?.map(teacher => teacher.name).join(', ') || '暂无信息'}
                </Paragraph>
              </div>
            </div>
            
            <Paragraph type="secondary" style={{ marginTop: '16px', fontSize: '13px' }}>
              注意：课程代码、学生名单和教师名单需要联系教务处或系统管理员进行更改。
            </Paragraph>
          </Card>
        )}
      </div>
    </div>
  );
} 