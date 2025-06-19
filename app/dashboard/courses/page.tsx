'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout, Table, Card, Button, Input, Space,
  Typography, Tag, Modal, message, Spin, Row, Col
} from 'antd';
import {
  BookOutlined, SearchOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import AddCourseModal from './components/AddCourseModal';
import EditCourseModal from './components/EditCourseModal';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

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
  createdAt: string;
  updatedAt?: string;
  teachers: any[];
};

export default function CoursesManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    // 获取当前登录用户信息和课程列表
    async function fetchData() {
      try {
        // 获取当前用户信息
        const userResponse = await fetch('/api/auth/me');

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // 未登录或会话已过期，重定向到登录页
            router.push('/login');
            return;
          }
          throw new Error('获取用户信息失败');
        }

        const userData = await userResponse.json();
        const user = userData.user;

        if (user.role !== 'ADMIN') {
          // 如果不是管理员，重定向到仪表板
          router.push('/dashboard');
          return;
        }

        setCurrentUser(user);

        // 获取课程列表
        const coursesResponse = await fetch('/api/courses');

        if (!coursesResponse.ok) {
          console.error('获取课程列表失败:', await coursesResponse.text());
          throw new Error('获取课程列表失败');
        }

        const coursesData = await coursesResponse.json();
        console.log('获取到的课程数据:', coursesData);

        // 处理课程数据，将users转换为teachers
        const processedCourses = (coursesData.courses || []).map((course: any) => {
          // 如果course已经有teachers字段且不为空，则使用它
          if (course.teachers && Array.isArray(course.teachers) && course.teachers.length > 0) {
            return course;
          }

          // 如果course有users字段，将角色为TEACHER的用户提取为teachers
          if (course.users && Array.isArray(course.users)) {
            return {
              ...course,
              teachers: course.users.filter((user: any) => user.role === 'TEACHER')
            };
          }

          // 如果都没有，返回原始课程对象并设置空teachers数组
          return {
            ...course,
            teachers: []
          };
        });

        setCourses(processedCourses);

        setLoading(false);
      } catch (err: any) {
        console.error('加载数据错误:', err);
        message.error(err.message || '加载数据失败');
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 过滤课程列表
  const filteredCourses = courses.filter(course => {
    return (
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // 添加课程
  const handleAddCourse = async (newCourse: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCourse)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '添加课程失败');
      }

      const data = await response.json();

      // 更新课程列表
      setCourses(prevCourses => [...prevCourses, data.course]);
      setIsAddModalOpen(false);
      message.success('课程添加成功');
      setLoading(false);
    } catch (error: any) {
      console.error('添加课程错误:', error);
      message.error(`添加课程失败: ${error.message}`);
      setLoading(false);
    }
  };

  // 编辑课程
  const handleEditCourse = async (courseFromModal: Course & { teacherIds?: string[] }) => {
    try {
      setLoading(true);

      // 1. 准备并更新课程基本信息
      // 从 courseFromModal 中提取纯粹的课程基本信息字段
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        teachers, // 旧的教师对象数组，不用于基本信息更新
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        teacherIds: newTeacherIdListFromForm, // 新的教师ID数组，用于教师分配
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        createdAt, // 通常不由表单更新
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        updatedAt, // 通常不由表单更新
        ...basicCourseInfo // 剩余的应为课程基本信息字段
      } = courseFromModal;

      const courseUpdateResponse = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // 只发送 basicCourseInfo，确保 id 包含在内，并且不包含 teachers 或 teacherIds
        body: JSON.stringify(basicCourseInfo)
      });

      if (!courseUpdateResponse.ok) {
        const errorData = await courseUpdateResponse.json();
        throw new Error(errorData.error || '更新课程基本信息失败');
      }

      // 2. 更新教师分配
      // 使用从表单传递过来的 newTeacherIdListFromForm
      const teacherAssignResponse = await fetch(`/api/courses/${courseFromModal.id}/teachers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherIds: newTeacherIdListFromForm || [] }) //确保发送空数组如果未选择
      });

      if (!teacherAssignResponse.ok) {
        const errorData = await teacherAssignResponse.json();
        throw new Error(errorData.error || '分配教师失败');
      }

      // 3. 重新拉取课程列表并更新状态
      const coursesResponse = await fetch('/api/courses');
      if (!coursesResponse.ok) {
        throw new Error('重新获取课程列表失败');
      }
      const coursesData = await coursesResponse.json();
      const processedCourses = (coursesData.courses || []).map((course: any) => {
        if (course.teachers && Array.isArray(course.teachers) && course.teachers.length > 0) {
          return course;
        }
        if (course.users && Array.isArray(course.users)) {
          return {
            ...course,
            teachers: course.users.filter((user: any) => user.role === 'TEACHER')
          };
        }
        return {
          ...course,
          teachers: []
        };
      });
      setCourses(processedCourses);

      setIsEditModalOpen(false);
      setSelectedCourse(null);
      message.success('课程更新成功');
      setLoading(false);
    } catch (error: any) {
      console.error('更新课程错误:', error);
      message.error(`${error.message || '更新课程失败'}`);
      setLoading(false);
    }
  };

  // 删除课程
  const handleDeleteCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?id=${courseId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除课程失败');
      }

      // 更新课程列表
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      message.success('课程删除成功');
      setLoading(false);
    } catch (error: any) {
      console.error('删除课程错误:', error);
      message.error(`删除课程失败: ${error.message}`);
      setLoading(false);
    }
  };

  // 显示删除确认对话框
  const showDeleteConfirm = (course: Course) => {
    confirm({
      title: '确定要删除这个课程吗?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>课程代码:</strong> {course.code}</p>
          <p><strong>课程名称:</strong> {course.name}</p>
          <p><strong>学分:</strong> {course.credit}</p>
          <p><strong>学期:</strong> {course.semester}</p>
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        return handleDeleteCourse(course.id);
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '课程代码',
      dataIndex: 'code',
      key: 'code',
      sorter: (a: Course, b: Course) => a.code.localeCompare(b.code),
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Course) => (
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '教师',
      dataIndex: 'teachers',
      key: 'teachers',
      render: (teachers: any[], record: Course) => (
        <Space wrap>
          {teachers && teachers.length > 0 ? (
            teachers.map((teacher: any) => (
              <Tag color="green" key={teacher.id}>
                {teacher.name}
              </Tag>
            ))
          ) : (
            <Tag color="red">未分配</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '学分',
      dataIndex: 'credit',
      key: 'credit',
      sorter: (a: Course, b: Course) => a.credit - b.credit,
      render: (credit: number) => <Tag color="blue">{credit}</Tag>,
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      filters: Array.from(new Set(courses.map(course => course.semester)))
        .sort()
        .reverse()
        .map(semester => ({ text: semester, value: semester })),
      onFilter: (value: string, record: Course) => record.semester === value,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Course) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedCourse(record);
              setIsEditModalOpen(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => showDeleteConfirm(record)}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BackButton route="/dashboard" />
                <Title level={4} style={{ margin: '0 0 0 16px' }}>课程管理</Title>
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalOpen(true)}
              >
                添加课程
              </Button>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索课程名称、代码或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 300 }}
              />
            </div>

            <Table
              columns={columns}
              dataSource={filteredCourses}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              loading={loading}
            />
          </Card>

          {/* 添加课程模态框 */}
          <AddCourseModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddCourse={handleAddCourse}
          />

          {/* 编辑课程模态框 */}
          {selectedCourse && (
            <EditCourseModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedCourse(null);
              }}
              onEditCourse={handleEditCourse}
              course={selectedCourse}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
} 