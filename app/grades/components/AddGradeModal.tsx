'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, message, Typography, Space, Avatar, Tag, Divider, Progress, Tooltip, Steps, Result, Card, Alert } from 'antd';
import { UserOutlined, BookOutlined, TrophyOutlined, SaveOutlined, CloseOutlined, QuestionCircleOutlined, RiseOutlined, PercentageOutlined, TeamOutlined, ReadOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Step } = Steps;

// 定义用户和课程类型
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Course = {
  id: string;
  code: string;
  name: string;
  credit: number;
  semester: string;
};

// 定义属性类型
type AddGradeModalProps = {
  students: User[];
  courses: Course[];
  onSubmit: (data: { studentId: string; courseId: string; score: number }) => void;
  onClose: () => void;
  isOpen: boolean;
  loading: boolean;
};

export default function AddGradeModal({
  students,
  courses,
  onSubmit,
  onClose,
  isOpen,
  loading
}: AddGradeModalProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [formValid, setFormValid] = useState(false);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setSelectedStudent(null);
      setSelectedCourse(null);
      setSelectedScore(null);
      setFormValid(false);
      form.resetFields();
    }
  }, [isOpen, form]);

  // 根据分数获取成绩等级
  const getGradeLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: '#52c41a' };
    if (score >= 80) return { text: '良好', color: '#1890ff' };
    if (score >= 70) return { text: '中等', color: '#faad14' };
    if (score >= 60) return { text: '及格', color: '#fa8c16' };
    return { text: '不及格', color: '#f5222d' };
  };

  // 处理学生选择变化
  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student || null);

    // 判断当前步骤是否已完成
    checkStepCompletion();
  };

  // 处理课程选择变化
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);

    // 判断当前步骤是否已完成
    checkStepCompletion();
  };

  // 处理分数变化
  const handleScoreChange = (value: number | null) => {
    setSelectedScore(value);

    // 判断当前步骤是否已完成
    checkStepCompletion();
  };

  // 检查当前步骤是否完成，更新表单有效性
  const checkStepCompletion = () => {
    try {
      form.validateFields().then(() => {
        setFormValid(true);
      }).catch(() => {
        setFormValid(false);
      });
    } catch (e) {
      setFormValid(false);
    }
  };

  // 下一步
  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 提交表单
  const handleFinish = (values: any) => {
    onSubmit({
      studentId: values.studentId,
      courseId: values.courseId,
      score: values.score
    });
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 选择学生
        return (
          <Form.Item
            name="studentId"
            label={
              <Space>
                <TeamOutlined />
                <span>选择学生</span>
              </Space>
            }
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select
              placeholder="请选择学生"
              showSearch
              optionFilterProp="children"
              onChange={handleStudentChange}
              size="large"
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {students.map(student => (
                <Select.Option
                  key={student.id}
                  value={student.id}
                  label={student.name}
                >
                  <Space>
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#87d068' }}
                      size="small"
                    >
                      {student.name[0]}
                    </Avatar>
                    {student.name}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ({student.email})
                    </Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 1: // 选择课程
        return (
          <Form.Item
            name="courseId"
            label={
              <Space>
                <ReadOutlined />
                <span>选择课程</span>
              </Space>
            }
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select
              placeholder="请选择课程"
              showSearch
              optionFilterProp="children"
              onChange={handleCourseChange}
              size="large"
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {courses.map(course => (
                <Select.Option
                  key={course.id}
                  value={course.id}
                  label={`${course.code} - ${course.name}`}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <BookOutlined />
                      <Text strong>{course.name}</Text>
                      <Tag color="blue">{course.code}</Tag>
                    </Space>
                    <Space style={{ fontSize: '12px' }}>
                      <Text type="secondary">学期: {course.semester}</Text>
                      <Text type="secondary">学分: {course.credit}</Text>
                    </Space>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 2: // 输入成绩
        return (
          <>
            <Form.Item
              name="score"
              label={
                <Space>
                  <TrophyOutlined />
                  <span>输入成绩分数</span>
                </Space>
              }
              rules={[
                { required: true, message: '请输入成绩' },
                { type: 'number', min: 0, max: 100, message: '成绩必须在0-100之间' }
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                style={{ width: '100%' }}
                placeholder="请输入0-100之间的成绩"
                onChange={handleScoreChange}
                size="large"
                addonAfter="分"
              />
            </Form.Item>

            {selectedScore !== null && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(selectedScore)}
                  status={selectedScore >= 60 ? 'success' : 'exception'}
                  format={percent => (
                    <span style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {percent} <PercentageOutlined style={{ fontSize: 16 }} />
                    </span>
                  )}
                />
                <div style={{ marginTop: 12 }}>
                  <Tag color={getGradeLevel(selectedScore).color} style={{ padding: '0 16px', fontSize: 16 }}>
                    {getGradeLevel(selectedScore).text}
                  </Tag>
                </div>
              </div>
            )}
          </>
        );

      case 3: // 确认信息
        return (
          <div style={{ textAlign: 'center' }}>
            <Alert
              message="请确认以下成绩信息"
              description="确认无误后点击提交按钮完成成绩录入"
              type="info"
              showIcon
              style={{ marginBottom: 24, textAlign: 'left' }}
            />

            <Card bordered={false} style={{ background: '#f5f5f5', marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="center">
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} size="large">
                    {selectedStudent?.name?.[0]}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{selectedStudent?.name}</Text>
                    <br />
                    <Text type="secondary">{selectedStudent?.email}</Text>
                  </div>
                </Space>

                <Divider />

                <Space align="center">
                  <Avatar icon={<BookOutlined />} style={{ backgroundColor: '#1890ff' }} size="large" />
                  <div>
                    <Space>
                      <Text strong style={{ fontSize: 16 }}>{selectedCourse?.name}</Text>
                      <Tag color="blue">{selectedCourse?.code}</Tag>
                    </Space>
                    <br />
                    <Text type="secondary">学期: {selectedCourse?.semester}</Text>
                  </div>
                </Space>

                <Divider />

                <div style={{ textAlign: 'center' }}>
                  <Title level={2} style={{ color: getGradeLevel(selectedScore || 0).color, margin: 0 }}>
                    {selectedScore} <Text type="secondary" style={{ fontSize: 14 }}>分</Text>
                  </Title>
                  <Tag color={getGradeLevel(selectedScore || 0).color} style={{ padding: '0 16px', fontSize: 14, marginTop: 8 }}>
                    {getGradeLevel(selectedScore || 0).text}
                  </Tag>
                </div>
              </Space>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar icon={<PlusOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <Title level={5} style={{ margin: 0 }}>添加成绩</Title>
        </Space>
      }
      open={isOpen}
      onCancel={() => {
        // 如果已经填写了部分内容，显示确认对话框
        if (selectedStudent || selectedCourse || selectedScore) {
          Modal.confirm({
            title: '确定要取消添加成绩吗？',
            content: '已填写的信息将会丢失。',
            okText: '确定取消',
            cancelText: '继续填写',
            onOk: onClose
          });
        } else {
          onClose();
        }
      }}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[
          {
            title: '选择学生',
            icon: <TeamOutlined />
          },
          {
            title: '选择课程',
            icon: <BookOutlined />
          },
          {
            title: '输入成绩',
            icon: <TrophyOutlined />
          },
          {
            title: '确认提交',
            icon: <CheckCircleOutlined />
          }
        ]}
        style={{ marginBottom: 36 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
      >
        {renderStepContent()}

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>
              取消
            </Button>

            {currentStep > 0 && (
              <Button onClick={prevStep}>
                上一步
              </Button>
            )}

            {currentStep < 3 && (
              <Button
                type="primary"
                onClick={nextStep}
                disabled={!formValid}
              >
                下一步
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                提交成绩
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
} 