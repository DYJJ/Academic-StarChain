'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Typography, Descriptions, Space, Tag, Avatar, Tooltip, Progress, Alert, Divider, Switch, Spin, Empty } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, TrophyOutlined, BookOutlined, UserOutlined, SaveOutlined, UndoOutlined, PercentageOutlined, TeamOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const { Text, Title } = Typography;

// 定义成绩类型
type Grade = {
  id: string;
  score: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    code: string;
    name: string;
    credit: number;
    semester: string;
  };
};

// 定义用户类型
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

// 定义课程类型
type Course = {
  id: string;
  code: string;
  name: string;
  credit: number;
  semester: string;
};

// 定义属性类型
type EditGradeModalProps = {
  grade: Grade;
  onSubmit: (data: { id: string; studentId?: string; courseId?: string; score: number; status?: string }) => void;
  onClose: () => void;
  isOpen: boolean;
  loading: boolean;
  userRole: string;
};

export default function EditGradeModal({
  grade,
  onSubmit,
  onClose,
  isOpen,
  loading,
  userRole
}: EditGradeModalProps) {
  const [form] = Form.useForm();
  const [currentScore, setCurrentScore] = useState<number>(grade.score);
  const [originalScore, setOriginalScore] = useState<number>(grade.score);
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const isAdmin = userRole === 'ADMIN';

  // 添加学生和课程选择相关状态
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // 获取成绩级别
  const getGradeLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: '#52c41a' };
    if (score >= 80) return { text: '良好', color: '#1890ff' };
    if (score >= 70) return { text: '中等', color: '#faad14' };
    if (score >= 60) return { text: '及格', color: '#fa8c16' };
    return { text: '不及格', color: '#f5222d' };
  };

  // 状态标签样式
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Tag icon={<CheckCircleOutlined />} color="success">已验证</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">已拒绝</Tag>;
      default:
        return <Tag icon={<QuestionCircleOutlined />} color="warning">待验证</Tag>;
    }
  };

  // 加载学生和课程数据
  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchCourses();
    }
  }, [isOpen]);

  // 表单初始值
  useEffect(() => {
    // 安全地设置表单值，避免空值错误
    if (grade) {
      const formValues: Record<string, any> = {
        score: grade.score || 0
      };

      // 只有当student对象存在并且有id时才添加studentId字段
      if (grade.student && grade.student.id) {
        formValues.studentId = grade.student.id;
      }

      // 只有当course对象存在并且有id时才添加courseId字段
      if (grade.course && grade.course.id) {
        formValues.courseId = grade.course.id;
      }

      // 只有status存在时才设置状态
      if (grade.status) {
        formValues.status = grade.status;
      }

      form.setFieldsValue(formValues);
    }

    setCurrentScore(grade.score || 0);
    setOriginalScore(grade.score || 0);
    setHasChanged(false);
    
    // 安全地设置选中的学生
    if (grade.student) {
      setSelectedStudent({
        id: grade.student.id || '',
        name: grade.student.name || '未知学生',
        email: grade.student.email || '',
        role: 'STUDENT'
      });
    } else {
      setSelectedStudent(null);
    }
    
    // 安全地设置选中的课程
    if (grade.course) {
      setSelectedCourse({
        id: grade.course.id || '',
        code: grade.course.code || '',
        name: grade.course.name || '未知课程',
        credit: grade.course.credit || 0,
        semester: grade.course.semester || ''
      });
    } else {
      setSelectedCourse(null);
    }
  }, [grade, form, isOpen]);

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
    } finally {
      setSearchLoading(false);
    }
  };

  // 加载课程数据
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  };

  // 防抖处理搜索
  const debouncedSearch = debounce((value: string) => {
    fetchStudents(value);
  }, 300);

  // 处理学生选择变化
  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student || null);
    checkIfChanged();
  };

  // 处理课程选择变化
  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    checkIfChanged();
  };

  // 检查是否有变更
  const checkIfChanged = () => {
    const studentId = form.getFieldValue('studentId');
    const courseId = form.getFieldValue('courseId');
    const score = form.getFieldValue('score');
    const status = form.getFieldValue('status');

    // 安全检查对象是否存在
    const hasStudentChanged = studentId !== (grade.student?.id || '');
    const hasCourseChanged = courseId !== (grade.course?.id || '');
    const hasScoreChanged = score !== originalScore;
    const hasStatusChanged = isAdmin && status !== grade.status;

    setHasChanged(hasStudentChanged || hasCourseChanged || hasScoreChanged || hasStatusChanged);
  };

  // 处理分数变化
  const handleScoreChange = (value: number | null) => {
    if (value !== null) {
      setCurrentScore(value);
      checkIfChanged();
    }
  };

  // 处理状态变化
  const handleStatusChange = () => {
    checkIfChanged();
  };

  const handleFinish = (values: any) => {
    const updateData: { id: string; studentId?: string; courseId?: string; score: number; status?: string } = {
      id: grade.id,
      score: values.score
    };

    // 如果学生变更了
    if (grade.student && values.studentId !== grade.student.id) {
      updateData.studentId = values.studentId;
    }

    // 如果课程变更了
    if (grade.course && values.courseId !== grade.course.id) {
      updateData.courseId = values.courseId;
    }

    // 如果是管理员，可以修改状态
    if (isAdmin) {
      updateData.status = values.status;
    }

    onSubmit(updateData);
  };

  // 获取进度条状态
  const getProgressStatus = (score: number) => {
    if (score >= 60) return 'success';
    return 'exception';
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar icon={<TrophyOutlined />} style={{ backgroundColor: getGradeLevel(currentScore).color }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>编辑成绩</Title>
            <Text type="secondary">{hasChanged && '(有未保存的更改)'}</Text>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={() => {
        if (hasChanged) {
          Modal.confirm({
            title: '确定要放弃更改吗？',
            content: '您对成绩的修改尚未保存。',
            okText: '确定放弃',
            cancelText: '继续编辑',
            onOk: onClose
          });
        } else {
          onClose();
        }
      }}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        {/* 学生选择 */}
        <Form.Item
          name="studentId"
          label={
            <Space>
              <TeamOutlined />
              <span>学生</span>
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
            loading={searchLoading}
            notFoundContent={searchLoading ? <Spin size="small" /> : <Empty description="未找到学生" />}
          >
            {students.map(student => (
              <Select.Option key={student.id} value={student.id}>
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

        {/* 课程选择 */}
        <Form.Item
          name="courseId"
          label={
            <Space>
              <BookOutlined />
              <span>课程</span>
            </Space>
          }
          rules={[{ required: true, message: '请选择课程' }]}
        >
          <Select
            placeholder="请选择课程"
            showSearch
            optionFilterProp="children"
            onChange={handleCourseChange}
          >
            {courses.map(course => (
              <Select.Option key={course.id} value={course.id}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOutlined />
                    <Text strong>{course.name}</Text>
                    <Tag color="blue">{course.code}</Tag>
                  </div>
                  {/* <div style={{ display: 'flex', fontSize: '12px', gap: '16px', marginTop: '4px' }}>
                    <Text type="secondary">学期: {course.semester}</Text>
                    <Text type="secondary">学分: {course.credit}</Text>
                  </div> */}
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* 预览区域 */}
        {showPreview && selectedStudent && selectedCourse && (
          <div style={{ margin: '16px 0', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '4px', backgroundColor: '#fafafa' }}>
            <Descriptions
              size="small"
              column={1}
              title={
                <Space style={{ marginBottom: 8 }}>
                  <Text strong>预览信息</Text>
                  <Switch
                    checkedChildren="显示"
                    unCheckedChildren="隐藏"
                    checked={showPreview}
                    onChange={setShowPreview}
                    size="small"
                  />
                </Space>
              }
            >
              <Descriptions.Item label="学生">
                <Space>
                  <Avatar style={{ backgroundColor: '#87d068' }}>
                    {selectedStudent.name.charAt(0)}
                  </Avatar>
                  <span>{selectedStudent.name}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="课程">
                <Space>
                  <Tag color="blue">{selectedCourse.code}</Tag>
                  <span>{selectedCourse.name}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="学分">
                <Text strong>{selectedCourse.credit}</Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Form.Item
          name="score"
          label={
            <Tooltip title="分数范围: 0-100">
              <Space>
                <TrophyOutlined />
                <span>成绩分数</span>
              </Space>
            </Tooltip>
          }
          rules={[
            { required: true, message: '请输入成绩分数' },
            { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间' }
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            onChange={handleScoreChange}
            addonAfter="分"
          />
        </Form.Item>

        {isAdmin && (
          <Form.Item
            name="status"
            label="成绩状态"
            rules={[{ required: true, message: '请选择成绩状态' }]}
          >
            <Select onChange={handleStatusChange}>
              <Select.Option value="PENDING">待验证</Select.Option>
              <Select.Option value="VERIFIED">已验证</Select.Option>
              <Select.Option value="REJECTED">已拒绝</Select.Option>
            </Select>
          </Form.Item>
        )}

        {hasChanged && (
          <Alert
            message="成绩已修改"
            description="请点击保存按钮以提交修改。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!hasChanged}
              icon={<SaveOutlined />}
            >
              保存修改
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
} 