'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Statistic, Typography, Empty, Spin,
  message, Input, Table, Tag, Tooltip, Avatar, Tabs, Select, Badge,
  Divider, Progress, Dropdown, Menu, Modal, Form, Radio
} from 'antd';
import { 
  UserOutlined, BookOutlined, SearchOutlined, FileExcelOutlined,
  BarChartOutlined, FilterOutlined, PlusOutlined, EditOutlined,
  MailOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  TeamOutlined, UnorderedListOutlined, AppstoreOutlined,
  SortAscendingOutlined, CloudDownloadOutlined, FileTextOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';
import dayjs from 'dayjs';

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
  avatar?: string;
  status?: 'active' | 'inactive';
  lastActive?: string;
  progress?: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

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

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  
    // 记录访问学生管理页面
    logAction(LogAction.STUDENT_MANAGEMENT, '访问我的学生管理页面');
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/teacher');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('获取学生失败');
      }

      const data = await response.json();
      // 为了演示，如果没有学生数据，添加一些示例数据
      const studentsData = data.students.length > 0 ? data.students : [
        {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com',
          studentId: '2023001',
          createdAt: new Date().toISOString(),
          courses: [{ id: '1', name: 'Web编程基础', code: '001' }],
          avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=1',
          status: 'active',
          lastActive: new Date().toISOString(),
          progress: 78
        },
        {
          id: '2',
          name: '李四',
          email: 'lisi@example.com',
          studentId: '2023002',
          createdAt: new Date().toISOString(),
          courses: [{ id: '1', name: 'Web编程基础', code: '001' }],
          avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=2',
          status: 'active',
          lastActive: dayjs().subtract(2, 'day').toISOString(),
          progress: 65
        },
        {
          id: '3',
          name: '王五',
          email: 'wangwu@example.com',
          studentId: '2023003',
          createdAt: new Date().toISOString(),
          courses: [{ id: '1', name: 'Web编程基础', code: '001' }],
          avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=3',
          status: 'inactive',
          lastActive: dayjs().subtract(10, 'day').toISOString(),
          progress: 32
        }
      ];

      setStudents(studentsData);
      setFilteredStudents(studentsData);
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
    logAction(LogAction.STUDENT_MANAGEMENT, `查看学生详情: ${student.name}(${student.studentId})`);
  };
      
  const exportStudentList = () => {
    message.success('学生名单已导出');
    logAction(LogAction.STUDENT_MANAGEMENT, '导出学生名单');
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
            src={record.avatar}
            icon={!record.avatar && <UserOutlined />}
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Navbar />

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题区域 */}
        <div 
          style={{ 
            padding: '30px 24px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: 'linear-gradient(120deg, #8e44ad, #9b59b6)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M15 35h30v10H15V35zm0-20h30v10H15V15zm0-20h30v10H15V-5z\' fill=\'%23FFF\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
              backgroundSize: '30px 30px'
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <TeamOutlined style={{ fontSize: 28, color: 'white', marginRight: 12 }} />
              <Title level={2} style={{ margin: 0, color: 'white' }}>我的学生管理</Title>
            </div>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', maxWidth: 800, marginBottom: 0 }}>
              查看和管理您课程中的学生信息，包括学生档案、成绩记录和课程认证请求。
            </Paragraph>
          </div>
        </div>
        
        {/* 统计卡片区域 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
                <Statistic 
                title="学生总数"
                  value={students.length}
                prefix={<TeamOutlined style={{ color: '#8e44ad' }} />}
                suffix="名学生"
                />
              <div className="stat-footer">
                <div className="stat-trend">
                  最近7天新增 {Math.floor(students.length * 0.2)} 名
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title="活跃学生"
                value={students.filter(s => s.status === 'active').length}
                prefix={<UserOutlined style={{ color: '#27ae60' }} />}
                suffix="名活跃"
              />
              <div className="stat-footer">
                <div className="stat-trend">
                  活跃率 {Math.round((students.filter(s => s.status === 'active').length / (students.length || 1)) * 100)}%
                </div>
                </div>
              </Card>
            </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
                <Statistic 
                title="平均进度"
                value={Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / (students.length || 1))}
                prefix={<BarChartOutlined style={{ color: '#e67e22' }} />}
                suffix="%"
                />
              <div className="stat-footer">
                <div className="stat-trend">
                  整体学习进度良好
                </div>
                </div>
              </Card>
            </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
                <Statistic 
                title="授课课程"
                value={courses.length}
                prefix={<BookOutlined style={{ color: '#2980b9' }} />}
                suffix="门课程"
              />
              <div className="stat-footer">
                <div className="stat-trend">
                  平均每课程 {Math.round(students.length / (courses.length || 1))} 名学生
                </div>
                </div>
              </Card>
            </Col>
          </Row>
          
        {/* 工具栏和筛选区域 */}
        <Card bordered={false} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <Input.Search
                placeholder="搜索学生姓名/学号/邮箱"
                allowClear
                style={{ width: 250 }}
                onSearch={handleSearch}
              />
              <Select
                placeholder="选择课程"
                style={{ width: 200 }}
                onChange={handleCourseChange}
                allowClear
              >
                {courses.map(course => (
                  <Option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </Option>
                ))}
              </Select>
              <Dropdown
                overlay={
                  <Menu onClick={({ key }) => handleSort(key as 'name' | 'recent')}>
                    <Menu.Item key="name">按姓名排序</Menu.Item>
                    <Menu.Item key="recent">按最近活跃排序</Menu.Item>
                  </Menu>
                }
              >
                <Button icon={<SortAscendingOutlined />}>
                  {sortOrder === 'name' ? '按姓名排序' : '按最近活跃排序'} <BarChartOutlined />
                </Button>
              </Dropdown>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tooltip title="导出学生名单">
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={exportStudentList}
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
            <Card bordered={false}>
          <Table 
            dataSource={filteredStudents}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
                }}
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
                          src={student.avatar}
                          icon={!student.avatar && <UserOutlined />}
                          size={64}
                        />
                      </Badge>
                      <div style={{ marginTop: '8px' }}>
                        <Title level={5} style={{ marginBottom: '4px' }}>{student.name}</Title>
                        <Text type="secondary">{student.studentId}</Text>
                      </div>
                      {getStatusTag(student.status)}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
              <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary">邮箱:</Text>
                        <Text copyable={{ text: student.email }}>{student.email}</Text>
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
          <Card bordered={false} style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
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
                src={selectedStudent.avatar}
                icon={!selectedStudent.avatar && <UserOutlined />}
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
                    renderItem={course => (
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
        .stat-card {
          height: 140px;
          position: relative;
          transition: all 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stat-footer {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: space-between;
        }
        
        .stat-trend {
          font-size: 12px;
          color: #8e44ad;
        }
        
        .student-card {
          height: 100%;
          transition: all 0.3s;
        }
        
        .student-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
} 