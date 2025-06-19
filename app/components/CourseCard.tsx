import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Badge, Avatar, Button, Tooltip, Modal, Progress, 
         Tabs, Table, Empty, Spin, Form, Input, InputNumber, Select, message } from 'antd';
import { BookOutlined, ClockCircleOutlined, TeamOutlined, CalendarOutlined, 
         InfoCircleOutlined, UserOutlined, EditOutlined, FileTextOutlined,
         CheckCircleOutlined, HistoryOutlined, TrophyOutlined, SaveOutlined } from '@ant-design/icons';
import EditCourseModal from '@/app/dashboard/courses/components/EditCourseModal';
import Image from 'next/image';

const { Text, Paragraph, Title } = Typography;
const { TabPane } = Tabs;

// 用户类型定义
type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

// 课程类型定义
export interface CourseType {
  id: string;
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
  imageUrl?: string | null;
  progress?: number | null; // 课程教学进度
  students?: Array<{
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    score?: number;
    status?: string;
  }>;
  studentCount?: number;
  teachers?: User[];
  teacherIds?: string[];
}

// 学生成绩类型
type StudentGrade = {
  studentId: string;
  studentName: string;
  email?: string;
  score?: number;
  grade?: string; // A, B, C, D, F
  status: 'enrolled' | 'completed' | 'dropped';
  lastUpdated?: string;
};

interface CourseCardProps {
  course: CourseType;
  hoverable?: boolean;
  className?: string;
  onCourseUpdate?: (updatedCourse: CourseType) => void;
}

export default function CourseCard({ course, hoverable = true, className = '', onCourseUpdate }: CourseCardProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [courseProgress, setCourseProgress] = useState<number | null | undefined>(course.progress);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [courseTeachers, setCourseTeachers] = useState<User[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [savingGrade, setSavingGrade] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<Array<{
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
    status?: string;
    score?: number;
  }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [addingTestData, setAddingTestData] = useState(false);

  // 根据学期获取标签颜色
  const getTagColor = (semester: string) => {
    const currentYear = new Date().getFullYear();
    const [year] = semester.split('-');
    
    if (parseInt(year) === currentYear) {
      return 'green';
    } else if (parseInt(year) > currentYear) {
      return 'blue';
    } else {
      return 'orange';
    }
  };

  // 随机生成课程背景颜色
  const getRandomColor = (courseCode: string) => {
    // 使用课程代码生成一致的颜色
    const colors = [
      'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
      'linear-gradient(135deg, #13c2c2 0%, #1890ff 100%)',
      'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
      'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)',
      'linear-gradient(135deg, #7cb305 0%, #52c41a 100%)',
      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      'linear-gradient(135deg, #f759ab 0%, #eb2f96 100%)',
      'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)'
    ];
    
    // 使用课程代码的字符编码和来获取一个固定的索引
    const sum = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // 获取课程进度状态和颜色
  const getProgressStatus = (progress: number | null | undefined) => {
    if (progress === null || progress === undefined) return { status: 'normal', color: '#1890ff', text: '未开始' };
    if (progress === 100) return { status: 'success', color: '#52c41a', text: '已完成' };
    if (progress >= 75) return { status: 'active', color: '#1890ff', text: '进行中' };
    if (progress >= 50) return { status: 'active', color: '#faad14', text: '进行中' };
    if (progress >= 25) return { status: 'active', color: '#fa8c16', text: '进行中' };
    return { status: 'active', color: '#fa8c16', text: '刚开始' };
  };

  // 获取课程真实教学进度
  const fetchCourseProgress = async () => {
    if (!course.id) return;
    
    try {
      setLoadingProgress(true);
      const response = await fetch(`/api/courses/${course.id}/progress`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.progress === 'number') {
          setCourseProgress(data.progress);
        }
      } else {
        console.error('获取课程进度失败:', await response.text());
      }
    } catch (error) {
      console.error('获取课程进度出错:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // 获取课程教师
  const fetchCourseTeachers = async () => {
    if (!course.id) return;
    
    try {
      setLoadingTeachers(true);
      const response = await fetch(`/api/courses/${course.id}/teachers`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.teachers)) {
          // 确保数据符合User类型
          const teachers = data.teachers.map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email || '',
            role: teacher.role || 'TEACHER'
          }));
          setCourseTeachers(teachers);
        }
      } else {
        console.error('获取课程教师失败:', await response.text());
      }
    } catch (error) {
      console.error('获取课程教师出错:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // 获取学生成绩信息
  const fetchStudentGrades = async () => {
    if (!course.id) return;
    
    try {
      setLoadingGrades(true);
      const response = await fetch(`/api/courses/${course.id}/grades`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.grades)) {
          setStudentGrades(data.grades);
        }
      } else {
        console.error('获取学生成绩失败:', await response.text());
      }
    } catch (error) {
      console.error('获取学生成绩出错:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  // 获取选课学生
  const fetchEnrolledStudents = async () => {
    if (!course.id) return;
    
    try {
      setLoadingStudents(true);
      const response = await fetch(`/api/courses/${course.id}/enroll`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.students)) {
          setEnrolledStudents(data.students);
        }
      } else {
        console.error('获取选课学生失败:', await response.text());
      }
    } catch (error) {
      console.error('获取选课学生出错:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 添加测试选课数据
  const addTestEnrollmentData = async () => {
    if (!course.id) return;
    
    try {
      setAddingTestData(true);
      const response = await fetch(`/api/courses/${course.id}/enroll/seed`, {
        method: 'POST',
      });
      
      if (response.ok) {
        message.success('测试数据已添加');
        // 刷新学生和成绩数据
        fetchEnrolledStudents();
        fetchStudentGrades();
      } else {
        const errorData = await response.json();
        message.error(`添加测试数据失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('添加测试数据出错:', error);
      message.error('添加测试数据失败');
    } finally {
      setAddingTestData(false);
    }
  };

  // 组件挂载时获取课程进度和教师信息
  useEffect(() => {
    if (courseProgress === undefined) {
      fetchCourseProgress();
    }
    if (courseTeachers.length === 0) {
      fetchCourseTeachers();
    }
  }, [course.id]);

  // 在打开详情模态框时获取数据
  useEffect(() => {
    if (isModalVisible) {
      if (courseTeachers.length === 0) {
        fetchCourseTeachers();
      }
      
      // 获取学生成绩数据
      fetchStudentGrades();
      
      // 获取选课学生数据
      fetchEnrolledStudents();
    }
  }, [isModalVisible, course.id]);

  // 显示课程详情模态框
  const showCourseDetails = () => {
    setIsModalVisible(true);
  };

  // 显示编辑课程模态框
  const showEditCourseModal = () => {
    setIsEditModalVisible(true);
  };
  
  // 处理课程更新
  const handleCourseUpdate = (updatedCourse: CourseType) => {
    if (onCourseUpdate) {
      onCourseUpdate(updatedCourse);
    }
    setIsEditModalVisible(false);
  };

  // 获取进度显示样式和状态
  const progress = courseProgress ?? 0;
  const { status, color, text } = getProgressStatus(progress);
  
  // 获取成绩状态的标签颜色
  const getGradeStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'blue';
      case 'completed': return 'green';
      case 'dropped': return 'red';
      default: return 'default';
    }
  };

  // 获取成绩等级的显示样式
  const getGradeColor = (grade?: string) => {
    if (!grade) return {};
    
    switch (grade) {
      case 'A': return { color: '#52c41a' }; // 绿色
      case 'B': return { color: '#1890ff' }; // 蓝色
      case 'C': return { color: '#faad14' }; // 黄色
      case 'D': return { color: '#fa8c16' }; // 橙色
      case 'F': return { color: '#f5222d' }; // 红色
      default: return {};
    }
  };

  // 提交学生成绩更新
  const handleSubmitGrade = async (values: any) => {
    if (!editingStudentId || !course.id) return;
    
    try {
      setSavingGrade(true);
      
      const response = await fetch(`/api/courses/${course.id}/grades`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: editingStudentId,
          score: values.score,
          status: values.status
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新成绩失败');
      }
      
      // 成功更新后刷新成绩数据
      fetchStudentGrades();
      setEditingStudentId(null);
      message.success('成绩更新成功');
    } catch (error: any) {
      message.error(`更新失败: ${error.message || '未知错误'}`);
      console.error('更新学生成绩失败:', error);
    } finally {
      setSavingGrade(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingStudentId(null);
    editForm.resetFields();
  };

  // 开始编辑学生成绩
  const startEditing = (studentId: string, record: StudentGrade) => {
    setEditingStudentId(studentId);
    editForm.setFieldsValue({
      score: record.score,
      status: record.status
    });
  };

  // 将分数转换为等级
  const getGradeFromScore = (score?: number): string | null => {
    if (score === undefined || score === null) return null;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <>
      <div 
        className={`${className} bg-white rounded-lg overflow-hidden transition-all duration-300 ${
          isHovered ? 'shadow-xl transform -translate-y-1' : 'shadow-md'
        }`}
        style={{ 
          width: '100%', 
          border: '1px solid #eaeaea',
          marginBottom: '24px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 顶部显示课程代码和学分信息 */}
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
          <Tag color="blue" className="mr-0">{course.code}</Tag>
          <div className="flex items-center">
            <Tag color={getTagColor(course.semester)} className="mr-1">
              {course.semester.replace(/-(\d+)$/, ' 学期$1')}
            </Tag>
            <Badge 
              count={`${course.credit} 学分`} 
              style={{
                backgroundColor: course.credit > 3 ? '#ff4d4f' : '#1890ff',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        {/* 图片部分 - 不显示任何文字 */}
        <div className="relative" style={{ height: '240px' }}>
          {course.imageUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <img 
                src={course.imageUrl} 
                alt={course.name}
                className="max-w-full max-h-full object-contain"
                style={{ width: 'auto', maxWidth: '100%' }}
              />
            </div>
          ) : (
            <div 
              className="w-full h-full" 
              style={{ background: getRandomColor(course.code) }}
            />
          )}
          
          {/* 悬停时显示的操作按钮 */}
          <div 
            className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button 
              type="primary" 
              ghost 
              icon={<InfoCircleOutlined />}
              onClick={showCourseDetails}
              className="mr-2"
            >
              查看详情
            </Button>
            
            <Button 
              type="primary" 
              ghost 
              icon={<EditOutlined />}
              onClick={showEditCourseModal}
            >
              编辑课程
            </Button>
          </div>
        </div>
        
        {/* 课程信息部分 - 白色背景区域 */}
        <div className="p-5" style={{ minHeight: '220px' }}>
          {/* 课程名称 */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{course.name}</h2>
          
          {/* 课程描述 */}
          <Paragraph 
            ellipsis={{ rows: 3, expandable: true, symbol: '查看更多' }}
            className="text-gray-600 mb-4"
          >
            {course.description}
          </Paragraph>
          
          {/* 教学进度 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <Text className="text-gray-600 flex items-center">
                <HistoryOutlined className="mr-1" />
                教学进度
              </Text>
              <Text className="text-gray-600">{progress}%</Text>
            </div>
            <Progress 
              percent={progress} 
              status={status as "success" | "active" | "normal" | "exception"} 
              strokeColor={color}
              size="small"
            />
            <div className="mt-1">
              <Text type="secondary" className="text-xs">
                {loadingProgress ? '正在获取进度...' : 
                 progress === 100 ? <span className="text-green-500 flex items-center"><CheckCircleOutlined className="mr-1" />教学已完成</span> : 
                 `教学${text}`}
              </Text>
            </div>
          </div>
          
          {/* 底部信息和操作 */}
          <div className="flex justify-between items-center pt-3 mt-auto border-t border-gray-100">
            <div className="flex items-center">
              <TeamOutlined className="text-blue-500 mr-1" />
              <Text className="text-gray-600">{course.studentCount || 0} 名学生</Text>
            </div>
            
            <div className="flex">
              <Button 
                type="text" 
                size="small" 
                icon={<TeamOutlined />}
                className="text-gray-500 hover:text-blue-500 mr-2"
              >
                学生
              </Button>
              <Button 
                type="text" 
                size="small" 
                icon={<FileTextOutlined />}
                className="text-gray-500 hover:text-blue-500"
              >
                成绩
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 课程详情模态框 */}
      <Modal
        title={
          <div className="flex items-center">
            <BookOutlined className="mr-2 text-blue-500" />
            <span>{course.name}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="edit" 
            type="primary"
            onClick={() => {
              setIsModalVisible(false);
              showEditCourseModal();
            }}
          >
            编辑课程
          </Button>,
        ]}
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="课程信息" key="info">
            <div className="p-4">
              {/* 如果有课程图片，显示在模态框顶部 */}
              {course.imageUrl && (
                <div className="w-full mb-4 rounded-lg overflow-hidden bg-gray-50 p-4 text-center">
                  <img 
                    src={course.imageUrl} 
                    alt={course.name}
                    className="max-w-full max-h-64 object-contain inline-block"
                  />
                </div>
              )}
            
              <div className="mb-6">
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <Text type="secondary">课程代码:</Text>
                    <div>
                      <Tag color="blue" className="text-lg px-3 py-1">{course.code}</Tag>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">学分:</Text>
                    <div>
                      <Tag color="red" className="text-lg px-3 py-1">{course.credit} 学分</Tag>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">学期:</Text>
                    <div>
                      <Tag color={getTagColor(course.semester)} className="text-lg px-3 py-1">{course.semester}</Tag>
                    </div>
                  </div>
                </div>
                
                {/* 模态框中显示教学进度 */}
                <div className="mb-4">
                  <Title level={5}>教学进度</Title>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Progress 
                      percent={progress} 
                      status={status as "success" | "active" | "normal" | "exception"} 
                      strokeColor={color}
                    />
                    <Text className="block mt-2">
                      {progress === 100 ? 
                        <span className="text-green-500 flex items-center"><CheckCircleOutlined className="mr-1" />课程教学已全部完成</span> : 
                        `课程已完成 ${progress}%，${text}`}
                    </Text>
                  </div>
                </div>
                
                <Title level={5}>课程描述</Title>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Paragraph>{course.description}</Paragraph>
                </div>
              </div>
              
              <div className="mb-4">
                <Title level={5}>教学目标</Title>
                <ul className="list-disc pl-5">
                  <li>理解{course.name}的基本概念和原理</li>
                  <li>掌握相关技术的实际应用方法</li>
                  <li>培养学生的实践能力和创新思维</li>
                  <li>提高学生的团队协作和问题解决能力</li>
                </ul>
              </div>
              
              {/* 授课教师部分 */}
              <div className="mb-4">
                <Title level={5}>授课教师</Title>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {loadingTeachers ? (
                    <div className="text-center py-2">加载教师信息中...</div>
                  ) : courseTeachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {courseTeachers.map((teacher) => (
                        <Tag
                          key={teacher.id}
                          color="blue"
                          style={{
                            fontSize: '14px',
                            padding: '4px 8px',
                            marginBottom: '8px'
                          }}
                        >
                          <UserOutlined style={{ marginRight: '4px' }} />
                          {teacher.name}
                        </Tag>
                      ))}
                    </div>
                  ) : course.teachers && course.teachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {course.teachers.map((teacher) => (
                        <Tag
                          key={teacher.id}
                          color="blue"
                          style={{
                            fontSize: '14px',
                            padding: '4px 8px',
                            marginBottom: '8px'
                          }}
                        >
                          <UserOutlined style={{ marginRight: '4px' }} />
                          {teacher.name}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">暂无教师分配</Text>
                  )}
                </div>
              </div>
              
              <div>
                <Title level={5}>选课学生</Title>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {loadingStudents ? (
                    <div className="text-center py-2">
                      <Spin size="small" tip="加载学生信息..." />
                    </div>
                  ) : enrolledStudents.length > 0 ? (
                    <div>
                      <div className="mb-2">
                        <Text type="secondary">共 {enrolledStudents.length} 名学生选修此课程</Text>
                      </div>
                      <Avatar.Group maxCount={10} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                        {enrolledStudents.map((student) => (
                          <Tooltip 
                            title={
                              <div>
                                <div>{student.name}</div>
                                {student.email && <div>{student.email}</div>}
                                {student.score !== undefined && (
                                  <div>成绩: {student.score} ({getGradeFromScore(student.score)})</div>
                                )}
                                <div>状态: {student.status === 'enrolled' ? '在修' : 
                                           student.status === 'completed' ? '已完成' : 
                                           student.status === 'dropped' ? '已退课' : '未知'}</div>
                              </div>
                            } 
                            key={student.id}
                          >
                            <Avatar 
                              style={{ 
                                backgroundColor: getRandomColor(student.id).split(',')[0], 
                              }}
                              src={student.avatarUrl || undefined}
                            >
                              {student.name.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </Avatar.Group>
                      <div className="mt-3">
                        <Button 
                          size="small" 
                          type="primary" 
                          icon={<FileTextOutlined />}
                          onClick={() => setActiveTab('grades')}
                        >
                          查看成绩详情
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Text type="secondary">暂无学生选修此课程</Text>
                      <div className="mt-2 flex gap-2">
                        <Button size="small" type="primary">
                          添加学生
                        </Button>
                        <Button 
                          size="small" 
                          type="default" 
                          onClick={addTestEnrollmentData}
                          loading={addingTestData}
                        >
                          生成测试数据
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <TrophyOutlined /> 学生成绩
              </span>
            } 
            key="grades"
          >
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <Title level={5}>选课学生成绩信息</Title>
                <Button type="primary" size="small">导出成绩单</Button>
              </div>
              
              {loadingGrades ? (
                <div className="text-center py-8">
                  <Spin size="large" tip="正在加载成绩数据..." />
                </div>
              ) : studentGrades.length > 0 ? (
                <Table 
                  dataSource={studentGrades} 
                  rowKey="studentId"
                  pagination={false}
                  bordered
                  className="w-full"
                >
                  <Table.Column 
                    title="学生姓名" 
                    dataIndex="studentName" 
                    key="studentName"
                    render={(text, record: StudentGrade) => (
                      <div className="flex items-center">
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: getRandomColor(record.studentId).split(',')[0],
                            marginRight: '8px'
                          }}
                        >
                          {text.charAt(0)}
                        </Avatar>
                        {text}
                      </div>
                    )}
                  />
                  <Table.Column 
                    title="邮箱" 
                    dataIndex="email" 
                    key="email"
                    render={(text) => text || '-'}
                  />
                  <Table.Column 
                    title="分数" 
                    dataIndex="score" 
                    key="score"
                    render={(text, record: StudentGrade) => {
                      // 是否正在编辑该学生的成绩
                      if (editingStudentId === record.studentId) {
                        return (
                          <Form.Item
                            name="score"
                            style={{ margin: 0 }}
                            rules={[
                              { required: false },
                              { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间' }
                            ]}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              style={{ width: '100%' }} 
                              placeholder="输入分数" 
                            />
                          </Form.Item>
                        );
                      }
                      
                      return text !== undefined ? text : '-';
                    }}
                  />
                  <Table.Column 
                    title="等级" 
                    dataIndex="grade" 
                    key="grade"
                    render={(text, record: StudentGrade) => (
                      <span style={getGradeColor(text)}>
                        {text || '-'}
                      </span>
                    )}
                  />
                  <Table.Column 
                    title="状态" 
                    dataIndex="status" 
                    key="status"
                    render={(text, record: StudentGrade) => {
                      // 是否正在编辑该学生的状态
                      if (editingStudentId === record.studentId) {
                        return (
                          <Form.Item
                            name="status"
                            style={{ margin: 0 }}
                            rules={[{ required: true, message: '请选择状态' }]}
                          >
                            <Select style={{ width: '100%' }}>
                              <Select.Option value="enrolled">在修</Select.Option>
                              <Select.Option value="completed">已完成</Select.Option>
                              <Select.Option value="dropped">已退课</Select.Option>
                            </Select>
                          </Form.Item>
                        );
                      }
                      
                      return (
                        <Tag color={getGradeStatusColor(text)}>
                          {text === 'enrolled' ? '在修' : 
                           text === 'completed' ? '已完成' : 
                           text === 'dropped' ? '已退课' : text}
                        </Tag>
                      );
                    }}
                  />
                  <Table.Column 
                    title="最后更新" 
                    dataIndex="lastUpdated" 
                    key="lastUpdated"
                    render={(text) => text || '-'}
                  />
                  <Table.Column 
                    title="操作" 
                    key="action"
                    render={(_, record: StudentGrade) => {
                      if (editingStudentId === record.studentId) {
                        return (
                          <div className="flex gap-2">
                            <Button 
                              type="primary" 
                              size="small" 
                              icon={<SaveOutlined />} 
                              onClick={() => editForm.submit()}
                              loading={savingGrade}
                            >
                              保存
                            </Button>
                            <Button 
                              size="small" 
                              onClick={handleCancelEdit}
                              disabled={savingGrade}
                            >
                              取消
                            </Button>
                          </div>
                        );
                      }
                      
                      return (
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => startEditing(record.studentId, record)}
                        >
                          编辑
                        </Button>
                      );
                    }}
                  />
                </Table>
              ) : (
                <Empty 
                  description="暂无学生成绩数据" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="py-8"
                />
              )}
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <Text type="secondary">
                  <InfoCircleOutlined style={{ marginRight: '8px' }} />
                  成绩评定标准: A (90-100), B (80-89), C (70-79), D (60-69), F (&lt;60)
                </Text>
              </div>
            </div>
            
            {/* 编辑成绩表单 */}
            <Form
              form={editForm}
              onFinish={handleSubmitGrade}
              hidden
            />
          </TabPane>
        </Tabs>
      </Modal>

      {/* 编辑课程模态框 */}
      {isEditModalVisible && (
        <EditCourseModal
          course={course}
          isOpen={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onEditCourse={handleCourseUpdate}
        />
      )}
    </>
  );
} 