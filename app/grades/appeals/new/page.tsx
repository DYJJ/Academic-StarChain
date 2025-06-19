'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Card, Spin, Alert, Row, Col, Button, Form, Input, Radio, message, Space, Descriptions } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import BackButton from '../../../components/BackButton';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// 申诉类型
type AppealType = 'SCORE_ERROR' | 'CALCULATION_ERROR' | 'MISSING_POINTS' | 'OTHER';

interface GradeData {
  id: string;
  score: number;
  course: {
    id: string;
    code: string;
    name: string;
    credit: number;
    semester: string;
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
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewAppeal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradeId = searchParams.get('gradeId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<GradeData | null>(null);
  const [form] = Form.useForm();
  
  // 加载成绩数据
  useEffect(() => {
    async function fetchGradeData() {
      if (!gradeId) {
        setError('缺少成绩ID参数');
        setLoading(false);
        return;
      }
      
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
        
        // 获取成绩详情
        const response = await fetch(`/api/grades/${gradeId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('成绩不存在');
          } else if (response.status === 403) {
            setError('您无权查看此成绩');
          } else {
            throw new Error('获取成绩详情失败');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setGrade(data.grade);
        
        // 验证该成绩是否属于当前学生
        if (userData.user.id !== data.grade.student.id) {
          setError('您无权为此成绩提交申诉');
          setLoading(false);
          return;
        }
        
        // 检查是否已经存在申诉
        const appealsResponse = await fetch('/api/grades/appeals');
        if (appealsResponse.ok) {
          const appealsData = await appealsResponse.json();
          const existingAppeal = appealsData.appeals.find(
            (appeal: any) => appeal.gradeId === gradeId && 
            ['PENDING', 'REVIEWING'].includes(appeal.status)
          );
          
          if (existingAppeal) {
            message.info('您已经对该成绩提交了申诉');
            router.push(`/grades/appeals/${existingAppeal.id}`);
            return;
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('加载成绩详情失败:', err);
        setError(err.message || '加载成绩详情失败');
        setLoading(false);
      }
    }
    
    fetchGradeData();
  }, [gradeId, router]);
  
  // 提交申诉
  const handleSubmit = async (values: any) => {
    if (!gradeId) return;
    
    try {
      setSubmitting(true);
      
      const appealData = {
        gradeId,
        type: values.type,
        reason: values.reason,
        expectedScore: values.expectedScore ? parseFloat(values.expectedScore) : undefined,
        evidence: values.evidence,
      };
      
      console.log('提交申诉数据:', appealData);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      try {
        const response = await fetch('/api/grades/appeals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appealData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMessage = '提交申诉失败';
          try {
            const errorData = await response.json();
            console.error('申诉提交失败:', response.status, errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('解析错误响应失败:', e);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        message.success('申诉已提交成功');
        
        // 跳转到申诉详情页
        router.push(`/grades/appeals/${data.appeal.id}`);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请稍后重试');
        } else {
          throw fetchError;
        }
      }
    } catch (err: any) {
      console.error('提交申诉处理错误:', err);
      message.error(err.message || '提交申诉失败');
    } finally {
      setSubmitting(false);
    }
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
  
  if (!grade) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <Alert message="未找到" description="成绩数据不存在" type="warning" showIcon />
        </Content>
      </Layout>
    );
  }
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <BackButton />
            <Title level={3} style={{ margin: 0, marginLeft: 16 }}>提交成绩申诉</Title>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card title="申诉表单" style={{ marginBottom: 16 }}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  initialValues={{
                    type: 'SCORE_ERROR',
                  }}
                >
                  <Form.Item
                    name="type"
                    label="申诉类型"
                    rules={[{ required: true, message: '请选择申诉类型' }]}
                  >
                    <Radio.Group>
                      <Radio value="SCORE_ERROR">分数错误</Radio>
                      <Radio value="CALCULATION_ERROR">计算错误</Radio>
                      <Radio value="MISSING_POINTS">漏计分数</Radio>
                      <Radio value="OTHER">其他原因</Radio>
                    </Radio.Group>
                  </Form.Item>
                  
                  <Form.Item
                    name="expectedScore"
                    label="预期分数"
                    rules={[
                      { 
                        type: 'number', 
                        min: 0, 
                        max: 100, 
                        message: '分数必须在0-100之间',
                        transform: val => parseFloat(val)
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
                    <TextArea 
                      rows={4} 
                      placeholder="请详细说明您对成绩有异议的原因..." 
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="evidence"
                    label="证据说明(可选)"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="例如: 测验卷上的第3题计算正确但被标记为错误..." 
                    />
                  </Form.Item>
                  
                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={submitting}
                      >
                        提交申诉
                      </Button>
                      <Button onClick={() => router.back()}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card title="成绩信息">
                <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                  {grade.score.toFixed(1)}
                  <span style={{ fontSize: 14, marginLeft: 4, color: 'rgba(0, 0, 0, 0.45)' }}>分</span>
                </div>
                
                <Descriptions column={1}>
                  <Descriptions.Item label="课程">
                    {grade.course.name} ({grade.course.code})
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="学期">
                    {grade.course.semester}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="学分">
                    {grade.course.credit}
                  </Descriptions.Item>
                  
                  <Descriptions.Item label="教师">
                    {grade.teacher.name}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              
              <Alert
                style={{ marginTop: 16 }}
                message="申诉提示"
                description="提交申诉后，教师将审核您的申诉并可能与您联系。请确保您提供的信息准确无误。"
                type="info"
                showIcon
              />
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
} 