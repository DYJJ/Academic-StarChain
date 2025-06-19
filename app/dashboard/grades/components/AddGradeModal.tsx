'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, message, Typography, Space, Avatar, Tag, Divider, Progress, Tooltip, Steps, Result, Card, Alert, Spin, Empty } from 'antd';
import { UserOutlined, BookOutlined, TrophyOutlined, SaveOutlined, CloseOutlined, QuestionCircleOutlined, RiseOutlined, PercentageOutlined, TeamOutlined, ReadOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const { Text, Title } = Typography;
const { Step } = Steps;

// 定义用户和课程类型
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
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
  courses: Course[];
  onSubmit: (data: { studentId: string; courseId: string; score: number }) => void;
  onClose: () => void;
  isOpen: boolean;
  loading: boolean;
};

export default function AddGradeModal({
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
  const [students, setStudents] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setSelectedStudent(null);
      setSelectedCourse(null);
      setSelectedScore(null);
      setFormValid(false);
      form.resetFields();
    } else {
      // 加载学生数据
      fetchStudents();
    }
  }, [isOpen, form]);

  // 加载学生数据
  const fetchStudents = async (search?: string) => {
    try {
      setSearchLoading(true);
      const url = search
        ? `/api/students?search=${encodeURIComponent(search)}`
        : '/api/students';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('获取学生列表失败:', error);
      message.error('获取学生列表失败');
    } finally {
      setSearchLoading(false);
    }
  };

  // 防抖处理搜索
  const debouncedSearch = debounce((value: string) => {
    fetchStudents(value);
  }, 300);

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
    setFormValid(!!studentId); // 只要选择了学生就允许下一步
  };

  // 处理课程选择变化
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setFormValid(!!courseId); // 只要选择了课程就允许下一步
  };

  // 处理分数变化
  const handleScoreChange = (value: number | null) => {
    setSelectedScore(value);
    setFormValid(value !== null && value >= 0 && value <= 100); // 只要输入了有效成绩就允许下一步
  };

  // 下一步
  const nextStep = () => {
    // 根据当前步骤验证相应的字段
    switch (currentStep) {
      case 0: // 验证学生选择
        if (form.getFieldValue('studentId')) {
          setCurrentStep(currentStep + 1);
        } else {
          message.error('请选择学生');
        }
        break;
      case 1: // 验证课程选择
        if (form.getFieldValue('courseId')) {
          setCurrentStep(currentStep + 1);
        } else {
          message.error('请选择课程');
        }
        break;
      case 2: // 验证成绩
        const score = form.getFieldValue('score');
        if (score !== undefined && score !== null && score >= 0 && score <= 100) {
          setCurrentStep(currentStep + 1);
        } else {
          message.error('请输入有效的成绩');
        }
        break;
      default:
        setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 提交表单
  const handleSubmit = () => {
    // 直接使用已选择的值，而不是从表单获取
    // 这样可以确保即使表单字段在步骤切换中未正确保存，我们仍然可以获取用户的选择
    if (!selectedStudent || !selectedCourse || selectedScore === null) {
      message.error('提交的数据不完整，请检查所有字段');
      return;
    }

    // 准备提交数据
    const submittingData = {
      studentId: selectedStudent.id,
      courseId: selectedCourse.id,
      score: Number(selectedScore)
    };

    // 再次验证数据是否完整
    if (!submittingData.studentId || !submittingData.courseId || submittingData.score === undefined) {
      message.error('提交的数据不完整，请检查所有字段');
      return;
    }

    // 验证分数范围
    if (submittingData.score < 0 || submittingData.score > 100) {
      message.error('成绩必须在0-100之间');
      return;
    }

    console.log('提交成绩数据:', submittingData);
    onSubmit(submittingData);
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
              filterOption={false}
              onSearch={(value) => debouncedSearch(value)}
              onChange={handleStudentChange}
              size="large"
              style={{ width: '100%' }}
              optionLabelProp="label"
              loading={searchLoading}
              notFoundContent={searchLoading ? <Spin size="small" /> : <Empty description="未找到学生" />}
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
                      src={student.avatarUrl}
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
              <Card className="mt-4">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Progress
                    percent={selectedScore}
                    status={selectedScore >= 60 ? 'success' : 'exception'}
                    strokeColor={getGradeLevel(selectedScore).color}
                  />
                  <div className="text-center">
                    <Tag color={getGradeLevel(selectedScore).color} style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {getGradeLevel(selectedScore).text}
                    </Tag>
                  </div>
                </Space>
              </Card>
            )}
          </>
        );

      case 3: // 确认提交
        return (
          <Card>
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="确认提交成绩"
              subTitle="请核对以下信息是否正确"
            />
            <div className="my-4">
              <Space direction="vertical" style={{ width: '100%' }}>
                {selectedStudent && (
                  <Card size="small" className="mb-2">
                    <Space>
                      <Avatar
                        icon={<UserOutlined />}
                        src={selectedStudent.avatarUrl}
                        style={{ backgroundColor: '#1890ff' }}
                      >
                        {selectedStudent.name[0]}
                      </Avatar>
                      <div>
                        <div><Text strong>学生: </Text>{selectedStudent.name}</div>
                        <div><Text type="secondary">{selectedStudent.email}</Text></div>
                      </div>
                    </Space>
                  </Card>
                )}

                {selectedCourse && (
                  <Card size="small" className="mb-2">
                    <Space>
                      <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      <div>
                        <div><Text strong>课程: </Text>{selectedCourse.name}</div>
                        <div>
                          <Space>
                            <Tag color="blue">{selectedCourse.code}</Tag>
                            <Text type="secondary">学分: {selectedCourse.credit}</Text>
                          </Space>
                        </div>
                      </div>
                    </Space>
                  </Card>
                )}

                {selectedScore !== null && (
                  <Card size="small">
                    <Space>
                      <TrophyOutlined style={{ fontSize: '24px', color: getGradeLevel(selectedScore).color }} />
                      <div>
                        <div><Text strong>成绩: </Text>{selectedScore}</div>
                        <div>
                          <Tag color={getGradeLevel(selectedScore).color}>
                            {getGradeLevel(selectedScore).text}
                          </Tag>
                        </div>
                      </div>
                    </Space>
                  </Card>
                )}
              </Space>
            </div>
            <Alert
              message="提交后说明"
              description="成绩提交后需等待管理员审核后方可生效。审核期间可以修改成绩。"
              type="info"
              showIcon
            />
          </Card>
        );

      default:
        return null;
    }
  };

  // 渲染页脚按钮
  const renderFooter = () => {
    const isLastStep = currentStep === 3;
    const isFirstStep = currentStep === 0;

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {!isFirstStep && (
            <Button onClick={prevStep} icon={<CloseOutlined />}>
              上一步
            </Button>
          )}
        </div>
        <div>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            取消
          </Button>
          {isLastStep ? (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              icon={<SaveOutlined />}
            >
              提交成绩
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={nextStep}
              icon={<PlusOutlined />}
            >
              下一步
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          <span>添加成绩</span>
          <Divider type="vertical" />
          <Text type="secondary">
            步骤 {currentStep + 1}/4
          </Text>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={renderFooter()}
      maskClosable={false}
    >
      <Steps current={currentStep} className="mb-8">
        <Step title="选择学生" icon={<TeamOutlined />} />
        <Step title="选择课程" icon={<ReadOutlined />} />
        <Step title="输入成绩" icon={<TrophyOutlined />} />
        <Step title="确认提交" icon={<CheckCircleOutlined />} />
      </Steps>

      <Form
        form={form}
        layout="vertical"
      >
        {renderStepContent()}
      </Form>
    </Modal>
  );
} 