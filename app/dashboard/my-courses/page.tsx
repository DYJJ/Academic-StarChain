'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Typography, Empty, Spin,
  message, Badge, Tag, Tooltip, Avatar, Divider, Modal
} from 'antd';
import {
  BookOutlined, PlusOutlined, SyncOutlined, 
  TeamOutlined, CalendarOutlined, TrophyOutlined, 
  AppstoreOutlined, DashboardOutlined, FireOutlined,
  ReadOutlined, UserOutlined, BarChartOutlined, RightOutlined,
  ClockCircleOutlined, CheckCircleOutlined, EditOutlined
} from '@ant-design/icons';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';
import CustomCourseCard from './components/CustomCourseCard';
import { Course, Student, GradeData } from './types';
import { COLORS, SHADOWS, GRADIENTS } from './styles/constants';
import StatisticCards from './components/StatisticCards';
import StudentListModal from './components/StudentListModal';
import GradeAnalysisModal from './components/GradeAnalysisModal';
import PageStyles from './components/PageStyles';

const { Title, Text, Paragraph } = Typography;

export default function MyCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [courseDetailModalVisible, setCourseDetailModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // 假数据 - 成绩分布
  const gradeData: GradeData[] = [
    { range: '90-100', count: 5, color: '#52c41a' },
    { range: '80-89', count: 12, color: '#1890ff' },
    { range: '70-79', count: 8, color: '#faad14' },
    { range: '60-69', count: 3, color: '#fa8c16' },
    { range: '< 60', count: 2, color: '#f5222d' }
  ];

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      logAction(LogAction.VIEW_DASHBOARD, '访问我的课程页面', currentUser.id);
    }
  }, [currentUser?.id]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        fetchCourses(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchCourses = async (user = currentUser) => {
    if (!user) return;

    try {
      setLoading(true);
      setRefreshing(true);

      const userRole = user.role;
      const apiUrl = userRole === 'STUDENT' ? '/api/courses/student' : '/api/courses/teacher';

      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          message.error('您没有权限访问此页面');
          return;
        }
        throw new Error('获取课程失败');
      }

      const data = await response.json();
      
      // 确保每个课程都有正确的教师数组
      const coursesWithTeachers = (data.courses || []).map((course: any) => {
        // 处理API返回的数据结构差异
        let teachers = [];
        if (course.teachers && Array.isArray(course.teachers)) {
          teachers = course.teachers;
        } else if (course.users && Array.isArray(course.users)) {
          // 如果API返回的是users属性，过滤出教师角色的用户
          teachers = course.users.filter((user: any) => user.role === 'TEACHER');
        }
        
        return {
          ...course,
          teachers: teachers
        };
      });
      
      setCourses(coursesWithTeachers);

      if (refreshing) {
        message.success('课程数据刷新成功');
      }

      if (user.role === 'STUDENT') {
        logAction(LogAction.VIEW_COURSE, '学生查看选修课程列表', user.id);
      } else {
        logAction(LogAction.VIEW_COURSE, '教师查看教授课程列表', user.id);
      }
    } catch (err: any) {
      message.error(err.message || '加载数据失败');
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    try {
      setStudentsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/enroll`);
      if (!response.ok) throw new Error('获取学生列表失败');
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
    if (currentUser?.id) {
      logAction(LogAction.VIEW_STUDENT, `查看课程"${course.name}"(${course.code})的学生列表`, currentUser.id);
    }
  };

  const showGradeModal = (course: Course) => {
    setSelectedCourse(course);
    setGradeModalVisible(true);
    if (currentUser?.id) {
      logAction(LogAction.VIEW_GRADE, `查看课程"${course.name}"(${course.code})的成绩分析`, currentUser.id);
    }
  };

  const viewCourseDetail = (course: Course) => {
    // 确保课程具有完整的教师信息
    const selectedCourseWithTeachers = {
      ...course,
      teachers: course.teachers || []
    };
    
    setSelectedCourse(selectedCourseWithTeachers);
    setCourseDetailModalVisible(true);
    if (currentUser?.id) {
      logAction(LogAction.VIEW_COURSE, `查看课程"${course.name}"(${course.code})详情`, currentUser.id);
    }
  };

  const handleEditCourse = (course: Course) => {
    if (currentUser?.id) {
      logAction(LogAction.UPDATE_COURSE, `编辑课程"${course.name}"(${course.code})`, currentUser.id);
    }
    router.push(`/dashboard/courses/edit/${course.id}`);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'compact' : 'grid');
  };

  const getRandomGradient = (index: number) => {
    return GRADIENTS[index % GRADIENTS.length];
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: COLORS.bgLight,
        display: 'flex',
        flexDirection: 'column' 
      }}>
        <Navbar />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <div style={{
            position: 'relative',
            marginBottom: '30px'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #4d7cfe, #36b37e)',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 15px 30px rgba(77, 124, 254, 0.2)'
            }}>
              <BookOutlined style={{ fontSize: '48px', color: 'white' }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px'
            }}>
              <Spin size="large" />
            </div>
          </div>
          <Title level={4} style={{ 
            marginBottom: '12px',
            color: COLORS.textPrimary,
            fontWeight: 600
          }}>
            加载课程数据中...
          </Title>
          <Text style={{ 
            color: COLORS.textMuted,
            fontSize: '16px'
          }}>
            准备您的个性化学习体验
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.bgLight,
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <Navbar />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 页面头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          background: COLORS.cardBg,
          borderRadius: '16px',
          padding: '30px',
          boxShadow: SHADOWS.md,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.success})`
          }}></div>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success})`,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              boxShadow: '0 10px 20px rgba(77, 124, 254, 0.2)'
            }}>
              <BookOutlined style={{ fontSize: '30px', color: 'white' }} />
            </div>
            
            <div>
              <Title level={2} style={{ 
                margin: '0 0 8px 0',
                color: COLORS.textPrimary,
                fontWeight: 600
              }}>
                {currentUser?.role === 'STUDENT' ? '我的选修课程' : '我的教学课程'}
              </Title>
              
              <Paragraph style={{
                color: COLORS.textSecondary,
                margin: 0,
                maxWidth: '600px'
              }}>
                {currentUser?.role === 'STUDENT'
                  ? '显示您已选修的所有课程信息，包括课程详情、学分及教学进度'
                  : '展示您正在教授的所有课程，包括课程详情、学生人数及教学进度'}
              </Paragraph>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center'
          }}>
            <Tooltip title={viewMode === 'grid' ? '切换为紧凑视图' : '切换为网格视图'}>
              <Button
                icon={viewMode === 'grid' ? <AppstoreOutlined /> : <DashboardOutlined />}
                onClick={toggleViewMode}
                style={{
                  marginRight: '12px',
                  height: '40px',
                  width: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<SyncOutlined spin={refreshing} />}
              onClick={() => fetchCourses(currentUser)}
              loading={refreshing}
              style={{ 
                height: '40px',
                borderRadius: '8px', 
                background: COLORS.primary,
                borderColor: COLORS.primary,
                boxShadow: '0 6px 16px rgba(77, 124, 254, 0.2)',
                transition: 'all 0.3s'
              }}
            >
              刷新数据
            </Button>
          </div>
        </div>

        {/* 课程统计卡片 */}
        <div style={{ marginBottom: '40px' }}>
          <StatisticCards 
            courses={courses} 
            userRole={currentUser?.role || ''}
          />
        </div>

        {/* 课程列表区域 */}
        <div style={{ marginBottom: '60px' }}>
          {/* 课程列表标题栏 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: `linear-gradient(to bottom, ${COLORS.primary}, ${COLORS.success})`,
                borderRadius: '2px',
                marginRight: '12px'
              }}></div>
              
              <Title level={4} style={{
                margin: 0,
                color: COLORS.textPrimary,
                fontWeight: 600
              }}>
                {courses.length > 0 ? '课程列表' : '暂无课程'}
              </Title>
            </div>

            {courses.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <Tag 
                  color={COLORS.primary} 
                  icon={<BookOutlined />}
                  style={{
                    marginRight: '12px',
                    padding: '0 12px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  {`共 ${courses.length} 门课程`}
                </Tag>
                
                <Tooltip title="火热课程优先">
                  <Button 
                    type="text" 
                    icon={<FireOutlined />} 
                    size="small"
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'all 0.3s'
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </div>

          {/* 课程列表内容 */}
          {courses.length > 0 ? (
            <div style={{
              transition: 'all 0.5s ease'
            }}>
              <Row gutter={[24, 24]}>
                {courses.map((course, index) => (
                  <Col 
                    xs={24} 
                    sm={viewMode === 'compact' ? 24 : 12} 
                    md={viewMode === 'compact' ? 12 : 8} 
                    xl={viewMode === 'compact' ? 8 : 6} 
                    key={course.id}
                    style={{
                      transition: 'all 0.3s ease',
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <Badge.Ribbon 
                      text={course.semester === '2023-2024-2' ? '当前学期' : ''}
                      color={COLORS.success}
                      style={{
                        display: course.semester === '2023-2024-2' ? 'block' : 'none',
                        height: '28px',
                        lineHeight: '28px',
                        padding: '0 10px',
                        borderRadius: '0 0 6px 6px',
                        fontWeight: 500,
                        fontSize: '12px'
                      }}
                    >
                      <div 
                        className="enhanced-card-container"
                        style={{
                          height: '100%'
                        }}
                      >
                        <CustomCourseCard 
                          course={course}
                          gradient={getRandomGradient(index)}
                          onViewDetails={() => viewCourseDetail(course)}
                          onShowStudents={() => showStudentModal(course)}
                          onShowGrades={() => showGradeModal(course)}
                          onEditCourse={() => handleEditCourse(course)}
                        />
                      </div>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>
            </div>
          ) : (
            <div style={{ 
              background: COLORS.cardBg,
              borderRadius: '16px',
              boxShadow: SHADOWS.sm,
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <div style={{
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #f5f7fa, #e4e8f0)',
                  borderRadius: '50%',
                  margin: '0 auto 30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOutlined style={{ 
                    fontSize: '40px',
                    color: COLORS.textSecondary
                  }} />
                </div>
                
                <Title level={3} style={{
                  color: COLORS.textPrimary,
                  marginBottom: '16px',
                  fontWeight: 600
                }}>
                  {currentUser?.role === 'STUDENT' ? '您还没有选修任何课程' : '您还没有教授任何课程'}
                </Title>
                
                <Paragraph style={{
                  color: COLORS.textSecondary,
                  fontSize: '16px',
                  marginBottom: '32px'
                }}>
                  {currentUser?.role === 'STUDENT' 
                    ? '通过选课系统浏览和选择感兴趣的课程，开启您的学习之旅'
                    : '创建新课程并管理您的教学内容，分享您的专业知识'}
                </Paragraph>
                
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="large"
                  style={{ 
                    height: '48px',
                    padding: '0 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: COLORS.primary,
                    borderColor: COLORS.primary,
                    boxShadow: '0 6px 16px rgba(77, 124, 254, 0.2)',
                    transition: 'all 0.3s'
                  }}
                >
                  {currentUser?.role === 'STUDENT' ? '开始选课' : '创建课程'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 学生列表模态窗口 */}
      <StudentListModal
        visible={studentModalVisible}
        onCancel={() => setStudentModalVisible(false)}
        course={selectedCourse}
        students={courseStudents}
        loading={studentsLoading}
        onShowGrades={(courseId, studentId) => {
          setSelectedCourse(courses.find(c => c.id === courseId) || null);
          setGradeModalVisible(true);
          if (currentUser?.id) {
            logAction(
              LogAction.VIEW_GRADE, 
              `查看学生(${studentId})在课程中的成绩`, 
              currentUser.id
            );
          }
        }}
      />

      {/* 成绩分析模态窗口 */}
      <GradeAnalysisModal
        visible={gradeModalVisible}
        onCancel={() => setGradeModalVisible(false)}
        course={selectedCourse}
        gradeData={gradeData}
      />
      
      {/* 课程详情模态窗口 */}
      <Modal
        title={
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BookOutlined style={{ fontSize: '20px', color: COLORS.primary, marginRight: '12px' }} />
              <span style={{ fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary }}>
                {`${selectedCourse?.name || ''} - 课程详情`}
              </span>
            </div>
          </div>
        }
        open={courseDetailModalVisible}
        onCancel={() => setCourseDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCourseDetailModalVisible(false)} style={{
            borderRadius: '8px',
            height: '40px',
            padding: '0 20px',
            fontWeight: 500
          }}>
            关闭
          </Button>
        ]}
        width={720}
        style={{ top: 20 }}
        styles={{ body: { padding: '24px' } }}
        className="custom-modal"
      >
        {selectedCourse && (
          <div style={{ padding: '0 0 20px 0' }}>
            <div style={{ 
              padding: '36px 24px', 
              borderRadius: '12px', 
              background: getRandomGradient(Math.floor(Math.random() * 6)),
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.2)',
                zIndex: 1
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 2, color: 'white' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '16px' 
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '20px'
                  }}>
                    <ReadOutlined style={{ fontSize: '28px', color: 'white' }} />
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>
                      {selectedCourse.name}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      {selectedCourse.code} · {selectedCourse.semester}
                    </div>
                    {selectedCourse?.teachers && selectedCourse.teachers.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '14px', opacity: 0.9, marginRight: '8px' }}>授课教师:</span>
                        {selectedCourse.teachers.map((teacher, idx) => (
                          <Tooltip key={teacher.id} title={teacher.name}>
                            <Avatar 
                              style={{
                                marginRight: '6px',
                                backgroundColor: ['#f56a00', '#7265e6', '#00a2ae', '#ffbf00'][idx % 4],
                                fontSize: '12px',
                                border: '2px solid rgba(255, 255, 255, 0.3)'
                              }}
                              size="small"
                            >
                              {teacher.name.substring(0, 1)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  marginTop: '16px' 
                }}>
                  <div style={{ 
                    padding: '4px 12px', 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '20px',
                    fontSize: '13px',
                    marginRight: '12px'
                  }}>
                    <ClockCircleOutlined style={{ marginRight: '6px' }} />
                    {selectedCourse.credit} 学分
                  </div>
                  
                  <div style={{ 
                    padding: '4px 12px', 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '20px',
                    fontSize: '13px',
                    marginRight: '12px'
                  }}>
                    <TeamOutlined style={{ marginRight: '6px' }} />
                    {selectedCourse.studentCount || 0} 名学生
                  </div>
                  
                  <div style={{ 
                    padding: '4px 12px', 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '20px',
                    fontSize: '13px'
                  }}>
                    <CheckCircleOutlined style={{ marginRight: '6px' }} />
                    进行中
                  </div>
                </div>
              </div>
            </div>

            <div style={{ margin: '30px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary }}>
                  课程描述
                </Text>
              </div>
              <Paragraph style={{ fontSize: '14px', lineHeight: '1.8', color: COLORS.textSecondary }}>
                {selectedCourse.description || '暂无课程描述信息。'}
              </Paragraph>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            <div>
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '16px', fontWeight: 600, color: COLORS.textPrimary }}>
                  授课教师
                </Text>
              </div>
              <div style={{ marginBottom: '20px' }}>
                {selectedCourse?.teachers && selectedCourse.teachers.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedCourse.teachers.map((teacher, idx) => (
                      <div key={teacher.id} style={{ 
                        padding: '16px', 
                        background: '#f7f9fc', 
                        borderRadius: '10px',
                        marginRight: '16px',
                        marginBottom: '16px',
                        width: '200px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <Avatar 
                            style={{
                              marginRight: '12px',
                              backgroundColor: ['#f56a00', '#7265e6', '#00a2ae', '#ffbf00'][idx % 4],
                            }}
                            size="large"
                          >
                            {teacher.name.substring(0, 1)}
                          </Avatar>
                          <div>
                            <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{teacher.name}</div>
                            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>教师</div>
                          </div>
                        </div>
                        {teacher.email && (
                          <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                            <span style={{ marginRight: '6px' }}>邮箱:</span>
                            {teacher.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    description="暂无教师信息"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', marginTop: '24px', justifyContent: 'flex-end' }}>
              <Button 
                type="primary" 
                icon={<TeamOutlined />}
                onClick={() => {
                  setCourseDetailModalVisible(false);
                  setTimeout(() => showStudentModal(selectedCourse), 300);
                }}
                style={{
                  marginRight: '12px',
                  borderRadius: '8px',
                  height: '40px',
                  background: COLORS.primary,
                  borderColor: COLORS.primary
                }}
              >
                查看学生
              </Button>
              <Button 
                icon={<BarChartOutlined />}
                onClick={() => {
                  setCourseDetailModalVisible(false);
                  setTimeout(() => showGradeModal(selectedCourse), 300);
                }}
                style={{
                  borderRadius: '8px',
                  height: '40px'
                }}
              >
                成绩分析
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 全局样式 */}
      <PageStyles />
      
      <style jsx global>{`
        .enhanced-card-container:hover {
          transform: translateY(-6px);
          box-shadow: ${SHADOWS.lg};
        }
      `}</style>
    </div>
  );
} 