'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Statistic, Typography, Empty, Spin,
  message, Tabs, Avatar, List, Tag, Tooltip, Modal, Progress, Divider
} from 'antd';
import {
  TeamOutlined, EditOutlined, BarChartOutlined,
  BookOutlined, CalendarOutlined, TrophyOutlined,
  RocketOutlined, UserOutlined, SettingOutlined,
  PlusOutlined, FireOutlined, LineChartOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
  teachers: Teacher[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  avatar?: string;
}

interface GradeData {
  range: string;
  count: number;
  color: string;
}

export default function MyCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  // 假数据 - 成绩分布
  const gradeData: GradeData[] = [
    { range: '90-100', count: 5, color: '#52c41a' },
    { range: '80-89', count: 12, color: '#1890ff' },
    { range: '70-79', count: 8, color: '#faad14' },
    { range: '60-69', count: 3, color: '#fa8c16' },
    { range: '< 60', count: 2, color: '#f5222d' }
  ];

  const totalStudents = gradeData.reduce((sum, item) => sum + item.count, 0);

  useEffect(() => {
    fetchCourses();

    // 记录访问我的课程页面
    logAction(LogAction.COURSE_MANAGEMENT, '访问我的教学课程页面');
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses/teacher');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('获取课程失败');
      }

      const data = await response.json();
      setCourses(data.courses);
    } catch (err: any) {
      message.error(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    try {
      setStudentsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/students`);

      if (!response.ok) {
        throw new Error('获取学生列表失败');
      }

      const data = await response.json();
      setCourseStudents(data.students || []);
    } catch (err: any) {
      message.error(err.message || '获取学生列表失败');
      setCourseStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const showStudentModal = (course: Course) => {
    setSelectedCourse(course);
    fetchCourseStudents(course.id);
    setStudentModalVisible(true);
    logAction(LogAction.COURSE_MANAGEMENT, `查看课程"${course.name}"(${course.code})的学生列表`);
  };

  const showGradeModal = (course: Course) => {
    setSelectedCourse(course);
    setGradeModalVisible(true);
    logAction(LogAction.COURSE_MANAGEMENT, `查看课程"${course.name}"(${course.code})的成绩分析`);
  };

  const editCourse = (course: Course) => {
    router.push(`/dashboard/courses/edit/${course.id}`);
    logAction(LogAction.COURSE_MANAGEMENT, `编辑课程"${course.name}"(${course.code})`);
  };

  // 获取学期标签颜色
  const getSemesterColor = (semester: string) => {
    const colors = {
      '2023-2024-1': 'magenta',
      '2023-2024-2': 'red',
      '2024-2025-1': 'volcano',
      '2024-2025-2': 'orange',
      '2025-2026-1': 'gold'
    };
    return colors[semester as keyof typeof colors] || 'blue';
  };

  // 获取教学进度（示例数据）
  const getTeachingProgress = (course: Course) => {
    // 实际应用中可以从后端获取真实数据
    const semesterMap: { [key: string]: number } = {
      '2023-2024-1': 100,
      '2023-2024-2': 85,
      '2024-2025-1': 62,
      '2024-2025-2': 30,
      '2025-2026-1': 15
    };
    return semesterMap[course.semester] || 0;
  };

  // 获取学期名称 (比如 2023-2024-1 => 2023-2024学年第一学期)
  const getSemesterName = (semester: string) => {
    const parts = semester.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}学年第${parts[2]}学期`;
    }
    return semester;
  };

  // 获取总体学生成绩（示例数据）
  const getAverageGrade = () => {
    return (
      gradeData.reduce((sum, item) => {
        const midpoint = item.range === '< 60' ? 55 : parseInt(item.range.split('-')[0]) + 5;
        return sum + midpoint * item.count;
      }, 0) / totalStudents
    ).toFixed(1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <Spin size="large" tip="加载课程中..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Navbar />

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>我的教学课程</Title>
            <Text type="secondary">显示您正在教授的课程列表，学生可通过这些课程了解课程内容并提交成绩认证请求</Text>
          </div>
        </div>

        {/* 课程统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title="总课程数"
                value={courses.length}
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                suffix="门课程"
              />
              <div className="stat-footer">
                <div className="stat-trend positive">
                  <FireOutlined /> 教学进度良好
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title="总学分数"
                value={courses.reduce((sum, course) => sum + course.credit, 0)}
                prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                suffix="学分"
              />
              <div className="stat-footer">
                <div className="stat-trend positive">
                  <RocketOutlined /> 课程资源丰富
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title="平均成绩"
                value={getAverageGrade()}
                prefix={<LineChartOutlined style={{ color: '#faad14' }} />}
                suffix="分"
              />
              <div className="stat-footer">
                <div className="stat-trend positive">
                  <BarChartOutlined /> 整体表现良好
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bordered={false} className="stat-card">
              <Statistic
                title="学期进度"
                value={62}
                prefix={<CalendarOutlined style={{ color: '#eb2f96' }} />}
                suffix="%"
              />
              <div className="stat-footer">
                <div className="stat-trend positive">
                  <FireOutlined /> 进度符合预期
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 课程列表 */}
        {courses.length > 0 ? (
          <Row gutter={[24, 24]}>
            {courses.map(course => (
              <Col xs={24} sm={24} md={12} xl={8} key={course.id}>
                <Card
                  hoverable
                  className="course-card"
                  cover={
                    <div className="course-cover">
                      <div className="course-code">{course.code}</div>
                      <Tag color={getSemesterColor(course.semester)} className="semester-tag">
                        {getSemesterName(course.semester)}
                      </Tag>
                    </div>
                  }
                  actions={[
                    <Tooltip title="查看学生" key="students">
                      <Button
                        type="text"
                        icon={<TeamOutlined />}
                        onClick={() => showStudentModal(course)}
                      >
                        学生
                      </Button>
                    </Tooltip>,
                    <Tooltip title="编辑课程" key="edit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => editCourse(course)}
                      >
                        编辑
                      </Button>
                    </Tooltip>,
                    <Tooltip title="成绩分析" key="grades">
                      <Button
                        type="text"
                        icon={<BarChartOutlined />}
                        onClick={() => showGradeModal(course)}
                      >
                        成绩
                      </Button>
                    </Tooltip>
                  ]}
                >
                  <div className="course-content">
                    <Title level={4} className="course-name">{course.name}</Title>
                    <Paragraph ellipsis={{ rows: 2 }} className="course-description">
                      {course.description}
                    </Paragraph>

                    <div className="course-meta">
                      <div>
                        <Text strong>学分: </Text>
                        <Tag color="blue">{course.credit}</Tag>
                      </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div className="course-progress">
                      <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
                        教学进度
                      </Text>
                      <Progress
                        percent={getTeachingProgress(course)}
                        status="active"
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="暂无教学课程"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>

      {/* 学生列表模态窗口 */}
      <Modal
        title={`${selectedCourse?.name || ''} - 学生列表`}
        open={studentModalVisible}
        onCancel={() => setStudentModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setStudentModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {studentsLoading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin tip="加载学生数据..." />
          </div>
        ) : (
          <List
            dataSource={courseStudents.length > 0 ? courseStudents : [
              { id: '1', name: '张三', email: 'zhangsan@example.com', studentId: '2023001', avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=1' },
              { id: '2', name: '李四', email: 'lisi@example.com', studentId: '2023002', avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=2' },
              { id: '3', name: '王五', email: 'wangwu@example.com', studentId: '2023003', avatar: 'https://xsgames.co/randomusers/avatar.php?g=pixel&key=3' }
            ]}
            renderItem={(student) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={student.avatar} icon={!student.avatar && <UserOutlined />} />}
                  title={<Text strong>{student.name}</Text>}
                  description={
                    <div>
                      <div>学号: {student.studentId}</div>
                      <div>邮箱: {student.email}</div>
                    </div>
                  }
                />
                <div>
                  <Button type="link" icon={<BarChartOutlined />}>
                    查看成绩
                  </Button>
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* 成绩分析模态窗口 */}
      <Modal
        title={`${selectedCourse?.name || ''} - 成绩分析`}
        open={gradeModalVisible}
        onCancel={() => setGradeModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGradeModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <div style={{ padding: '20px 0' }}>
          <Row gutter={[16, 24]}>
            <Col span={24}>
              <Card title="成绩分布" bordered={false}>
                <Row gutter={16}>
                  {gradeData.map((item) => (
                    <Col span={24} key={item.range}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <Text>{item.range}</Text>
                          <Text>{item.count}人 ({Math.round(item.count / totalStudents * 100)}%)</Text>
                        </div>
                        <Progress
                          percent={Math.round(item.count / totalStudents * 100)}
                          strokeColor={item.color}
                          showInfo={false}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            <Col span={12}>
              <Card bordered={false}>
                <Statistic
                  title="平均分"
                  value={getAverageGrade()}
                  precision={1}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<TrophyOutlined />}
                  suffix="分"
                />
              </Card>
            </Col>

            <Col span={12}>
              <Card bordered={false}>
                <Statistic
                  title="通过率"
                  value={Math.round((totalStudents - gradeData.find(item => item.range === '< 60')?.count || 0) / totalStudents * 100)}
                  precision={0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<LineChartOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>

      <style jsx global>{`
        .course-card {
          height: 100%;
          transition: all 0.3s;
          overflow: hidden;
        }
        
        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .course-cover {
          height: 120px;
          background: linear-gradient(120deg, #1890ff, #52c41a);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        .course-code {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .semester-tag {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        
        .course-content {
          min-height: 180px;
        }
        
        .course-name {
          margin-bottom: 8px !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .course-description {
          color: rgba(0, 0, 0, 0.45);
          margin-bottom: 12px !important;
        }
        
        .course-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
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
        }
        
        .stat-trend.positive {
          color: #52c41a;
        }
        
        .stat-trend.negative {
          color: #f5222d;
        }
      `}</style>
    </div>
  );
} 