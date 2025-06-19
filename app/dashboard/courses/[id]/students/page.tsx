'use client';

import { useState, useEffect } from 'react';
import { Typography, Table, Button, Input, Card, Space, Tag, Avatar, message, Breadcrumb, Tooltip, Select, Tabs, Empty, Statistic, Row, Col, Spin, Progress } from 'antd';
import { SearchOutlined, UserAddOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined, TrophyOutlined, BookOutlined, TeamOutlined, AuditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import ManageStudentsModal from '@/app/dashboard/courses/components/ManageStudentsModal';
import gradeUtils from '@/app/utils/gradeUtils';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// 学生类型
interface Student {
  id: string;
  name: string;
  email: string;
  score?: number | null;
  status?: string;
  enrolledAt?: string;
  avatarUrl?: string | null;
}

// 课程类型
interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credit?: number;
  semester?: string;
}

export default function CourseStudentsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const courseId = params.id;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [totalStudentCount, setTotalStudentCount] = useState(0);

  // 获取课程信息
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        
        if (!response.ok) {
          throw new Error('获取课程信息失败');
        }
        
        const data = await response.json();
        setCourse(data.course);
      } catch (error) {
        console.error('获取课程信息出错:', error);
        message.error('获取课程信息失败');
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  // 获取选课学生
  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  // 获取学生数据
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}/enroll`);
      
      if (!response.ok) {
        throw new Error('获取选课学生失败');
      }
      
      const data = await response.json();
      setStudents(data.students || []);
      setTotalStudentCount(data.totalCount || 0);
    } catch (error) {
      console.error('获取选课学生出错:', error);
      message.error('获取选课学生失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新学生数据后刷新
  const handleStudentsChanged = () => {
    fetchStudents();
  };

  // 导出成绩单
  const exportGrades = () => {
    message.success('成绩单导出功能即将上线');
  };

  // 学生数据表格列定义
  const columns: ColumnsType<Student> = [
    {
      title: '学生',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large"
            style={{ marginRight: 12 }} 
            src={record.avatarUrl} 
            icon={!record.avatarUrl && <UserAddOutlined />}
          >
            {!record.avatarUrl && text.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.name.toLowerCase().includes((value as string).toLowerCase()) ||
          record.email.toLowerCase().includes((value as string).toLowerCase());
      },
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      render: (score) => {
        const grade = gradeUtils.getGradeFromScore(score);
        return (
          <Space>
            {score !== undefined && score !== null ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{score}</div>
                <Tag color={gradeUtils.getGradeColor(grade)}>
                  {grade}
                </Tag>
              </div>
            ) : (
              <Text type="secondary">暂无</Text>
            )}
          </Space>
        );
      },
      sorter: (a, b) => {
        if (a.score === null || a.score === undefined) return -1;
        if (b.score === null || b.score === undefined) return 1;
        return a.score - b.score;
      },
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={gradeUtils.getStatusColor(status)}>
          {gradeUtils.getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '在修', value: 'enrolled' },
        { text: '已完成', value: 'completed' },
        { text: '已退课', value: 'dropped' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 100,
    },
    {
      title: '选课时间',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      render: (date) => {
        if (!date) return <Text type="secondary">未知</Text>;
        return new Date(date).toLocaleDateString('zh-CN');
      },
      sorter: (a, b) => {
        if (!a.enrolledAt) return -1;
        if (!b.enrolledAt) return 1;
        return new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
      },
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑成绩">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
            />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<AuditOutlined />} 
            />
          </Tooltip>
          <Tooltip title="从课程移除">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
    },
  ];

  // 获取成绩统计数据
  const getGradeStatistics = () => {
    const validScores = students
      .filter(student => student.score !== null && student.score !== undefined)
      .map(student => student.score);
    
    // 平均成绩
    const averageScore = gradeUtils.calculateAverage(validScores as number[]);
    
    // 及格率
    const passRate = gradeUtils.calculatePassRate(validScores as number[]);
    
    // 等级分布
    const gradeDistribution = gradeUtils.calculateGradeDistribution(validScores as number[]);
    
    return {
      averageScore,
      passRate,
      gradeDistribution,
      totalWithScores: validScores.length,
      totalWithoutScores: students.length - validScores.length
    };
  };

  // 渲染成绩分析面板
  const renderGradeAnalysis = () => {
    const stats = getGradeStatistics();
    
    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="学生总数"
                value={students.length}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均成绩"
                value={stats.averageScore || 0}
                suffix="分"
                precision={1}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: stats.averageScore && stats.averageScore >= 60 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="及格率"
                value={stats.passRate || 0}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: stats.passRate && stats.passRate >= 60 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已评分/未评分"
                value={stats.totalWithScores}
                suffix={` / ${stats.totalWithoutScores}`}
                prefix={<AuditOutlined />}
              />
            </Card>
          </Col>
        </Row>
        
        <div style={{ marginTop: 24 }}>
          <Card title="成绩等级分布" bordered={false}>
            <div style={{ display: 'flex', marginBottom: 16 }}>
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                <div key={grade} style={{ flex: 1, textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={students.length > 0 ? Math.round((count / students.length) * 100) : 0}
                    format={() => `${count}人`}
                    strokeColor={gradeUtils.getGradeColor(grade)}
                    width={80}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={gradeUtils.getGradeColor(grade)} style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {grade}级
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Title level={5}>班级总体情况</Title>
              <div style={{ marginTop: 16 }}>
                {stats.averageScore !== null ? (
                  <div>
                    <div>
                      班级平均成绩为 <Text strong>{stats.averageScore}</Text> 分，
                      {stats.passRate !== null && (
                        <>
                          及格率为 <Text strong>{stats.passRate}%</Text>，
                          {stats.passRate >= 90 ? '班级成绩优秀，大部分学生掌握了课程内容。' :
                           stats.passRate >= 70 ? '班级成绩良好，大部分学生掌握了课程内容。' :
                           stats.passRate >= 50 ? '班级成绩一般，部分学生需要加强复习。' :
                           '班级成绩较差，建议重点辅导。'}
                        </>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      班级最高成绩为 <Text strong style={{ color: '#52c41a' }}>
                        {Math.max(...(students.filter(s => s.score !== null && s.score !== undefined).map(s => s.score as number)))}
                      </Text> 分，
                      最低成绩为 <Text strong style={{ color: '#f5222d' }}>
                        {Math.min(...(students.filter(s => s.score !== null && s.score !== undefined).map(s => s.score as number)))}
                      </Text> 分。
                    </div>
                  </div>
                ) : (
                  <Empty description="暂无足够成绩数据进行分析" />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Breadcrumb
        items={[
          {
            title: <Link href="/dashboard">Dashboard</Link>,
          },
          {
            title: <Link href="/dashboard/courses">课程管理</Link>,
          },
          {
            title: course ? course.name : '课程详情',
          },
          {
            title: '学生管理',
          },
        ]}
        style={{ marginBottom: '16px' }}
      />

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {course ? `${course.name} (${course.code})` : '加载中...'}
          </Title>
          {course && (
            <div style={{ marginTop: 4 }}>
              <Text type="secondary">
                {course.semester} · {course.credit} 学分 · {totalStudentCount} 名学生
              </Text>
            </div>
          )}
        </div>
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              学生列表
            </span>
          }
          key="students"
        >
          <Card style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 16 
            }}>
              <Input
                placeholder="搜索学生姓名或邮箱"
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Space>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  管理学生
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportGrades}
                >
                  导出成绩单
                </Button>
              </Space>
            </div>
            
            <Table
              columns={columns}
              dataSource={students}
              rowKey="id"
              loading={loading}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `共 ${total} 名学生`
              }}
              locale={{
                emptyText: <Empty description="暂无学生选修此课程" />
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TrophyOutlined />
              成绩分析
            </span>
          }
          key="analysis"
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" tip="加载中..." />
            </div>
          ) : (
            renderGradeAnalysis()
          )}
        </TabPane>
      </Tabs>

      {course && (
        <ManageStudentsModal
          course={course}
          isOpen={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onStudentsChanged={handleStudentsChanged}
        />
      )}
    </div>
  );
} 