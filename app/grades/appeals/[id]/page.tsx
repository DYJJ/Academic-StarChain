'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Card, Spin, Alert, Row, Col, Button, Tag, Descriptions, Form, Input, Select, DatePicker, Divider, message, Space, Modal } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import BackButton from '../../../components/BackButton';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 申诉类型枚举
type AppealType = 'SCORE_ERROR' | 'CALCULATION_ERROR' | 'MISSING_POINTS' | 'OTHER';

// 申诉状态枚举
type AppealStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

// 申诉数据接口
interface AppealData {
  id: string;
  gradeId: string;
  studentId: string;
  type: AppealType;
  reason: string;
  expectedScore?: number;
  evidence?: string;
  status: AppealStatus;
  teacherComment?: string;
  meetingTime?: string;
  createdAt: string;
  updatedAt: string;
  grade: {
    id: string;
    score: number;
    course: {
      id: string;
      code: string;
      name: string;
    };
    student: {
      id: string;
      name: string;
      email: string;
    };
    teacher: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// 将申诉类型转换为中文
const translateAppealType = (type: AppealType): string => {
  const typeMap: Record<AppealType, string> = {
    'SCORE_ERROR': '分数错误',
    'CALCULATION_ERROR': '计算错误',
    'MISSING_POINTS': '漏计分数',
    'OTHER': '其他原因'
  };
  return typeMap[type] || '未知';
};

// 将申诉状态转换为中文
const translateAppealStatus = (status: AppealStatus): string => {
  const statusMap: Record<AppealStatus, string> = {
    'PENDING': '等待处理',
    'REVIEWING': '正在审核',
    'RESOLVED': '已解决',
    'REJECTED': '已拒绝'
  };
  return statusMap[status] || '未知';
};

// 获取状态对应的标签颜色
const getStatusColor = (status: AppealStatus): string => {
  const colorMap: Record<AppealStatus, string> = {
    'PENDING': 'blue',
    'REVIEWING': 'orange',
    'RESOLVED': 'green',
    'REJECTED': 'red'
  };
  return colorMap[status] || 'default';
};

export default function AppealDetail() {
  const router = useRouter();
  const params = useParams();
  const appealId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appeal, setAppeal] = useState<AppealData | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 加载申诉数据
  useEffect(() => {
    async function fetchAppealData() {
      try {
        // 获取用户信息
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          throw new Error('获取用户信息失败');
        }
        
        const userData = await userResponse.json();
        if (!userData || !userData.user) {
          setError('用户未登录');
          setLoading(false);
          return;
        }
        
        setUserRole(userData.user.role);
        setUserId(userData.user.id);
        
        // 获取申诉详情
        const response = await fetch(`/api/grades/appeals/${appealId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('申诉不存在');
          } else if (response.status === 403) {
            setError('您无权查看此申诉');
          } else {
            throw new Error('获取申诉详情失败');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setAppeal(data.appeal);
        setLoading(false);
      } catch (err: any) {
        console.error('加载申诉详情失败:', err);
        setError(err.message || '加载申诉详情失败');
        setLoading(false);
      }
    }
    
    fetchAppealData();
  }, [appealId]);
  
  // 切换到编辑模式
  const enableEditMode = () => {
    setEditMode(true);
    
    // 初始化表单值
    if (appeal) {
      const initialValues: any = {
        status: appeal.status,
        teacherComment: appeal.teacherComment || '',
      };
      
      if (appeal.meetingTime) {
        initialValues.meetingTime = dayjs(appeal.meetingTime);
      }
      
      // 如果是学生且申诉状态为待处理，可以编辑申诉内容
      if (userRole === 'STUDENT' && appeal.status === 'PENDING') {
        initialValues.reason = appeal.reason;
        initialValues.type = appeal.type;
        initialValues.expectedScore = appeal.expectedScore;
        initialValues.evidence = appeal.evidence || '';
      }
      
      form.setFieldsValue(initialValues);
    }
  };
  
  // 取消编辑
  const cancelEdit = () => {
    setEditMode(false);
    form.resetFields();
  };
  
  // 更新申诉
  const updateAppeal = async (values: any) => {
    try {
      setSubmitting(true);
      
      const updateData: any = { ...values };
      
      // 处理日期格式
      if (updateData.meetingTime) {
        updateData.meetingTime = updateData.meetingTime.toISOString();
      }
      
      const response = await fetch(`/api/grades/appeals/${appealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新申诉失败');
      }
      
      const data = await response.json();
      setAppeal(data.appeal);
      setEditMode(false);
      message.success('申诉已更新');
      
      // 刷新数据
      setLoading(true);
      const refreshResponse = await fetch(`/api/grades/appeals/${appealId}`);
      const refreshData = await refreshResponse.json();
      setAppeal(refreshData.appeal);
      setLoading(false);
    } catch (err: any) {
      message.error(err.message || '更新申诉失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 删除申诉
  const deleteAppeal = async () => {
    try {
      const response = await fetch(`/api/grades/appeals/${appealId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除申诉失败');
      }
      
      message.success('申诉已删除');
      router.push('/analytics');
    } catch (err: any) {
      message.error(err.message || '删除申诉失败');
    }
  };
  
  // 确认删除对话框
  const confirmDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个申诉吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: deleteAppeal
    });
  };
  
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <Alert message="错误" description={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }
  
  if (!appeal) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <Alert message="未找到" description="申诉数据不存在" type="warning" showIcon />
        </Content>
      </Layout>
    );
  }
  
  // 判断当前用户是否可以编辑申诉
  const canEdit = (
    // 管理员可以编辑任何申诉
    userRole === 'ADMIN' ||
    // 教师可以编辑属于自己课程的申诉
    (userRole === 'TEACHER' && userId === appeal.grade.teacher.id) ||
    // 学生只能在申诉状态为待处理时编辑自己的申诉
    (userRole === 'STUDENT' && userId === appeal.studentId && appeal.status === 'PENDING')
  );
  
  // 判断当前用户是否可以删除申诉
  const canDelete = (
    userRole === 'ADMIN' ||
    (userRole === 'STUDENT' && userId === appeal.studentId && appeal.status === 'PENDING')
  );
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BackButton />
              <Title level={3} style={{ margin: 0, marginLeft: 16 }}>申诉详情</Title>
            </div>
            <Tag color={getStatusColor(appeal.status)}>
              {translateAppealStatus(appeal.status)}
            </Tag>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card title="申诉信息" style={{ marginBottom: 16 }}>
                {editMode ? (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={updateAppeal}
                  >
                    {/* 学生编辑表单 */}
                    {userRole === 'STUDENT' && (
                      <>
                        <Form.Item
                          name="type"
                          label="申诉类型"
                          rules={[{ required: true, message: '请选择申诉类型' }]}
                        >
                          <Select>
                            <Option value="SCORE_ERROR">分数错误</Option>
                            <Option value="CALCULATION_ERROR">计算错误</Option>
                            <Option value="MISSING_POINTS">漏计分数</Option>
                            <Option value="OTHER">其他原因</Option>
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="expectedScore"
                          label="预期分数"
                          rules={[
                            { 
                              type: 'number', 
                              min: 0, 
                              max: 100, 
                              message: '分数必须在0-100之间' 
                            }
                          ]}
                        >
                          <Input type="number" placeholder="您认为的正确分数" />
                        </Form.Item>
                        
                        <Form.Item
                          name="reason"
                          label="申诉理由"
                          rules={[{ required: true, message: '请填写申诉理由' }]}
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                        
                        <Form.Item
                          name="evidence"
                          label="证据说明"
                        >
                          <TextArea rows={3} />
                        </Form.Item>
                      </>
                    )}
                    
                    {/* 教师/管理员编辑表单 */}
                    {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
                      <>
                        <Form.Item
                          name="status"
                          label="申诉状态"
                          rules={[{ required: true, message: '请选择状态' }]}
                        >
                          <Select>
                            <Option value="PENDING">待处理</Option>
                            <Option value="REVIEWING">审核中</Option>
                            <Option value="RESOLVED">已解决</Option>
                            <Option value="REJECTED">已拒绝</Option>
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="teacherComment"
                          label="教师评论"
                        >
                          <TextArea rows={4} />
                        </Form.Item>
                        
                        <Form.Item
                          name="meetingTime"
                          label="约定面谈时间(可选)"
                        >
                          <DatePicker showTime format="YYYY-MM-DD HH:mm" />
                        </Form.Item>
                      </>
                    )}
                    
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                          保存
                        </Button>
                        <Button onClick={cancelEdit}>
                          取消
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                ) : (
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="申诉类型">
                      {translateAppealType(appeal.type)}
                    </Descriptions.Item>
                    
                    {appeal.expectedScore && (
                      <Descriptions.Item label="预期分数">
                        {appeal.expectedScore} 分
                      </Descriptions.Item>
                    )}
                    
                    <Descriptions.Item label="申诉理由">
                      {appeal.reason}
                    </Descriptions.Item>
                    
                    {appeal.evidence && (
                      <Descriptions.Item label="证据说明">
                        {appeal.evidence}
                      </Descriptions.Item>
                    )}
                    
                    <Descriptions.Item label="申诉时间">
                      {new Date(appeal.createdAt).toLocaleString('zh-CN')}
                    </Descriptions.Item>
                    
                    {appeal.teacherComment && (
                      <Descriptions.Item label="教师评论">
                        {appeal.teacherComment}
                      </Descriptions.Item>
                    )}
                    
                    {appeal.meetingTime && (
                      <Descriptions.Item label="面谈时间">
                        {new Date(appeal.meetingTime).toLocaleString('zh-CN')}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                )}
              </Card>
              
              {!editMode && canEdit && (
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Button type="primary" onClick={enableEditMode}>
                      编辑申诉
                    </Button>
                    {canDelete && (
                      <Button danger onClick={confirmDelete}>
                        删除申诉
                      </Button>
                    )}
                  </Space>
                </div>
              )}
            </Col>
            
            <Col xs={24} md={8}>
              <Card title="成绩信息">
                <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                  {appeal.grade.score.toFixed(1)}
                  <span style={{ fontSize: 14, marginLeft: 4, color: 'rgba(0, 0, 0, 0.45)' }}>分</span>
                </div>
                
                <Descriptions column={1}>
                  <Descriptions.Item label="课程">
                    {appeal.grade.course.name} ({appeal.grade.course.code})
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="学生">
                    {appeal.grade.student.name}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="教师">
                    {appeal.grade.teacher.name}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
} 