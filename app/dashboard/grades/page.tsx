'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout,
  Table,
  Button,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  message,
  Spin,
  Statistic,
  Divider,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import AddGradeModal from './components/AddGradeModal';
import EditGradeModal from './components/EditGradeModal';
import GradeStatistics from './components/GradeStatistics';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 定义用户类型
type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

// 定义课程类型
type Course = {
  id: string;
  code: string;
  name: string;
  credit: number;
  semester: string;
};

// 定义成绩类型
type Grade = {
  id: string;
  score: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
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
  course: {
    id: string;
    code: string;
    name: string;
    credit: number;
    semester: string;
  };
};

export default function GradesManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);

  // 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // 获取当前用户
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`获取用户信息失败: ${response.status}`);
        }
        const data = await response.json();
        setCurrentUser(data.user);
        return data.user;
      } catch (err: any) {
        console.error('获取用户信息时出错:', err);
        setError(`获取用户信息失败: ${err.message}`);
        return null;
      }
    }

    // 加载成绩列表
    async function loadGrades() {
      try {
        setLoading(true);
        const response = await fetch('/api/grades');
        if (!response.ok) {
          throw new Error(`获取成绩列表失败: ${response.status}`);
        }
        const data = await response.json();
        setGrades(data.grades || []);
        setLoading(false);
      } catch (err: any) {
        console.error('加载成绩列表时出错:', err);
        setError(`加载成绩列表失败: ${err.message}`);
        setLoading(false);
      }
    }

    // 加载课程列表（用于过滤）
    async function loadCourses() {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error(`获取课程列表失败: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err: any) {
        console.error('加载课程列表时出错:', err);
        // 课程加载失败不会显示错误，只是过滤选项会少
      }
    }

    // 加载学生列表（仅管理员和教师需要）
    async function loadStudents() {
      try {
        const user = await fetchCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
          return;
        }

        const response = await fetch('/api/users?role=STUDENT');
        if (!response.ok) {
          throw new Error(`获取学生列表失败: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data.users || []);
      } catch (err: any) {
        console.error('加载学生列表时出错:', err);
        // 学生加载失败不会显示错误，只是添加成绩选项会少
      }
    }

    // 初始化数据
    async function init() {
      await Promise.all([
        fetchCurrentUser(),
        loadGrades(),
        loadCourses(),
        loadStudents()
      ]);
    }

    init();
  }, [router]);

  // 过滤成绩
  const filteredGrades = grades.filter(grade => {
    // 搜索词过滤（学生姓名、课程名称、课程代码）
    const searchMatch =
      searchTerm === '' ||
      grade.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.course.code.toLowerCase().includes(searchTerm.toLowerCase());

    // 课程过滤
    const courseMatch = selectedCourse === '' || grade.course.id === selectedCourse;

    // 状态过滤
    const statusMatch = selectedStatus === '' || grade.status === selectedStatus;

    return searchMatch && courseMatch && statusMatch;
  });

  // 添加成绩
  const handleAddGrade = async (gradeData: { studentId: string; courseId: string; score: number }) => {
    try {
      setLoading(true);
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '添加成绩失败');
      }

      const data = await response.json();
      setGrades([...grades, data.grade]);
      setIsAddModalOpen(false);
      message.success('成绩添加成功');
    } catch (err: any) {
      console.error('添加成绩时出错:', err);
      message.error(err.message || '添加成绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑成绩
  const handleEditGrade = async (gradeData: { id: string; score: number; status?: string }) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grades/${gradeData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: gradeData.score, status: gradeData.status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新成绩失败');
      }

      const data = await response.json();
      // 更新本地成绩列表
      setGrades(grades.map(g => (g.id === data.grade.id ? data.grade : g)));
      setIsEditModalOpen(false);
      message.success('成绩更新成功');
    } catch (err: any) {
      console.error('更新成绩时出错:', err);
      message.error(err.message || '更新成绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除成绩
  const handleDeleteGrade = async () => {
    if (!selectedGrade) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/grades/${selectedGrade.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除成绩失败');
      }

      // 从列表中删除
      setGrades(grades.filter(g => g.id !== selectedGrade.id));
      setIsDeleteModalOpen(false);
      message.success('成绩删除成功');
    } catch (err: any) {
      console.error('删除成绩时出错:', err);
      message.error(err.message || '删除成绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证成绩
  const handleVerifyGrade = async (gradeId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grades/${gradeId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '验证成绩失败');
      }

      const data = await response.json();
      setGrades(grades.map(g => (g.id === data.grade.id ? data.grade : g)));
      message.success(`成绩${status === 'VERIFIED' ? '验证' : '拒绝'}成功`);
    } catch (err: any) {
      console.error('验证成绩时出错:', err);
      message.error(err.message || '验证成绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '学生',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (text: string, record: Grade) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.student.email}</Text>
        </div>
      ),
    },
    {
      title: '课程',
      key: 'course',
      render: (text: string, record: Grade) => (
        <div>
          <div>{record.course.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.course.code}</Text>
        </div>
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: Grade, b: Grade) => a.score - b.score,
    },
    {
      title: '学分',
      dataIndex: ['course', 'credit'],
      key: 'credit',
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = '';
        let text = '';
        let icon = null;

        if (status === 'VERIFIED') {
          color = 'success';
          text = '已验证';
          icon = <CheckCircleOutlined />;
        } else if (status === 'REJECTED') {
          color = 'error';
          text = '已拒绝';
          icon = <CloseCircleOutlined />;
        } else {
          color = 'warning';
          text = '待验证';
        }

        return <Tag icon={icon} color={color}>{text}</Tag>;
      },
      filters: [
        { text: '已验证', value: 'VERIFIED' },
        { text: '已拒绝', value: 'REJECTED' },
        { text: '待验证', value: 'PENDING' },
      ],
      onFilter: (value: string | number | boolean, record: Grade) => record.status === value.toString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Grade) => (
        <Space size="small">
          {/* 教师和管理员可以编辑 */}
          {(currentUser?.role === 'ADMIN' ||
            (currentUser?.role === 'TEACHER' && record.teacher.id === currentUser.id)) && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedGrade(record);
                  setIsEditModalOpen(true);
                }}
              />
            )}

          {/* 管理员可以删除 */}
          {currentUser?.role === 'ADMIN' && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedGrade(record);
                setIsDeleteModalOpen(true);
              }}
            />
          )}

          {/* 管理员可以验证待验证的成绩 */}
          {currentUser?.role === 'ADMIN' && record.status === 'PENDING' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleVerifyGrade(record.id, 'VERIFIED')}
              />
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleVerifyGrade(record.id, 'REJECTED')}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BackButton route="/dashboard" />
                <Title level={4} style={{ margin: '0 0 0 16px' }}>成绩管理</Title>
              </div>
            }
            extra={
              <Space>
                <Button
                  type={showStatistics ? 'default' : 'primary'}
                  icon={<BarChartOutlined />}
                  onClick={() => setShowStatistics(!showStatistics)}
                >
                  {showStatistics ? '隐藏统计' : '显示统计'}
                </Button>
                {(currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    添加成绩
                  </Button>
                )}
              </Space>
            }
          >
            {showStatistics && (
              <>
                <GradeStatistics grades={grades} />
                <Divider />
              </>
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Input
                  placeholder="搜索学生/课程"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="选择课程"
                  style={{ width: '100%' }}
                  value={selectedCourse}
                  onChange={(value) => setSelectedCourse(value)}
                  allowClear
                >
                  {courses.map((course) => (
                    <Option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="选择状态"
                  style={{ width: '100%' }}
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value)}
                  allowClear
                >
                  <Option value="VERIFIED">已验证</Option>
                  <Option value="REJECTED">已拒绝</Option>
                  <Option value="PENDING">待验证</Option>
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredGrades}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: itemsPerPage,
                total: filteredGrades.length,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>

          {/* 添加成绩模态框 */}
          <AddGradeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddGrade}
            students={students}
            courses={courses}
            loading={loading}
          />

          {/* 编辑成绩模态框 */}
          {selectedGrade && (
            <EditGradeModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSubmit={handleEditGrade}
              grade={selectedGrade}
              loading={loading}
              userRole={currentUser?.role || ''}
            />
          )}

          {/* 删除确认模态框 */}
          <Modal
            title="确认删除"
            open={isDeleteModalOpen}
            onOk={handleDeleteGrade}
            onCancel={() => setIsDeleteModalOpen(false)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: loading }}
          >
            <p>确定要删除这条成绩记录吗？此操作不可撤销。</p>
            {selectedGrade && (
              <div>
                <p>学生: {selectedGrade.student.name}</p>
                <p>课程: {selectedGrade.course.name} ({selectedGrade.course.code})</p>
                <p>分数: {selectedGrade.score}</p>
              </div>
            )}
          </Modal>
        </div>
      </Content>
    </Layout>
  );
} 