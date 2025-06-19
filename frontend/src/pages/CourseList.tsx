import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Input, Select, Modal, message, Tag, Space, Typography, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Course } from '../types/course';
import { getCourses, deleteCourse } from '../services/courseService';
import { getTeacherCourses } from '../services/teacherService';

const { Title, Text } = Typography;
const { Option } = Select;

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let courseData: Course[] = [];
      
      if (user?.role === 'teacher') {
        // 如果是教师角色，获取教师创建的课程
        courseData = await getTeacherCourses();
      } else {
        // 如果是学生角色，获取所有课程
        courseData = await getCourses();
      }
      
      setCourses(courseData);
    } catch (error) {
      console.error('获取课程列表失败:', error);
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleLevelChange = (value: string) => {
    setSelectedLevel(value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/courses/edit/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await deleteCourse(courseId);
      message.success('课程删除成功');
      fetchCourses();
    } catch (error) {
      console.error('删除课程失败:', error);
      message.error('删除课程失败');
    }
  };

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedCourse(null);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'blue';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>课程列表</Title>
        {user?.role === 'teacher' && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateCourse}
            style={{ 
              background: '#1890ff',
              borderColor: '#1890ff',
              boxShadow: '0 2px 0 rgba(24, 144, 255, 0.1)'
            }}
          >
            创建课程
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索课程"
              prefix={<SearchOutlined />}
              onChange={e => handleSearch(e.target.value)}
              style={{ borderRadius: '4px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              onChange={handleCategoryChange}
              defaultValue="all"
            >
              <Option value="all">全部分类</Option>
              <Option value="programming">编程</Option>
              <Option value="design">设计</Option>
              <Option value="business">商业</Option>
              <Option value="language">语言</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择难度"
              onChange={handleLevelChange}
              defaultValue="all"
            >
              <Option value="all">全部难度</Option>
              <Option value="beginner">初级</Option>
              <Option value="intermediate">中级</Option>
              <Option value="advanced">高级</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择状态"
              onChange={handleStatusChange}
              defaultValue="all"
            >
              <Option value="all">全部状态</Option>
              <Option value="active">进行中</Option>
              <Option value="pending">待开始</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <Empty 
          description="暂无课程" 
          style={{ 
            margin: '40px 0',
            padding: '40px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredCourses.map(course => (
            <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
              <Card
                hoverable
                style={{ 
                  height: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s'
                }}
                cover={
                  <div style={{ 
                    height: '160px', 
                    background: '#f0f2f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px 8px 0 0'
                  }}>
                    <img 
                      src={course.coverImage || 'https://via.placeholder.com/300x160'} 
                      alt={course.name}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0'
                      }}
                    />
                  </div>
                }
                actions={[
                  <Button 
                    type="text" 
                    icon={<EyeOutlined />} 
                    onClick={() => handleViewDetails(course)}
                  >
                    详情
                  </Button>,
                  ...(user?.role === 'teacher' ? [
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEditCourse(course.id)}
                    >
                      编辑
                    </Button>,
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      删除
                    </Button>
                  ] : [])
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '16px' }}>{course.name}</Text>
                    </div>
                  }
                  description={
                    <div>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary" ellipsis={{ rows: 2 }}>
                          {course.description}
                        </Text>
                        <Space size={8}>
                          <Tag color={getLevelColor(course.level)}>
                            {course.level === 'beginner' ? '初级' : 
                             course.level === 'intermediate' ? '中级' : '高级'}
                          </Tag>
                          <Tag color={getStatusColor(course.status)}>
                            {course.status === 'active' ? '进行中' : 
                             course.status === 'pending' ? '待开始' : '已完成'}
                          </Tag>
                        </Space>
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">
                            教师: {course.teacherName || '未知'}
                          </Text>
                        </div>
                      </Space>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="课程详情"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
      >
        {selectedCourse && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <img 
                src={selectedCourse.coverImage || 'https://via.placeholder.com/800x400'} 
                alt={selectedCourse.name}
                style={{ 
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            </div>
            <Title level={3}>{selectedCourse.name}</Title>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text strong>课程描述：</Text>
                <Text>{selectedCourse.description}</Text>
              </div>
              <div>
                <Text strong>课程分类：</Text>
                <Text>{selectedCourse.category}</Text>
              </div>
              <div>
                <Text strong>难度等级：</Text>
                <Tag color={getLevelColor(selectedCourse.level)}>
                  {selectedCourse.level === 'beginner' ? '初级' : 
                   selectedCourse.level === 'intermediate' ? '中级' : '高级'}
                </Tag>
              </div>
              <div>
                <Text strong>课程状态：</Text>
                <Tag color={getStatusColor(selectedCourse.status)}>
                  {selectedCourse.status === 'active' ? '进行中' : 
                   selectedCourse.status === 'pending' ? '待开始' : '已完成'}
                </Tag>
              </div>
              <div>
                <Text strong>教师：</Text>
                <Text>{selectedCourse.teacherName || '未知'}</Text>
              </div>
              {selectedCourse.syllabus && (
                <div>
                  <Text strong>课程大纲：</Text>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '4px'
                  }}>
                    <Text>{selectedCourse.syllabus}</Text>
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CourseList; 