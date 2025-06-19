'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Typography, Space, Avatar, Tag, Tooltip, Tabs, Alert, Badge, Divider, Spin, Slider, message } from 'antd';
import { BookOutlined, EditOutlined, SaveOutlined, ReadOutlined, FileTextOutlined, NumberOutlined, CalendarOutlined, RocketOutlined, HistoryOutlined, CheckOutlined, CodeOutlined, TeamOutlined } from '@ant-design/icons';
import CourseImageUpload from './CourseImageUpload';
import Link from 'next/link';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

type Course = {
  id: string;
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
  difficulty?: number;
  teachers?: User[];
  teacherIds?: string[];
  imageUrl?: string | null;
  progress?: number | null;
};

type EditCourseModalProps = {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEditCourse: (course: Course) => void;
};

export default function EditCourseModal({ course, isOpen, onClose, onEditCourse }: EditCourseModalProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('edit');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState<Course>({} as Course);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courseImageUrl, setCourseImageUrl] = useState<string | null>(null);

  // 表单标题样式
  const formItemLabelStyle = {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  // 获取所有教师
  useEffect(() => {
    const fetchAllTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const response = await fetch('/api/newuser?role=TEACHER', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`获取教师列表失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTeachers(data || []);
      } catch (error) {
        console.error('获取教师错误:', error);
        message.error('加载教师列表失败，请重试');
      } finally {
        setLoadingTeachers(false);
      }
    };

    if (isOpen) fetchAllTeachers();
  }, [isOpen]);

  // 获取课程已分配教师
  useEffect(() => {
    const fetchAssignedTeachers = async () => {
      try {
        if (!course.id) return;
        
        const response = await fetch(`/api/courses/${course.id}/teachers`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`获取课程教师失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        form.setFieldValue('teacherIds', data.map(t => t.id));
      } catch (error) {
        console.error('获取已分配教师错误:', error);
        message.error('加载已分配教师失败，请重试');
      }
    };

    if (isOpen && course.id) fetchAssignedTeachers();
  }, [isOpen, course.id, form]);

  // 初始化表单和原始值
  useEffect(() => {
    if (course.id) {
      form.setFieldsValue({
        code: course.code,
        name: course.name,
        description: course.description,
        credit: course.credit,
        semester: course.semester,
        progress: course.progress || 0,
        teacherIds: course.teacherIds || []
      });
      setOriginalValues({ ...course });
      setCourseImageUrl(course.imageUrl || null);
    }
  }, [course, form]);

  // 监听表单变化
  const handleValuesChange = () => {
    const currentValues = form.getFieldsValue();
    
    // 检查是否有任何字段与原始值不同
    const hasDiff = Object.keys(currentValues).some(key => {
      const originalValue = originalValues[key];
      const currentValue = currentValues[key];
      
      // 处理数组类型（如教师ID）
      if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
        return JSON.stringify(currentValue.sort()) !== JSON.stringify(originalValue.sort());
      }
      
      // 处理普通值类型
      return currentValue !== originalValue;
    });
    
    setHasChanges(hasDiff);
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      code: originalValues.code,
      name: originalValues.name,
      description: originalValues.description,
      credit: originalValues.credit,
      semester: originalValues.semester,
      progress: originalValues.progress || 0,
      teacherIds: originalValues.teacherIds || []
    });
    setCourseImageUrl(originalValues.imageUrl || null);
    setHasChanges(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const teacherIds = values.teacherIds || [];
      
      // 构建更新数据
      const updatedCourse: Course = {
        id: course.id,
        code: values.code,
        name: values.name,
        description: values.description,
        credit: values.credit,
        semester: values.semester,
        progress: values.progress,
        teacherIds,
        imageUrl: courseImageUrl
      };

      setLoading(true);
      await onEditCourse(updatedCourse);
      message.success('课程更新成功');
      onClose();
      setHasChanges(false);
    } catch (error) {
      console.error('提交失败:', error);
      message.error('更新失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  // 生成学期选项
  const generateSemesters = () => {
    const currentYear = new Date().getFullYear();
    const semesters = [];
    for (let year = currentYear - 1; year <= currentYear + 2; year++) {
      semesters.push({
        value: `${year}-${year + 1}-1`,
        label: `${year}-${year + 1} 第一学期`
      });
      semesters.push({
        value: `${year}-${year + 1}-2`,
        label: `${year}-${year + 1} 第二学期`
      });
    }
    return semesters;
  };

  // 渲染变更对比
  const renderComparison = () => {
    const currentValues = form.getFieldsValue();
    return (
      <div style={{ marginTop: 16 }}>
        <Alert
          message="课程修改对比"
          description="您可以查看修改前后课程信息的变化"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider orientation="left">课程代码</Divider>
        <Space>
          <Tag icon={<HistoryOutlined />} color="default">原值: {originalValues.code}</Tag>
          {currentValues.code !== originalValues.code && (
            <Tag icon={<EditOutlined />} color="blue">新值: {currentValues.code}</Tag>
          )}
        </Space>

        <Divider orientation="left">课程名称</Divider>
        <Space>
          <Tag icon={<HistoryOutlined />} color="default">原值: {originalValues.name}</Tag>
          {currentValues.name !== originalValues.name && (
            <Tag icon={<EditOutlined />} color="blue">新值: {currentValues.name}</Tag>
          )}
        </Space>

        <Divider orientation="left">学分</Divider>
        <Space>
          <Tag icon={<HistoryOutlined />} color="default">原值: {originalValues.credit}</Tag>
          {currentValues.credit !== originalValues.credit && (
            <Tag icon={<EditOutlined />} color="blue">新值: {currentValues.credit}</Tag>
          )}
        </Space>

        <Divider orientation="left">学期</Divider>
        <Space>
          <Tag icon={<HistoryOutlined />} color="default">
            原值: {originalValues.semester ? originalValues.semester.replace('-', '~').replace('-', ' 学期') : ''}
          </Tag>
          {currentValues.semester !== originalValues.semester && (
            <Tag icon={<EditOutlined />} color="blue">
              新值: {currentValues.semester ? currentValues.semester.replace('-', '~').replace('-', ' 学期') : ''}
            </Tag>
          )}
        </Space>

        <Divider orientation="left">课程教师</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>原分配教师：</Text>
            <div style={{ marginTop: 8 }}>
              {(originalValues.teacherIds || []).length > 0 ? (
                originalValues.teacherIds.map((id: string) => {
                  const teacher = teachers.find(t => t.id === id);
                  return teacher ? (
                    <Tag key={id} color="default" style={{ marginBottom: 4 }}>
                      {teacher.name} ({teacher.email})
                    </Tag>
                  ) : null;
                })
              ) : (
                <Tag color="default">未分配教师</Tag>
              )}
            </div>
          </div>

          {JSON.stringify(currentValues.teacherIds || []) !== JSON.stringify(originalValues.teacherIds || []) && (
            <div style={{ marginTop: 8 }}>
              <Text strong type="success">新分配教师：</Text>
              <div style={{ marginTop: 8 }}>
                {(currentValues.teacherIds || []).length > 0 ? (
                  currentValues.teacherIds.map((id: string) => {
                    const teacher = teachers.find(t => t.id === id);
                    return teacher ? (
                      <Tag key={id} color="blue" style={{ marginBottom: 4 }}>
                        {teacher.name} ({teacher.email})
                      </Tag>
                    ) : null;
                  })
                ) : (
                  <Tag color="default">未分配教师</Tag>
                )}
              </div>
            </div>
          )}
        </Space>

        <Divider orientation="left">课程描述</Divider>
        <div>
          <Paragraph>
            <Text strong>原描述：</Text>
          </Paragraph>
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            maxHeight: '120px',
            overflow: 'auto'
          }}>
            {originalValues.description}
          </div>

          {currentValues.description !== originalValues.description && (
            <>
              <Paragraph>
                <Text strong type="success">新描述：</Text>
              </Paragraph>
              <div style={{
                background: '#e6f7ff',
                padding: '12px',
                borderRadius: '8px',
                maxHeight: '120px',
                overflow: 'auto'
              }}>
                {currentValues.description}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // 处理图片URL更新
  const handleImageUpdate = (imageUrl: string | null) => {
    setCourseImageUrl(imageUrl);
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar
            icon={<BookOutlined />}
            style={{ backgroundColor: '#1677ff' }}
          />
          <div>
            <Title level={5} style={{ margin: 0 }}>{hasChanges ? '编辑课程' : course.name}</Title>
            <Text type="secondary" code style={{ fontSize: '12px' }}>{course.code}</Text>
          </div>
          {hasChanges && (
            <Badge count={Object.keys(form.getFieldsValue()).filter(key => {
              // 手动检查字段是否变更
              const original = originalValues[key];
              const current = form.getFieldValue(key);
              
              if (Array.isArray(current) && Array.isArray(original)) {
                return JSON.stringify(current.sort()) !== JSON.stringify(original.sort());
              }
              
              return current !== original;
            }).length} />
          )}
        </Space>
      }
      open={isOpen}
      onCancel={() => {
        if (hasChanges) {
          Modal.confirm({
            title: '确定要放弃修改吗?',
            content: '您有未保存的修改将会丢失。',
            okText: '放弃修改',
            cancelText: '继续编辑',
            onOk: () => {
              handleReset();
              onClose();
            }
          });
        } else {
          onClose();
        }
      }}
      width={650}
      footer={null}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'edit',
            label: (
              <span>
                <EditOutlined /> 编辑信息
              </span>
            ),
            children: (
              <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="code"
                  label={<div style={formItemLabelStyle}><CodeOutlined /> 课程代码</div>}
                  rules={[{ required: true, message: '请输入课程代码' }]}
                  tooltip="课程代码通常由字母和数字组成，例如CS101"
                >
                  <Input
                    placeholder="例如：CS101"
                    prefix={<CodeOutlined style={{ color: '#1677ff' }} />}
                  />
                </Form.Item>

                <Form.Item
                  name="name"
                  label={<div style={formItemLabelStyle}><ReadOutlined /> 课程名称</div>}
                  rules={[{ required: true, message: '请输入课程名称' }]}
                >
                  <Input
                    placeholder="例如：计算机科学导论"
                    prefix={<ReadOutlined style={{ color: '#1677ff' }} />}
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label={<div style={formItemLabelStyle}><FileTextOutlined /> 课程描述</div>}
                  rules={[{ required: true, message: '请输入课程描述' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="请输入课程的详细描述，包括教学目标、内容概要等..."
                    showCount
                    maxLength={500}
                  />
                </Form.Item>

                <Form.Item
                  name="credit"
                  label={<div style={formItemLabelStyle}><NumberOutlined /> 学分</div>}
                  rules={[{ required: true, message: '请输入学分' }]}
                  tooltip="学分通常为0.5的整数倍，例如1, 1.5, 2等"
                >
                  <InputNumber
                    min={0.5}
                    max={10}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="请输入学分数量"
                    prefix={<NumberOutlined style={{ color: '#1677ff' }} />}
                  />
                </Form.Item>

                <Form.Item
                  name="semester"
                  label={<div style={formItemLabelStyle}><CalendarOutlined /> 学期</div>}
                  rules={[{ required: true, message: '请选择学期' }]}
                >
                  <Select placeholder="请选择学期">
                    {generateSemesters().map(semester => (
                      <Option key={semester.value} value={semester.value}>
                        {semester.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="teacherIds"
                  label={<div style={formItemLabelStyle}><TeamOutlined /> 教师分配</div>}
                  rules={[{ required: true, message: '请选择教师' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择教师"
                    style={{ width: '100%' }}
                    loading={loadingTeachers}
                    notFoundContent={loadingTeachers ? <Spin size="small" /> : "没有找到教师"}
                  >
                    {teachers.map(teacher => (
                      <Option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="progress"
                  label={<div style={formItemLabelStyle}><RocketOutlined /> 教学进度</div>}
                  tooltip="设置当前课程的教学进度百分比"
                >
                  <div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      marks={{
                        0: '0%',
                        25: '25%',
                        50: '50%',
                        75: '75%',
                        100: '100%'
                      }}
                      onChange={(value) => {
                        form.setFieldValue('progress', value);
                        handleValuesChange();
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Text type="secondary">
                        {form.getFieldValue('progress') || 0}% 完成
                      </Text>
                    </div>
                  </div>
                </Form.Item>

                {/* 简化的课程信息展示 */}
                <div style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '20px',
                  background: '#fafafa'
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#1677ff',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <RocketOutlined style={{ marginRight: '8px' }} />
                    课程状态信息
                  </h3>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      minWidth: '100px',
                      fontWeight: 'bold'
                    }}>
                      课程状态:
                    </div>
                    <div>
                      <Tag color="processing">教学进行中</Tag>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      minWidth: '100px',
                      fontWeight: 'bold'
                    }}>
                      当前进度:
                    </div>
                    <div>
                      <span style={{
                        color: '#52c41a',
                        fontWeight: 'bold'
                      }}>{form.getFieldValue('progress') || 0}%</span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      minWidth: '100px',
                      fontWeight: 'bold'
                    }}>
                      授课教师:
                    </div>
                    <div>
                      {loadingTeachers ? (
                        <Spin size="small" />
                      ) : (
                        <div>
                          {(form.getFieldValue('teacherIds')?.length > 0 || (course?.teachers && course.teachers.length > 0)) ? (
                            <div>
                              {(form.getFieldValue('teacherIds') || (course?.teachers ? course.teachers.map(t => t.id) : [])).map((teacherId: string) => {
                                const teacher = teachers.find(t => t.id === teacherId);
                                return teacher ? (
                                  <Tag
                                    key={teacher.id}
                                    color="blue"
                                    style={{
                                      margin: '0 4px 4px 0',
                                      fontSize: '13px',
                                      padding: '2px 8px'
                                    }}
                                  >
                                    {teacher.name}
                                  </Tag>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span style={{ color: '#fa8c16' }}>未分配教师</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      minWidth: '100px',
                      fontWeight: 'bold'
                    }}>
                      学生数量:
                    </div>
                    <div>
                      <span>1 名学生</span>
                      <Link href={`/dashboard/courses/${course.id}/students`} passHref>
                        <Button
                          type="link"
                          size="small"
                          style={{ marginLeft: 8, padding: 0 }}
                        >
                          管理学生
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <Divider orientation="left">课程信息</Divider>

                <Form.Item label="课程图片">
                  <CourseImageUpload
                    courseId={course.id}
                    currentImageUrl={courseImageUrl}
                    onImageUpdate={handleImageUpdate}
                  />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    {hasChanges && (
                      <Tooltip title="查看修改前后对比">
                        <Button
                          type="default"
                          icon={<CheckOutlined />}
                          onClick={() => setActiveTab('compare')}
                        >
                          查看变更
                        </Button>
                      </Tooltip>
                    )}
                    <Button
                      onClick={handleReset}
                      icon={<HistoryOutlined />}
                      disabled={!hasChanges}
                    >
                      重置
                    </Button>
                    <Button onClick={onClose}>
                      取消
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      disabled={!hasChanges || loading}
                    >
                      {loading ? '保存中...' : '保存修改'}
                    </Button>
                  </Space>
                </div>
              </Form>
            )
          },
          {
            key: 'compare',
            label: (
              <span>
                <CheckOutlined /> 变更对比
              </span>
            ),
            children: (
              <>
                {renderComparison()}
                <div style={{ textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    <Button
                      onClick={() => setActiveTab('edit')}
                      icon={<EditOutlined />}
                    >
                      返回编辑
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSubmit}
                      disabled={!hasChanges || loading}
                    >
                      {loading ? '保存中...' : '保存修改'}
                    </Button>
                  </Space>
                </div>
              </>
            ),
            disabled: !hasChanges
          }
        ]}
      />
    </Modal>
  );
}