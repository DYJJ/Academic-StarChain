'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Statistic, Typography, Empty, Spin,
  message, Input, Table, Tag, Tooltip, Avatar, Tabs, Select, Badge,
  Divider, Progress, Dropdown, Menu, Modal, Form, Radio, Descriptions, List
} from 'antd';
import {
  UserOutlined, BookOutlined, SearchOutlined, FileExcelOutlined,
  BarChartOutlined, FilterOutlined, PlusOutlined, EditOutlined,
  MailOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  TeamOutlined, UnorderedListOutlined, AppstoreOutlined,
  SortAscendingOutlined, CloudDownloadOutlined, FileTextOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import { logAction } from '../../utils/logger';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  createdAt: string;
  courses?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  avatarUrl?: string;
  status?: 'active' | 'inactive';
  lastActive?: string;
  progress?: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

// 生成基于姓名的默认头像URL
const getDefaultAvatarUrl = (name: string) => {
  // 使用UI Avatars生成基于姓名的头像
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`;
};

export default function MyStudents() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [studentDetailVisible, setStudentDetailVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      fetchStudents();
      fetchCourses();
      logAction('学生管理', '访问我的学生管理页面', currentUser.id);
    }
  }, [currentUser?.id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/teacher', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error('未授权，请先登录');
          router.push('/login');
          return;
        }
        throw new Error('获取学生失败');
      }

      const data = await response.json();
      console.log('获取到的学生数据:', data.students);

      const studentsWithProgress = await Promise.all(
        data.students.map(async (student: any) => {
          try {
            const progressResponse = await fetch(`/api/students/progress?studentId=${student.id}`, {
              method: 'GET',
              cache: 'no-store'
            });

            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log('学生进度数据:', progressData);

              // 获取头像URL，如果没有则使用默认头像
              const avatarUrl = student.avatarUrl ||
                progressData.student?.avatarUrl ||
                getDefaultAvatarUrl(student.name);

              return {
                ...student,
                progress: progressData.totalProgress,
                status: progressData.totalProgress > 0 ? 'active' : 'inactive',
                lastActive: new Date().toISOString(),
                // 确保使用正确的头像URL
                avatarUrl,
                // 如果没有学号，使用email作为学号
                studentId: student.studentId || student.email.split('@')[0]
              };
            }

            // 如果没有进度数据，也要确保有头像
            return {
              ...student,
              avatarUrl: student.avatarUrl || getDefaultAvatarUrl(student.name),
              studentId: student.studentId || student.email.split('@')[0]
            };
          } catch (e) {
            console.error(`获取学生${student.id}进度失败:`, e);
            return {
              ...student,
              avatarUrl: student.avatarUrl || getDefaultAvatarUrl(student.name),
              studentId: student.studentId || student.email.split('@')[0]
            };
          }
        })
      );

      setStudents(studentsWithProgress);
      setFilteredStudents(studentsWithProgress);
    } catch (err: any) {
      message.error(err.message || '加载数据失败');
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/teacher');

      if (!response.ok) {
        throw new Error('获取课程失败');
      }

      const data = await response.json();
      setCourses(data.courses);
    } catch (err: any) {
      message.error(err.message || '加载课程数据失败');
      setCourses([]);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('获取当前用户失败');
      }

      const data = await response.json();
      setCurrentUser(data.user);
    } catch (err: any) {
      message.error(err.message || '加载当前用户失败');
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    handleFilter();
  }, [searchText, selectedCourse, students, sortOrder]);

  const handleFilter = () => {
    let result = [...students];

    // 搜索过滤
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(
        student =>
          student.name.toLowerCase().includes(lowerCaseSearch) ||
          student.email.toLowerCase().includes(lowerCaseSearch) ||
          student.studentId.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 课程过滤
    if (selectedCourse) {
      result = result.filter(
        student => student.courses?.some(course => course.id === selectedCourse)
      );
    }

    // 排序
    if (sortOrder === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'recent') {
      result.sort((a, b) => {
        const dateA = new Date(a.lastActive || a.createdAt);
        const dateB = new Date(b.lastActive || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    }

    setFilteredStudents(result);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
  };

  const handleSort = (value: 'name' | 'recent') => {
    setSortOrder(value);
  };

  const showStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setStudentDetailVisible(true);

    if (currentUser?.id) {
      logAction('学生管理', `查看学生详情: ${student.name}(${student.studentId})`, currentUser.id);
    }
  };

  const exportStudentList = () => {
    try {
      // 准备要导出的数据
      const exportData = filteredStudents.map(student => ({
        '姓名': student.name,
        '学号': student.studentId,
        '邮箱': student.email,
        '状态': student.status === 'active' ? '活跃' : '不活跃',
        '选修课程数': student.courses?.length || 0,
        '注册时间': new Date(student.createdAt).toLocaleDateString('zh-CN'),
        '学习进度': `${student.progress || 0}%`
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 姓名
        { wch: 12 }, // 学号
        { wch: 25 }, // 邮箱
        { wch: 8 },  // 状态
        { wch: 10 }, // 选修课程数
        { wch: 15 }, // 注册时间
        { wch: 10 }  // 学习进度
      ];
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '学生名单');

      // 生成文件名
      const courseFilter = selectedCourse ? `-${courses.find(c => c.id === selectedCourse)?.name || '筛选课程'}` : '';
      const filename = `学生名单${courseFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // 将工作簿写入文件并触发下载
      XLSX.writeFile(wb, filename);

      message.success('学生名单已成功导出');

      if (currentUser?.id) {
        logAction('学生管理', '导出学生名单', currentUser.id);
      }
    } catch (error) {
      console.error('导出学生名单失败:', error);
      message.error('导出学生名单失败，请重试');
    }
  };

  // 获取学生状态标签
  const getStatusTag = (status?: string) => {
    if (status === 'active') {
      return <Tag color="success">活跃</Tag>;
    } else if (status === 'inactive') {
      return <Tag color="default">不活跃</Tag>;
    }
    return null;
  };

  // 获取上次活跃时间的格式化显示
  const getLastActiveText = (lastActive?: string) => {
    if (!lastActive) return '未知';

    const lastActiveDate = dayjs(lastActive);
    const now = dayjs();
    const diffDays = now.diff(lastActiveDate, 'day');

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return lastActiveDate.format('YYYY-MM-DD');
  };

  // 表格列定义
  const columns = [
    {
      title: '学生',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Student) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={record.avatarUrl}
            icon={!record.avatarUrl && <UserOutlined />}
            style={{ marginRight: 12 }}
          />
          <div>
            <Text strong>{record.name}</Text>
            <div>
              <Text type="secondary">{record.studentId}</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '课程',
      key: 'courses',
      render: (_: string, record: Student) => (
        <>
          {record.courses && record.courses.length > 0 ? (
            <div style={{ maxWidth: 200 }}>
              {record.courses.map(course => (
                <Tag color="blue" key={course.id}>
                  {course.name}
                </Tag>
              ))}
            </div>
          ) : (
            <Text type="secondary">暂无课程</Text>
          )}
        </>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: string, record: Student) => (
        <div>
          {getStatusTag(record.status)}
          <div>
            <Text type="secondary">
              上次活跃: {getLastActiveText(record.lastActive)}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '学习进度',
      key: 'progress',
      render: (_: string, record: Student) => (
        <Progress
          percent={record.progress || 0}
          size="small"
          status={
            (record.progress || 0) < 30 ? 'exception' :
              (record.progress || 0) < 70 ? 'normal' : 'success'
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: Student) => (
        <div>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showStudentDetail(record)}
            />
          </Tooltip>
          <Tooltip title="发送消息">
            <Button
              type="link"
              icon={<MailOutlined />}
              onClick={() => message.info(`发送消息给 ${record.name}`)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // 空状态的提示内容
  const emptyContent = (
    <Empty
      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
      imageStyle={{ height: 120 }}
      description={
        <span>
          {searchText || selectedCourse ?
            '没有匹配的学生，请尝试其他筛选条件' :
            '您当前没有任何学生，请等待学生选修您的课程'}
        </span>
      }
    >
      <Button type="primary" onClick={fetchStudents}>刷新数据</Button>
    </Empty>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="page-title">
            <TeamOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#6A3DE8' }} />
            <Title level={2} style={{ margin: 0 }}>我的学生管理</Title>
          </div>
          <Paragraph style={{ marginTop: '8px', color: '#666' }}>
            查看和管理您课程中的学生信息，跟踪学习进度。
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              className="stat-card"
              style={{
                backgroundColor: '#6A3DE8',
                color: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(106, 61, 232, 0.2)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>总学生</span>}
                value={students.length}
                valueStyle={{ color: 'white' }}
                prefix={<TeamOutlined style={{ color: 'white' }} />}
                suffix="名学生"
              />
              <div className="stat-footer">
                <div className="stat-trend" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  最近7天新增 {students.filter(s => {
                    const createdDate = new Date(s.createdAt);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return createdDate > sevenDaysAgo;
                  }).length} 名
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              className="stat-card"
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>活跃学生</span>}
                value={students.filter(s => s.status === 'active').length}
                valueStyle={{ color: 'white' }}
                prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
                suffix="名活跃"
              />
              <div className="stat-footer">
                <div className="stat-trend" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  活跃率 {Math.round((students.filter(s => s.status === 'active').length / (students.length || 1)) * 100)}%
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              className="stat-card"
              style={{
                backgroundColor: '#f59f00',
                color: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(245, 159, 0, 0.2)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>平均进度</span>}
                value={students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length) : 0}
                valueStyle={{ color: 'white' }}
                prefix={<BarChartOutlined style={{ color: 'white' }} />}
                suffix="%"
              />
              <div className="stat-footer">
                <div className="stat-trend" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  整体学习进度情况
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bordered={false}
              className="stat-card"
              style={{
                backgroundColor: '#2980b9',
                color: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(41, 128, 185, 0.2)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>授课课程</span>}
                value={courses.length}
                valueStyle={{ color: 'white' }}
                prefix={<BookOutlined style={{ color: 'white' }} />}
                suffix="门课程"
              />
              <div className="stat-footer">
                <div className="stat-trend" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  平均每课程 {Math.round(students.length / (courses.length || 1))} 名学生
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 工具栏和筛选区域 */}
        <Card
          bordered={false}
          style={{
            marginBottom: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Input
                placeholder="搜索学生姓名/学号/邮箱"
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '250px' }}
                allowClear
              />
              <Select
                placeholder="选择课程筛选"
                style={{ width: '200px' }}
                onChange={handleCourseChange}
                allowClear
                value={selectedCourse}
              >
                {courses.map(course => (
                  <Option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </Option>
                ))}
              </Select>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'name',
                      label: '按姓名排序',
                      icon: <SortAscendingOutlined />,
                      onClick: () => handleSort('name'),
                    },
                    {
                      key: 'recent',
                      label: '按最近活跃排序',
                      icon: <SortAscendingOutlined />,
                      onClick: () => handleSort('recent'),
                    },
                  ],
                }}
                placement="bottomLeft"
              >
                <Button icon={<FilterOutlined />} style={{ marginRight: '8px' }}>
                  {sortOrder === 'name' ? '按姓名排序' : '按最近活跃排序'} <Divider type="vertical" />
                </Button>
              </Dropdown>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Tooltip title="导出学生名单">
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={exportStudentList}
                  type="primary"
                  style={{
                    backgroundColor: '#6A3DE8',
                    borderColor: '#6A3DE8'
                  }}
                >
                  导出名单
                </Button>
              </Tooltip>
              <Radio.Group
                value={viewMode}
                onChange={e => setViewMode(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="card">
                  <AppstoreOutlined />
                </Radio.Button>
                <Radio.Button value="list">
                  <UnorderedListOutlined />
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>

          <div>
            <Text>
              共找到 <Text strong>{filteredStudents.length}</Text> 名学生
              {searchText && <span>，搜索 "{searchText}"</span>}
              {selectedCourse && <span>，课程筛选 "{courses.find(c => c.id === selectedCourse)?.name || ''}"</span>}
            </Text>
          </div>
        </Card>

        {/* 学生列表内容区域 */}
        {filteredStudents.length > 0 ? (
          viewMode === 'list' ? (
            // 表格视图
            <Card
              bordered={false}
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <Table
                dataSource={filteredStudents}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                rowClassName="table-row"
                loading={loading}
              />
            </Card>
          ) : (
            // 卡片视图
            <Row gutter={[24, 24]}>
              {filteredStudents.map(student => (
                <Col xs={24} sm={12} md={8} xl={6} key={student.id}>
                  <Card
                    hoverable
                    className="student-card"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '100%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                    actions={[
                      <Tooltip title="查看详情" key="view">
                        <EyeOutlined onClick={() => showStudentDetail(student)} />
                      </Tooltip>,
                      <Tooltip title="发送消息" key="message">
                        <MailOutlined onClick={() => message.info(`发送消息给 ${student.name}`)} />
                      </Tooltip>,
                      <Tooltip title="查看成绩" key="grades">
                        <FileTextOutlined onClick={() => message.info(`查看 ${student.name} 的成绩`)} />
                      </Tooltip>,
                    ]}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <Badge
                        dot={student.status === 'active'}
                        color="green"
                        offset={[-5, 5]}
                      >
                        <Avatar
                          src={student.avatarUrl}
                          icon={!student.avatarUrl && <UserOutlined />}
                          size={80}
                          style={{
                            border: '2px solid #f0f0f0',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      </Badge>
                      <div style={{ marginTop: '12px' }}>
                        <Title level={5} style={{ marginBottom: '4px', color: '#333' }}>{student.name}</Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>{student.studentId}</Text>
                        <div style={{ marginTop: '8px' }}>
                          {getStatusTag(student.status)}
                        </div>
                      </div>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ padding: '0 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary">邮箱:</Text>
                        <Text copyable={{ text: student.email }} style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.email}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary">上次活跃:</Text>
                        <Text>{getLastActiveText(student.lastActive)}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary">已修课程:</Text>
                        <Text>{student.courses?.length || 0} 门</Text>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>
                          学习进度:
                        </Text>
                        <Progress
                          percent={student.progress || 0}
                          status={
                            (student.progress || 0) < 30 ? 'exception' :
                              (student.progress || 0) < 70 ? 'normal' : 'success'
                          }
                          strokeColor={{
                            '0%': '#6A3DE8',
                            '100%': '#4caf50',
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )
        ) : (
          // 空状态
          <Card
            bordered={false}
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px 0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {emptyContent}
          </Card>
        )}
      </div>

      {/* 学生详情模态窗口 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 8 }} />
            <span>学生详细信息</span>
          </div>
        }
        open={studentDetailVisible}
        onCancel={() => setStudentDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedStudent && (
          <div>
            <div style={{ display: 'flex', marginBottom: '24px' }}>
              <Avatar
                src={selectedStudent.avatarUrl}
                icon={!selectedStudent.avatarUrl && <UserOutlined />}
                size={64}
                style={{ marginRight: '16px' }}
              />
              <div>
                <Title level={4} style={{ marginBottom: '4px' }}>{selectedStudent.name}</Title>
                <div>
                  <Text type="secondary">{selectedStudent.studentId}</Text>
                  {getStatusTag(selectedStudent.status)}
                </div>
                <Text copyable>{selectedStudent.email}</Text>
              </div>
            </div>

            <Divider />

            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="姓名">{selectedStudent.name}</Descriptions.Item>
                  <Descriptions.Item label="学号">{selectedStudent.studentId}</Descriptions.Item>
                  <Descriptions.Item label="邮箱">{selectedStudent.email}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {selectedStudent.status === 'active' ? '活跃' : '不活跃'}
                  </Descriptions.Item>
                  <Descriptions.Item label="上次活跃">{getLastActiveText(selectedStudent.lastActive)}</Descriptions.Item>
                  <Descriptions.Item label="加入时间">{dayjs(selectedStudent.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: '24px' }}>
                  <Title level={5}>学习进度</Title>
                  <Progress
                    percent={selectedStudent.progress || 0}
                    status={
                      (selectedStudent.progress || 0) < 30 ? 'exception' :
                        (selectedStudent.progress || 0) < 70 ? 'normal' : 'success'
                    }
                  />
                </div>
              </TabPane>

              <TabPane tab="已修课程" key="2">
                {selectedStudent.courses && selectedStudent.courses.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={selectedStudent.courses}
                    renderItem={(course: { id: string, name: string, code: string }) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<BookOutlined style={{ fontSize: 24 }} />}
                          title={course.name}
                          description={`课程代码: ${course.code}`}
                        />
                        <Button type="link">查看课程详情</Button>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="该学生未修任何课程" />
                )}
              </TabPane>

              <TabPane tab="成绩分析" key="3">
                <Card title="课程成绩统计" bordered={false}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="平均成绩"
                        value={85.6}
                        precision={1}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircleOutlined />}
                        suffix="分"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="未通过课程"
                        value={0}
                        valueStyle={{ color: '#cf1322' }}
                        prefix={<CloseCircleOutlined />}
                        suffix="门"
                      />
                    </Col>
                  </Row>
                </Card>

                <div style={{ marginTop: '16px' }}>
                  <Empty description="更多详细成绩数据正在完善中" />
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .dashboard-container {
          min-height: 100vh;
          background-color: #f5f7fb;
        }
        
        .dashboard-content {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 24px;
        }
        
        .page-title {
          display: flex;
          align-items: center;
        }
        
        .stat-card {
          height: 140px;
          position: relative;
          transition: all 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        
        .stat-footer {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: space-between;
        }
        
        .student-card {
          height: 100%;
          transition: all 0.3s;
        }
        
        .student-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
        
        .table-row:hover {
          background-color: #f0f5ff;
        }
        
        .ant-progress-bg {
          background: linear-gradient(to right, #6A3DE8, #4caf50);
        }
      `}</style>
    </div>
  );
} 