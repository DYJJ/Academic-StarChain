'use client';

import { useState, useEffect } from 'react';
import { Typography, Card, Table, Tag, Button, Input, Select, Avatar, 
         message, Space, Tooltip, Drawer, Tabs, Form, InputNumber, 
         Divider, Statistic, Row, Col, Empty, Spin, Badge, Modal } from 'antd';
import { 
  UserOutlined, SearchOutlined, FilterOutlined, TeamOutlined,
  EditOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined,
  MailOutlined, CalendarOutlined, FileTextOutlined, ReloadOutlined,
  EyeOutlined, TrophyOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;

// 学生类型定义
interface Student {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  courses: Course[];
  grades: Grade[];
}

// 课程类型定义
interface Course {
  id: string;
  name: string;
  code: string;
  credit: number;
  semester: string;
}

// 成绩类型定义
interface Grade {
  id: string;
  score: number;
  status: string;
  courseId: string;
  courseName: string;
  updatedAt: string;
}

// 状态文本和颜色映射
const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待验证', color: 'orange' },
  VERIFIED: { text: '已验证', color: 'green' },
  REJECTED: { text: '已拒绝', color: 'red' }
};

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // 成绩编辑状态
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  // 获取教师的学生列表
  const fetchTeacherStudents = async () => {
    try {
      setLoading(true);
      let url = '/api/students/teacher';
      
      // 如果选择了课程，添加课程ID作为查询参数
      if (selectedCourseId) {
        url += `?courseId=${selectedCourseId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取学生失败');
      }

      const data = await response.json();
      setStudents(data.students);
      setFilteredStudents(data.students);
      setTeacherCourses(data.courses);
      
      // 成功消息
      if (selectedCourseId || searchText) {
        message.success(`已找到 ${data.students.length} 名学生`);
      }
    } catch (error) {
      console.error('获取教师学生列表错误:', error);
      message.error('获取学生信息失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchTeacherStudents();
  }, [selectedCourseId]);

  // 根据搜索文本过滤学生
  useEffect(() => {
    if (!searchText) {
      setFilteredStudents(students);
      return;
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setFilteredStudents(filtered);
  }, [searchText, students]);

  // 显示学生详情
  const showStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setDrawerVisible(true);
  };

  // 开始编辑成绩
  const startEditGrade = (gradeId: string) => {
    setEditingGrade(gradeId);
    
    // 找到对应的成绩，设置表单初始值
    if (selectedStudent) {
      const grade = selectedStudent.grades.find(g => g.id === gradeId);
      if (grade) {
        form.setFieldsValue({
          score: grade.score,
          status: grade.status
        });
      }
    }
  };

  // 保存成绩
  const saveGrade = async (gradeId: string) => {
    try {
      // 验证表单
      const values = await form.validateFields();
      
      // 发送请求更新成绩
      const response = await fetch('/api/students/teacher', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeId,
          score: values.score,
          status: values.status,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新成绩失败');
      }
      
      // 更新本地数据
      const updatedStudents = students.map(student => {
        if (student.id === selectedStudent?.id) {
          const updatedGrades = student.grades.map(grade => {
            if (grade.id === gradeId) {
              return { 
                ...grade, 
                score: values.score, 
                status: values.status 
              };
            }
            return grade;
          });
          
          return { ...student, grades: updatedGrades };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      
      // 更新选中的学生数据
      if (selectedStudent) {
        const updatedGrades = selectedStudent.grades.map(grade => {
          if (grade.id === gradeId) {
            return { 
              ...grade, 
              score: values.score, 
              status: values.status 
            };
          }
          return grade;
        });
        
        setSelectedStudent({ ...selectedStudent, grades: updatedGrades });
      }
      
      // 重置编辑状态
      setEditingGrade(null);
      
      // 成功消息
      message.success('成绩更新成功');
    } catch (error) {
      console.error('保存成绩错误:', error);
      message.error('更新成绩失败，请稍后再试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingGrade(null);
    form.resetFields();
  };

  // 确认验证成绩
  const confirmVerifyGrade = (grade: Grade) => {
    confirm({
      title: '确认验证成绩',
      icon: <ExclamationCircleOutlined />,
      content: `确定要将学生 ${selectedStudent?.name} 的 ${grade.courseName} 课程成绩标记为已验证吗？`,
      onOk() {
        // 设置表单值并保存
        form.setFieldsValue({
          score: grade.score,
          status: 'VERIFIED'
        });
        saveGrade(grade.id);
      }
    });
  };

  // 驳回成绩
  const confirmRejectGrade = (grade: Grade) => {
    confirm({
      title: '驳回成绩',
      icon: <ExclamationCircleOutlined />,
      content: `确定要驳回学生 ${selectedStudent?.name} 的 ${grade.courseName} 课程成绩吗？`,
      onOk() {
        // 设置表单值并保存
        form.setFieldsValue({
          score: grade.score,
          status: 'REJECTED'
        });
        saveGrade(grade.id);
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '学生',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Student) => (
        <div className="flex items-center">
          <Avatar 
            src={record.avatarUrl} 
            icon={!record.avatarUrl && <UserOutlined />} 
            className="mr-2"
            size="large"
          />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '选修课程数',
      dataIndex: 'courses',
      key: 'coursesCount',
      render: (courses: Course[]) => courses.length,
      sorter: (a: Student, b: Student) => a.courses.length - b.courses.length,
    },
    {
      title: '平均成绩',
      key: 'averageScore',
      render: (text: string, record: Student) => {
        const validGrades = record.grades.filter(g => g.score > 0);
        if (validGrades.length === 0) return '-';
        
        const avg = validGrades.reduce((sum, g) => sum + g.score, 0) / validGrades.length;
        
        let color = '';
        if (avg >= 90) color = 'green';
        else if (avg >= 80) color = 'blue';
        else if (avg >= 70) color = 'orange';
        else color = 'red';
        
        return <Tag color={color}>{avg.toFixed(1)}</Tag>;
      },
    },
    {
      title: '待验证成绩',
      key: 'pendingGrades',
      render: (text: string, record: Student) => {
        const pendingCount = record.grades.filter(g => g.status === 'PENDING').length;
        return pendingCount > 0 ? 
          <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} /> : 
          <Text type="secondary">无</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Student) => (
        <Space size="small">
          <Tooltip title="查看学生详情">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => showStudentDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 顶部卡片 */}
      <Card 
        className="mb-6 shadow-md overflow-hidden rounded-lg"
        bodyStyle={{ padding: 0 }}
      >
        {/* 渐变背景标题 */}
        <div 
          className="py-8 px-6 text-white relative"
          style={{ 
            background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
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
            <TeamOutlined style={{ fontSize: 80 }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <TeamOutlined className="text-2xl mr-3" />
              <Title level={2} style={{ color: 'white', margin: 0 }}>我的学生管理</Title>
            </div>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: '800px', marginBottom: 0 }}>
              查看和管理您课程的学生信息，包括学生档案、成绩记录和验证状态。
            </Paragraph>
          </div>
        </div>
        
        {/* 统计信息和筛选工具 */}
        <div className="p-6">
          <Row gutter={24} className="mb-6">
            <Col xs={24} sm={8}>
              <Card className="h-full shadow-sm border border-gray-100">
                <Statistic 
                  title={<div className="flex items-center"><TeamOutlined className="mr-2 text-purple-500" /> 学生总数</div>}
                  value={students.length}
                  prefix={<UserOutlined />}
                />
                <div className="mt-2">
                  <Text type="secondary">
                    来自 {teacherCourses.length} 门课程
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} className="mt-4 sm:mt-0">
              <Card className="h-full shadow-sm border border-gray-100">
                <Statistic 
                  title={<div className="flex items-center"><BookOutlined className="mr-2 text-blue-500" /> 课程数量</div>}
                  value={teacherCourses.length}
                  prefix={<BookOutlined />}
                />
                <div className="mt-2">
                  <Text type="secondary">
                    {teacherCourses.map(c => c.code).join(', ')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8} className="mt-4 sm:mt-0">
              <Card className="h-full shadow-sm border border-gray-100">
                <Statistic 
                  title={<div className="flex items-center"><FileTextOutlined className="mr-2 text-orange-500" /> 待验证成绩</div>}
                  value={students.reduce((count, student) => 
                    count + student.grades.filter(g => g.status === 'PENDING').length, 0
                  )}
                  prefix={<FileTextOutlined />}
                />
                <div className="mt-2">
                  <Text type="secondary">
                    需要您审核的成绩记录
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
          
          {/* 筛选工具 */}
          <div className="flex flex-wrap justify-between items-center mb-4">
            <div className="flex items-center mb-3 md:mb-0">
              <FilterOutlined className="text-purple-500 mr-2" />
              <Text strong className="text-lg">筛选学生</Text>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="搜索学生姓名或邮箱"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220 }}
                className="mb-2 sm:mb-0"
                allowClear
              />
              
              <Select
                placeholder="选择课程筛选"
                style={{ width: 220 }}
                value={selectedCourseId}
                onChange={setSelectedCourseId}
                className="mb-2 sm:mb-0"
                allowClear
              >
                {teacherCourses.map(course => (
                  <Option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </Option>
                ))}
              </Select>
              
              <Tooltip title="刷新学生数据">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => fetchTeacherStudents()}
                  loading={loading}
                >
                  刷新
                </Button>
              </Tooltip>
            </div>
          </div>
          
          {/* 筛选结果提示 */}
          {(searchText || selectedCourseId) && (
            <div className="mb-4">
              <Badge status="processing" color="#722ed1" />
              <Text type="secondary" className="ml-2">
                当前筛选: 
                {searchText && ` 搜索"${searchText}"`}
                {selectedCourseId && ` 课程"${teacherCourses.find(c => c.id === selectedCourseId)?.name}"`}
                {`, 共找到 ${filteredStudents.length} 名学生`}
              </Text>
            </div>
          )}
        </div>
      </Card>
      
      {/* 学生表格 */}
      <Card className="shadow-sm rounded-lg">
        {loading ? (
          <div className="text-center py-10">
            <Spin size="large" tip="加载学生数据中..." />
          </div>
        ) : filteredStudents.length > 0 ? (
          <Table 
            dataSource={filteredStudents}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 名学生`
            }}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} className="mt-4 text-gray-500">
                  没有找到学生
                </Title>
                <Text type="secondary" className="block mb-4">
                  {searchText || selectedCourseId ? 
                    "没有符合筛选条件的学生，请尝试修改筛选条件。" : 
                    "您暂时没有任何学生，请确认您已被分配教学课程。"
                  }
                </Text>
              </div>
            }
          />
        )}
      </Card>
      
      {/* 学生详情抽屉 */}
      <Drawer
        title={
          <div className="flex items-center">
            <Avatar 
              src={selectedStudent?.avatarUrl} 
              icon={!selectedStudent?.avatarUrl && <UserOutlined />} 
              className="mr-2"
              size="large"
            />
            <span>{selectedStudent?.name} 的详细信息</span>
          </div>
        }
        width={640}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedStudent && (
          <Tabs defaultActiveKey="profile">
            <TabPane 
              tab={<span><UserOutlined />基本信息</span>}
              key="profile"
            >
              <div className="mb-6">
                <Card className="shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
                    <Avatar 
                      src={selectedStudent.avatarUrl} 
                      icon={!selectedStudent.avatarUrl && <UserOutlined />}
                      size={64}
                      className="mb-4 sm:mb-0 sm:mr-4"
                    />
                    <div>
                      <Title level={4} style={{ marginBottom: 4, marginTop: 0 }}>{selectedStudent.name}</Title>
                      <div className="flex items-center text-gray-500">
                        <MailOutlined className="mr-1" />
                        <Text>{selectedStudent.email}</Text>
                      </div>
                      <div className="flex items-center mt-1 text-gray-500">
                        <CalendarOutlined className="mr-1" />
                        <Text>注册时间: {new Date(selectedStudent.createdAt).toLocaleDateString()}</Text>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Title level={5} className="mb-3">选修课程</Title>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.courses.map(course => (
                        <Tag 
                          key={course.id} 
                          color="blue" 
                          className="mb-2 py-1 px-2"
                          icon={<BookOutlined className="mr-1" />}
                        >
                          {course.code} - {course.name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </TabPane>
            
            <TabPane 
              tab={<span><FileTextOutlined />成绩记录</span>}
              key="grades"
            >
              <Card className="shadow-sm">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <Title level={5} style={{ margin: 0 }}>成绩记录</Title>
                    {selectedStudent.grades.length > 0 && (
                      <div>
                        <Tag className="mr-1" color="green">
                          平均分: {(selectedStudent.grades.reduce((sum, g) => sum + g.score, 0) / selectedStudent.grades.length).toFixed(1)}
                        </Tag>
                        <Tag className="mr-1" color="orange">
                          待验证: {selectedStudent.grades.filter(g => g.status === 'PENDING').length}
                        </Tag>
                      </div>
                    )}
                  </div>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  {selectedStudent.grades.length > 0 ? (
                    <div>
                      {selectedStudent.grades.map(grade => (
                        <div 
                          key={grade.id}
                          className="p-4 mb-3 border rounded-lg bg-gray-50 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between flex-wrap">
                            <div className="mb-2">
                              <div className="flex items-center">
                                <BookOutlined className="text-blue-500 mr-2" />
                                <Text strong>{grade.courseName}</Text>
                              </div>
                              <div className="mt-1 ml-6">
                                <Text type="secondary">
                                  最后更新: {new Date(grade.updatedAt).toLocaleString()}
                                </Text>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              {editingGrade === grade.id ? (
                                <Form
                                  form={form}
                                  layout="inline"
                                >
                                  <Form.Item
                                    name="score"
                                    rules={[
                                      { required: true, message: '请输入成绩' },
                                      { type: 'number', min: 0, max: 100, message: '成绩应在0-100之间' }
                                    ]}
                                  >
                                    <InputNumber 
                                      placeholder="成绩" 
                                      precision={1}
                                      min={0}
                                      max={100}
                                      style={{ width: 100 }}
                                    />
                                  </Form.Item>
                                  
                                  <Form.Item
                                    name="status"
                                    rules={[{ required: true, message: '请选择状态' }]}
                                  >
                                    <Select style={{ width: 100 }}>
                                      <Option value="PENDING">待验证</Option>
                                      <Option value="VERIFIED">已验证</Option>
                                      <Option value="REJECTED">已拒绝</Option>
                                    </Select>
                                  </Form.Item>
                                  
                                  <Form.Item>
                                    <Space>
                                      <Button 
                                        type="primary" 
                                        onClick={() => saveGrade(grade.id)}
                                        size="small"
                                      >
                                        保存
                                      </Button>
                                      <Button 
                                        onClick={cancelEdit}
                                        size="small"
                                      >
                                        取消
                                      </Button>
                                    </Space>
                                  </Form.Item>
                                </Form>
                              ) : (
                                <>
                                  <div className="flex items-center mr-3">
                                    <TrophyOutlined className="text-orange-500 mr-1" />
                                    <Text strong>{grade.score}</Text>
                                    <Text className="ml-1">分</Text>
                                  </div>
                                  
                                  <Tag 
                                    color={statusMap[grade.status]?.color || 'default'}
                                    className="mr-3"
                                  >
                                    {statusMap[grade.status]?.text || grade.status}
                                  </Tag>
                                  
                                  <Space size="small">
                                    <Tooltip title="编辑成绩">
                                      <Button 
                                        type="text" 
                                        icon={<EditOutlined />} 
                                        onClick={() => startEditGrade(grade.id)}
                                        size="small"
                                      />
                                    </Tooltip>
                                    
                                    {grade.status === 'PENDING' && (
                                      <>
                                        <Tooltip title="验证通过">
                                          <Button 
                                            type="text" 
                                            icon={<CheckCircleOutlined className="text-green-500" />} 
                                            onClick={() => confirmVerifyGrade(grade)}
                                            size="small"
                                          />
                                        </Tooltip>
                                        
                                        <Tooltip title="驳回成绩">
                                          <Button 
                                            type="text" 
                                            icon={<CloseCircleOutlined className="text-red-500" />} 
                                            onClick={() => confirmRejectGrade(grade)}
                                            size="small"
                                          />
                                        </Tooltip>
                                      </>
                                    )}
                                  </Space>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty 
                      description="该学生暂无成绩记录" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )}
                </div>
              </Card>
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
} 