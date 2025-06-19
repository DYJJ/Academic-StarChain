'use client';

import { useState, useEffect } from 'react';
import {
  Typography, Skeleton, Empty, message, Card, Button, Divider, Row, Col, Tabs,
  Progress, Statistic, Badge, Spin, Dropdown, Menu, Tooltip
} from 'antd';
import {
  BookOutlined, ReloadOutlined, BarChartOutlined, AppstoreOutlined,
  CrownOutlined, FileTextOutlined, TeamOutlined, TrophyOutlined,
  FilterOutlined, SortAscendingOutlined, CalendarOutlined,
  FireOutlined, RocketOutlined, ExperimentOutlined
} from '@ant-design/icons';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import CourseCard, { CourseType } from '../components/CourseCard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 课程类型定义
interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
}

// 学生类型定义
interface Student {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  score?: number;
  status?: string;
}

// 学期选项
const SEMESTER_OPTIONS = ['全部', '2023-2024-1', '2023-2024-2', '2024-2025-1', '2024-2025-2'];

// 排序选项
const SORT_OPTIONS = [
  { key: 'name', label: '按名称排序' },
  { key: 'credit', label: '按学分排序' },
  { key: 'semester', label: '按学期排序' },
];

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('全部');
  const [sortOrder, setSortOrder] = useState<string>('name');
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
  const [pageTitle, setPageTitle] = useState('我的课程');
  const [pageDescription, setPageDescription] = useState('查看课程信息');

  // 获取当前用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);

          // 根据用户角色设置页面标题和描述
          if (data.user.role === 'TEACHER') {
            setPageTitle('我的教学课程');
            setPageDescription('查看您正在教授的课程列表，学生可通过这些课程了解课程内容和提交成绩认证请求。');
          } else if (data.user.role === 'STUDENT') {
            setPageTitle('我的选修课程');
            setPageDescription('查看您当前选修的课程列表，了解课程内容和查看成绩。');
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败');
      }
    };

    fetchCurrentUser();
  }, []);

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // 根据用户角色调用不同的API
      const apiUrl = currentUser?.role === 'STUDENT'
        ? '/api/courses/student'
        : '/api/courses/teacher';

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取课程失败');
      }

      const data = await response.json();
      setCourses(data.courses);
      setFilteredCourses(data.courses);

      // 成功获取数据后显示消息
      message.success('课程数据刷新成功');
    } catch (error) {
      console.error('获取课程错误:', error);
      message.error('获取课程信息失败，请稍后再试');
    } finally {
      setLoading(false);
      // 设置延时，让刷新图标旋转一会儿
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  // 在用户信息加载后获取课程数据
  useEffect(() => {
    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser]);

  // 排序课程
  const sortCourses = (coursesToSort: CourseType[]) => {
    return [...coursesToSort].sort((a, b) => {
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortOrder === 'credit') {
        return b.credit - a.credit;
      } else if (sortOrder === 'semester') {
        return b.semester.localeCompare(a.semester);
      }
      return 0;
    });
  };

  // 过滤和排序课程
  useEffect(() => {
    let result = [...courses];

    // 学期筛选
    if (selectedSemester !== '全部') {
      result = result.filter(course => course.semester === selectedSemester);
    }

    // 标签页筛选
    if (activeTab === 'current') {
      result = result.filter(course => course.semester.includes('2023-2024'));
    } else if (activeTab === 'upcoming') {
      result = result.filter(course => course.semester.includes('2024-2025'));
    }

    // 排序
    result = sortCourses(result);

    setFilteredCourses(result);
  }, [selectedSemester, courses, sortOrder, activeTab]);

  // 计算当前学期课程数
  const currentSemesterCourses = courses.filter(c => c.semester.includes('2023-2024')).length;

  // 计算总学分
  const totalCredits = courses.reduce((sum, course) => sum + course.credit, 0);

  // 计算总学生数（去重）
  const totalStudents = courses.reduce((uniqueStudents, course) => {
    if (course.students) {
      course.students.forEach((student: Student) => {
        uniqueStudents.set(student.id, student);
      });
    }
    return uniqueStudents;
  }, new Map()).size;

  // 计算总已完成课程数
  const completedCourses = courses.filter(course => {
    // 示例：假设学期包含2023-2024的是当前学期，其他是已完成学期
    return !course.semester.includes('2023-2024') && !course.semester.includes('2024-2025');
  }).length;

  // 课程完成率（根据实际业务逻辑修改）
  const completionRate = courses.length > 0 ? Math.round((completedCourses / courses.length) * 100) : 0;

  // 切换排序顺序
  const handleSortChange = (key: string) => {
    setSortOrder(key);
  };

  // 排序菜单
  const sortMenu = (
    <Menu
      selectedKeys={[sortOrder]}
      onClick={({ key }) => handleSortChange(key)}
      items={SORT_OPTIONS.map(option => ({
        key: option.key,
        label: option.label,
      }))}
    />
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 顶部标题区域 */}
      <Card
        className="mb-6 shadow-md overflow-hidden rounded-lg"
        bodyStyle={{ padding: 0 }}
      >
        {/* 渐变背景标题 */}
        <div
          className="py-8 px-6 text-white relative"
          style={{
            background: 'linear-gradient(135deg, #1677ff 0%, #06b6d4 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* 装饰性图形 */}
          <div
            className="absolute top-0 right-0 bottom-0 left-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* 右上角装饰性图标 */}
          <div className="absolute top-3 right-3 text-white opacity-20">
            <RocketOutlined style={{ fontSize: 80 }} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <BookOutlined className="text-2xl mr-3" />
              <Title level={2} style={{ color: 'white', margin: 0 }}>{pageTitle}</Title>
            </div>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: '800px', marginBottom: 0 }}>
              {pageDescription}
            </Paragraph>
          </div>
        </div>

        {/* 统计数据卡片 */}
        <div className="p-6">
          <Row gutter={24}>
            <Col xs={24} sm={24} md={16}>
              <div className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Card
                      className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden"
                      bodyStyle={{ padding: '24px', position: 'relative' }}
                    >
                      <div
                        className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-blue-500 opacity-10"
                      />
                      <div className="flex justify-between items-center mb-3">
                        <Text className="text-gray-500 text-lg">总课程数</Text>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <AppstoreOutlined className="text-blue-500 text-xl" />
                        </div>
                      </div>
                      <Title level={2} style={{ margin: 0, color: '#1677ff' }}>
                        {loading ? <Skeleton.Button active style={{ width: 60 }} /> : courses.length}
                      </Title>
                      <div className="mt-2">
                        <Text type="secondary">
                          {loading ?
                            <Skeleton.Button active style={{ width: 120 }} /> :
                            currentUser?.role === 'STUDENT'
                              ? `总共选修 ${courses.length} 门课程`
                              : `总共教授 ${courses.length} 门课程`
                          }
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={8} className="mt-4 sm:mt-0">
                    <Card
                      className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden"
                      bodyStyle={{ padding: '24px', position: 'relative' }}
                    >
                      <div
                        className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-green-500 opacity-10"
                      />
                      <div className="flex justify-between items-center mb-3">
                        <Text className="text-gray-500 text-lg">学生总数</Text>
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                          <TeamOutlined className="text-green-500 text-xl" />
                        </div>
                      </div>
                      <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                        {loading ? <Skeleton.Button active style={{ width: 60 }} /> : totalStudents}
                      </Title>
                      <div className="mt-2">
                        <Text type="secondary">
                          {loading ?
                            <Skeleton.Button active style={{ width: 120 }} /> :
                            `累计教授 ${totalStudents} 名学生`
                          }
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={8} className="mt-4 sm:mt-0">
                    <Card
                      className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden"
                      bodyStyle={{ padding: '24px', position: 'relative' }}
                    >
                      <div
                        className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 rounded-full bg-orange-500 opacity-10"
                      />
                      <div className="flex justify-between items-center mb-3">
                        <Text className="text-gray-500 text-lg">总学分</Text>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                          <CrownOutlined className="text-orange-500 text-xl" />
                        </div>
                      </div>
                      <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>
                        {loading ? <Skeleton.Button active style={{ width: 60 }} /> : totalCredits}
                      </Title>
                      <div className="mt-2">
                        <Text type="secondary">
                          {loading ?
                            <Skeleton.Button active style={{ width: 120 }} /> :
                            `平均每门课 ${(totalCredits / (courses.length || 1)).toFixed(1)} 学分`
                          }
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>

            <Col xs={24} sm={24} md={8} className="mb-6 md:mb-0">
              <Card className="h-full border border-gray-100">
                <Statistic
                  title={
                    <div className="flex items-center mb-2">
                      <FireOutlined className="text-orange-500 mr-2" />
                      <span>教学进度</span>
                    </div>
                  }
                  value={completionRate}
                  suffix="%"
                  valueStyle={{ color: completionRate > 70 ? '#52c41a' : completionRate > 40 ? '#fa8c16' : '#ff4d4f' }}
                />
                <Progress percent={completionRate} status={completionRate < 100 ? "active" : "success"} className="mt-2" />
                <div className="mt-3">
                  <Badge status={completionRate > 70 ? "success" : "processing"} text={
                    <Text type="secondary">本学期课程已完成 {completionRate}%</Text>
                  } />
                </div>
              </Card>
            </Col>
          </Row>

          {/* 过滤和分类区域 */}
          <div className="mt-6 border-t pt-6">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="flex items-center mb-3 md:mb-0">
                <FilterOutlined className="text-blue-500 mr-2" />
                <Text strong className="text-lg">课程筛选</Text>
              </div>

              <div className="flex flex-wrap gap-2">
                <Dropdown overlay={sortMenu} placement="bottomRight">
                  <Button icon={<SortAscendingOutlined />}>
                    {SORT_OPTIONS.find(option => option.key === sortOrder)?.label || '排序方式'}
                  </Button>
                </Dropdown>
              </div>
            </div>

            {/* 标签页分类 */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="mb-4"
              tabBarStyle={{ marginBottom: 16 }}
            >
              <TabPane
                tab={
                  <span>
                    <AppstoreOutlined />
                    全部课程
                  </span>
                }
                key="all"
              />
              <TabPane
                tab={
                  <span>
                    <CalendarOutlined />
                    本学期课程
                  </span>
                }
                key="current"
              />
              <TabPane
                tab={
                  <span>
                    <RocketOutlined />
                    未来课程
                  </span>
                }
                key="upcoming"
              />
            </Tabs>

            {/* 学期筛选按钮组 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {SEMESTER_OPTIONS.map(semester => (
                <Button
                  key={semester}
                  type={selectedSemester === semester ? 'primary' : 'default'}
                  onClick={() => setSelectedSemester(semester)}
                  className="mb-2"
                >
                  {semester}
                </Button>
              ))}
            </div>

            {/* 筛选结果统计 */}
            <div className="mt-2 mb-2">
              <Badge status="processing" color="#1677ff" />
              <Text type="secondary" className="ml-2">
                当前显示: {filteredCourses.length} 门课程
                {selectedSemester !== '全部' && `, 学期: ${selectedSemester}`}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* 课程列表 */}
      {loading ? (
        <div className="text-center py-10">
          <Spin size="large" tip="加载课程数据中..." />
        </div>
      ) : filteredCourses.length > 0 ? (
        // 显示课程 - 使用Masonry布局
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 1, 750: 2, 1200: 3, 1600: 4 }}
        >
          <Masonry gutter="16px">
            {filteredCourses.map((course) => (
              <div key={course.id} className="mb-4 animate-fadeIn" style={{
                animation: 'fadeIn 0.5s ease-in-out',
              }}>
                <CourseCard course={course} />
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      ) : (
        // 没有课程
        <Card className="text-center py-10 shadow-sm rounded-lg">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} className="mt-4 text-gray-500">
                  {selectedSemester === '全部' ? "暂无教学课程" : `${selectedSemester}学期暂无教学课程`}
                </Title>
                <Text type="secondary" className="block mb-4">
                  {selectedSemester === '全部' ?
                    "您当前没有任何教学课程，请联系管理员分配课程。" :
                    `您在${selectedSemester}学期没有教学课程，请尝试选择其他学期。`
                  }
                </Text>
              </div>
            }
          >
            <Button type="primary" onClick={fetchCourses} icon={<ReloadOutlined />}>
              重新加载
            </Button>
          </Empty>
        </Card>
      )}

      {/* 控制按钮区域 */}
      <div className="flex justify-between mb-4">
        <div>
          {/* ... existing code ... */}
        </div>

        <div className="flex items-center">
          <Tooltip title="刷新课程数据">
            <Button
              type="primary"
              loading={refreshing}
              icon={<ReloadOutlined />}
              onClick={fetchCourses}
              className="mr-2"
            >
              刷新课程
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
} 