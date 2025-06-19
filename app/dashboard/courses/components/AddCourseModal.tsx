'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Typography, Space, Avatar, Tag, Rate, Tooltip, Spin } from 'antd';
import { BookOutlined, NumberOutlined, CalendarOutlined, FileTextOutlined, ReadOutlined, RocketOutlined, BulbOutlined, TeamOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';




};

type Course = {
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
  difficulty?: number;
  teacherIds?: string[];
};

type AddCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
};

export default function AddCourseModal({ isOpen, onClose, onAddCourse }: AddCourseModalProps) {
  const [form] = Form.useForm();
  const [difficulty, setDifficulty] = useState(3);
  const [preview, setPreview] = useState(false);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // 表单标题样式
  const formItemLabelStyle = {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  // 获取所有教师
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

const fetchTeachers = async () => {
  try {
    setLoadingTeachers(true);
    const response = await fetch('/api/newuser?role=TEACHER', {
      credentials: 'include'
    });
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error('获取教师列表失败');
    }
    const data = await response.json();
    console.log('Fetched teachers data:', data);
    setTeachers(data);
  } catch (error) {
    console.error('获取教师错误:', error);
  } finally {
    setLoadingTeachers(false);
  }
};

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setDifficulty(3);
    setPreview(false);
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // 添加课程难度
        values.difficulty = difficulty;
        onAddCourse(values);
        form.resetFields();
        setDifficulty(3);
        setPreview(false);
      })
      .catch(info => {
        console.log('验证失败:', info);
      });
  };

  // 获取课程难度标签
  const getDifficultyTag = (level: number) => {
    if (level <= 1) return <Tag color="success">简单</Tag>;
    if (level <= 3) return <Tag color="warning">中等</Tag>;
    return <Tag color="error">困难</Tag>;
  };

  // 生成学期选项
  const generateSemesters = () => {
    const semesters = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year <= currentYear + 2; year++) {
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

  // 课程预览卡片
  const renderPreviewCard = () => {
    const values = form.getFieldsValue();
    if (!values.code || !values.name) return null;

    return (
      <div style={{
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px',
        background: '#fafafa'
      }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Avatar
                icon={<BookOutlined />}
                style={{ backgroundColor: '#1677ff' }}
                size="large"
              />
              <div>
                <Text strong style={{ fontSize: '16px' }}>{values.name || '课程名称'}</Text>
                <div>
                  <Text code>{values.code || 'CODE000'}</Text>
                </div>
              </div>
            </Space>
            <Rate
              character={<BulbOutlined />}
              value={difficulty}
              disabled
              style={{ fontSize: '14px' }}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <Space wrap>
              {getDifficultyTag(difficulty)}
              <Tag color="processing">{values.credit || 3} 学分</Tag>
              <Tag color="default">{values.semester ? values.semester.replace('-', '~').replace('-', ' 学期') : '2023~2024 学期1'}</Tag>
            </Space>
          </div>

          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" ellipsis={{ rows: 2 }}>{values.description || '课程描述信息...'}</Text>
          </div>
        </Space>
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
          <Title level={5} style={{ margin: 0 }}>添加新课程</Title>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          code: '',
          name: '',
          description: '',
          credit: 3,
          semester: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}-1`,
          teacherIds: []
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="code"
          label={<div style={formItemLabelStyle}><BookOutlined /> 课程代码</div>}
          rules={[{ required: true, message: '请输入课程代码' }]}
          tooltip="课程代码通常由字母和数字组成，例如CS101"
        >
          <Input placeholder="例如：CS101" />
        </Form.Item>

        <Form.Item
          name="name"
          label={<div style={formItemLabelStyle}><ReadOutlined /> 课程名称</div>}
          rules={[{ required: true, message: '请输入课程名称' }]}
        >
          <Input placeholder="例如：计算机科学导论" />
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
          label={<div style={formItemLabelStyle}><TeamOutlined /> 课程教师</div>}
          tooltip="选择负责教授此课程的教师"
        >
          <Select
            mode="multiple"
            placeholder="选择教师"
            loading={loadingTeachers}
            notFoundContent={loadingTeachers ? <Spin size="small" /> : "没有找到教师"}
            optionFilterProp="children"
          >
            {teachers.map(teacher => (
              <Option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={<div style={formItemLabelStyle}><RocketOutlined /> 课程难度</div>}
          tooltip="设置课程的难度等级，帮助学生选课"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Rate
              character={<BulbOutlined />}
              value={difficulty}
              onChange={setDifficulty}
            />
            {getDifficultyTag(difficulty)}
          </div>
        </Form.Item>

        {preview && renderPreviewCard()}

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleReset}>
              重置
            </Button>
            <Tooltip title="预览课程卡片">
              <Button
                type="default"
                icon={<BookOutlined />}
                onClick={() => setPreview(!preview)}
              >
                {preview ? '关闭预览' : '预览课程'}
              </Button>
            </Tooltip>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<RocketOutlined />}
            >
              创建课程
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
} 