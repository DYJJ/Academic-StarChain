'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Typography, Space, Avatar, Tag, Tooltip, Tabs, Alert, Badge, Divider } from 'antd';
import { BookOutlined, EditOutlined, SaveOutlined, ReadOutlined, FileTextOutlined, NumberOutlined, CalendarOutlined, RocketOutlined, HistoryOutlined, SwapOutlined, CheckOutlined, CodeOutlined } from '@ant-design/icons';
import { Course } from '../page';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
  const [changeCount, setChangeCount] = useState(0);
  const [originalValues, setOriginalValues] = useState<Course>({ ...course });

  // 表单标题样式
  const formItemLabelStyle = {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  // 初始化表单
  useEffect(() => {
    form.setFieldsValue({
      code: course.code,
      name: course.name,
      description: course.description,
      credit: course.credit,
      semester: course.semester
    });
    setOriginalValues({ ...course });
  }, [course, form]);

  // 监听表单变化
  const handleValuesChange = () => {
    // 计算变更数量
    const currentValues = form.getFieldsValue();
    const changes = [];

    if (currentValues.code !== originalValues.code) changes.push('课程代码');
    if (currentValues.name !== originalValues.name) changes.push('课程名称');
    if (currentValues.description !== originalValues.description) changes.push('课程描述');
    if (currentValues.credit !== originalValues.credit) changes.push('学分');
    if (currentValues.semester !== originalValues.semester) changes.push('学期');

    setChangeCount(changes.length);
    setHasChanges(changes.length > 0);
  };

  // 重置表单
  const handleReset = () => {
    form.setFieldsValue({
      code: course.code,
      name: course.name,
      description: course.description,
      credit: course.credit,
      semester: course.semester
    });
    setHasChanges(false);
    setChangeCount(0);
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        const updatedCourse = {
          id: course.id,
          ...values
        };
        onEditCourse(updatedCourse);
        setHasChanges(false);
        setChangeCount(0);
      })
      .catch(info => {
        console.log('验证失败:', info);
      });
  };

  // 生成学期选项
  const generateSemesters = () => {
    const semesters = [];
    const currentYear = new Date().getFullYear();

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

  // 展示修改前后对比
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
            原值: {originalValues.semester.replace('-', '~').replace('-', ' 学期')}
          </Tag>
          {currentValues.semester !== originalValues.semester && (
            <Tag icon={<EditOutlined />} color="blue">
              新值: {currentValues.semester.replace('-', '~').replace('-', ' 学期')}
            </Tag>
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
            <Badge count={changeCount} style={{ backgroundColor: '#52c41a' }} />
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

                <div style={{ textAlign: 'right', marginTop: 24 }}>
                  <Space>
                    {hasChanges && (
                      <Tooltip title="查看修改前后对比">
                        <Button
                          type="default"
                          icon={<SwapOutlined />}
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
                      disabled={!hasChanges}
                    >
                      保存修改
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
                <SwapOutlined /> 变更对比
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
                      disabled={!hasChanges}
                    >
                      保存修改
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