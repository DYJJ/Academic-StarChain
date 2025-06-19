"use client";

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Table,
  Tag,
  Button,
  Space,
  Pagination,
  Card,
  Badge,
  Select,
  Row,
  Col,
  Result,
  Spin,
  Typography,
  Tooltip,
  InputNumber,
  message,
  Statistic
} from 'antd';
import { UserOutlined, EditOutlined, StarOutlined, FilterOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import ChatWidget from '../../components/ChatWidget';
import WeatherWidget from '../../components/WeatherWidget';
import { Avatar } from 'antd';

// 解构Layout和Typography的子组件
const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select; // 添加Option组件的解构

// 定义教师类型
interface Teacher {
  id: string;
  name: string;
  email: string;
  teachergrade: number;
  comment: string;
  like: number;
}

// 定义用户类型
interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

// 定义评分等级
const ratingLevels = [
  { value: "all", label: "全部评分", min: 1, max: 10 },
  { value: "excellent", label: "优秀 (8-10分)", min: 8, max: 10, color: '#52c41a' },
  { value: "good", label: "良好 (4-7分)", min: 4, max: 7, color: '#1677ff' },
  { value: "poor", label: "差 (1-3分)", min: 1, max: 3, color: '#ff4d4f' }
];

// 定义 5 个等级的描述和颜色
const commentLevels = [
  { value: "优秀：教学方法独特，成果显著", level: 5, color: '#52c41a' },
  { value: "良好：教学认真负责，表现出色", level: 4, color: '#1677ff' },
  { value: "中等：教学水平一般，有待提高", level: 3, color: '#faad14' },
  { value: "及格：基本完成教学任务，需加强", level: 2, color: '#ff7a45' },
  { value: "不及格：教学存在较大问题，需改进", level: 1, color: '#ff4d4f' }
];

// 辅助函数 - 确保在组件外部定义
const getRatingLevel = (grade: number) => {
  return ratingLevels.find(level => grade >= level.min && grade <= level.max) || ratingLevels[0];
};

const getCommentLevel = (comment: string) => {
  return commentLevels.find(level => level.value === comment) || commentLevels[2];
};

// 自定义渲染函数 - 确保在组件外部定义
const renderGrade = (grade: number) => {
  const ratingLevel = getRatingLevel(grade);
  return (
    <Space>
      <StarOutlined style={{ color: ratingLevel.color || '#faad14' }} />
      <span style={{ color: ratingLevel.color || '#faad14' }}>{grade}</span>
    </Space>
  );
};

const renderComment = (comment: string, teacherId: string, editingComments: Record<string, boolean>, tempComments: Record<string, string>, handleCommentChange: (teacherId: string, value: string) => void, handleUpdateComment: (teacherId: string) => void, handleCancelEdit: (teacherId: string) => void, handleEditComment: (teacherId: string) => void) => {
  const isEditing = editingComments[teacherId];
  const level = getCommentLevel(comment);
  
  if (isEditing) {
    return (
      <Space>
        <Select
          value={tempComments[teacherId] || comment}
          style={{ width: 200 }}
          onChange={(value) => handleCommentChange(teacherId, value)}
        >
          {commentLevels.map((item) => (
            <Option key={item.value} value={item.value}>
              {item.value}
            </Option>
          ))}
        </Select>
        <Button type="primary" size="small" onClick={() => handleUpdateComment(teacherId)}>
          保存
        </Button>
        <Button size="small" onClick={() => handleCancelEdit(teacherId)}>
          取消
        </Button>
      </Space>
    );
  }
  
  return (
    <Space>
      <Tag color={level.color}>{comment}</Tag>
      <Button type="link" size="small" onClick={() => handleEditComment(teacherId)}>
        <EditOutlined /> 编辑
      </Button>
    </Space>
  );
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 评分筛选条件
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 用于存储每行评论的编辑状态
  const [editingComments, setEditingComments] = useState<Record<string, boolean>>({});
  const [tempComments, setTempComments] = useState<Record<string, string>>({});
  
  // 用于存储每行评分的编辑状态和临时值
  const [editingGrades, setEditingGrades] = useState<Record<string, boolean>>({});
  const [tempGrades, setTempGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTeachers();
    fetchCurrentUser();
  }, [currentPage]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teachers?page=${currentPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeachers(data.teachers);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalCount(data.totalCount);
      setError('');
    } catch (error: any) {
      setError(error.message || '加载教师列表失败');
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      // 从cookie中获取用户信息
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_session='));
      
      if (userCookie) {
        const userSession = decodeURIComponent(userCookie.split('=')[1]);
        setCurrentUser(JSON.parse(userSession));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  // 判断用户是否为学生
  const isStudent = (): boolean => {
    return currentUser?.role === 'STUDENT';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditComment = (teacherId: string) => {
    // 关闭评分编辑状态（如果有）
    setEditingGrades(prev => ({ ...prev, [teacherId]: false }));
    
    // 开启评论编辑状态，并保存当前评论作为临时值
    setEditingComments(prev => ({ ...prev, [teacherId]: true }));
    setTempComments(prev => ({ 
      ...prev, 
      [teacherId]: teachers.find(t => t.id === teacherId)?.comment || '' 
    }));
  };

  const handleCancelEdit = (teacherId: string) => {
    // 取消编辑，清除临时值
    setEditingComments(prev => ({ ...prev, [teacherId]: false }));
    setTempComments(prev => ({ ...prev, [teacherId]: '' }));
    setEditingGrades(prev => ({ ...prev, [teacherId]: false }));
  };

  const handleCommentChange = (teacherId: string, value: string) => {
    // 更新临时评论值
    setTempComments(prev => ({ ...prev, [teacherId]: value }));
  };

  const handleUpdateComment = async (teacherId: string) => {
    const comment = tempComments[teacherId];
    if (!comment) return;

    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: teacherId,
          comment,
          action: 'comment'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // 更新成功后，刷新教师列表并关闭编辑状态
      await fetchTeachers();
      setEditingComments(prev => ({ ...prev, [teacherId]: false }));
      setTempComments(prev => ({ ...prev, [teacherId]: '' }));
      message.success('评论更新成功');
    } catch (error: any) {
      console.error('Error updating teacher comment:', error);
      message.error(error.message || '更新评论失败，请重试');
    }
  };

  // 处理评分编辑
  const handleEditGrade = (teacherId: string, currentGrade: number) => {
    // 关闭评论编辑状态（如果有）
    setEditingComments(prev => ({ ...prev, [teacherId]: false }));
    setTempComments(prev => ({ ...prev, [teacherId]: '' }));
    
    // 开启评分编辑状态，并保存当前评分作为临时值
    setEditingGrades(prev => ({ ...prev, [teacherId]: true }));
    setTempGrades(prev => ({ ...prev, [teacherId]: currentGrade }));
  };

  // 处理评分修改
  const handleGradeChange = (teacherId: string, value: number | null) => {
    // 更新临时评分值
    if (value !== null) {
      setTempGrades(prev => ({ ...prev, [teacherId]: value }));
    }
  };

  // 提交评分修改
  const handleUpdateGrade = async (teacherId: string) => {
    const newGrade = tempGrades[teacherId];
    if (newGrade === undefined || newGrade < 1 || newGrade > 10) {
      message.error('无效评分，请输入1-10之间的数字');
      return;
    }

    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: teacherId,
          teachergrade: newGrade,
          action: 'grade'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // 更新成功后，刷新教师列表并关闭编辑状态
      await fetchTeachers();
      setEditingGrades(prev => ({ ...prev, [teacherId]: false }));
      message.success('评分更新成功');
    } catch (error: any) {
      console.error('Error updating teacher grade:', error);
      message.error(error.message || '更新评分失败，请重试');
    }
  };

  const handleRatingFilterChange = (value: string) => {
    setRatingFilter(value);
    setCurrentPage(1); // 重置页码
  };

  // 筛选教师
  const filteredTeachers = teachers.filter(teacher => {
    if (ratingFilter === 'all') return true;
    
    const level = ratingLevels.find(l => l.value === ratingFilter);
    return level ? teacher.teachergrade >= level.min && teacher.teachergrade <= level.max : true;
  });

  // 按评分排序教师
  const sortedTeachersData = [...filteredTeachers].sort((a, b) => b.teachergrade - a.teachergrade);

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Teacher) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '评分',
      dataIndex: 'teachergrade',
      key: 'teachergrade',
      render: (grade: number, record: Teacher) => {
        const isEditing = editingGrades[record.id];
        const currentGrade = tempGrades[record.id] !== undefined ? tempGrades[record.id] : grade;
        
        if (isEditing) {
          return (
            <Space>
              <InputNumber
                min={1}
                max={10}
                value={currentGrade}
                onChange={(value) => handleGradeChange(record.id, value)}
                style={{ width: 80 }}
              />
              <Button type="primary" size="small" onClick={() => handleUpdateGrade(record.id)}>
                <CheckOutlined />
              </Button>
              <Button size="small" onClick={() => handleCancelEdit(record.id)}>
                <CloseOutlined />
              </Button>
            </Space>
          );
        }
        
        return renderGrade(grade);
      }
    },
    {
      title: '评论',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment: string, record: Teacher) => renderComment(
        comment,
        record.id,
        editingComments,
        tempComments,
        handleCommentChange,
        handleUpdateComment,
        handleCancelEdit,
        handleEditComment
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Teacher) => {
        // 只在编辑评分时隐藏操作按钮
        if (editingGrades[record.id]) {
          return null;
        }
        
        // 只有学生可以编辑评分和评论
        if (!isStudent()) {
          return null;
        }
        
        return (
          <Space>
            <Tooltip title="修改评分">
              <Button 
                type="primary" 
                size="small" 
                onClick={() => handleEditGrade(record.id, record.teachergrade)}
              >
                修改评分
              </Button>
            </Tooltip>
            <Tooltip title="修改评论">
              <Button 
                type="default" 
                size="small" 
                onClick={() => handleEditComment(record.id)}
              >
                修改评论
              </Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>教师列表</Title>
            <BackButton />
          </div>

          {/* 筛选区域 */}
          <div style={{ marginBottom: 24, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 16, borderRadius: 8 }}>
            <Space>
              <span style={{ fontWeight: 'bold' }}>按评分筛选:</span>
              <Select
                value={ratingFilter}
                onChange={handleRatingFilterChange}
                style={{ width: 200 }}
                bordered={false}
                suffixIcon={<FilterOutlined />}
              >
                {ratingLevels.map(level => (
                  <Option key={level.value} value={level.value}>
                    {level.label}
                  </Option>
                ))}
              </Select>
              <span style={{ color: '#8c8c8c' }}>当前筛选结果: {filteredTeachers.length} 位教师</span>
            </Space>
          </div>

          {/* 统计卡片 */}
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: 8 }}>
                <Statistic
                  title="教师总数"
                  value={totalCount}
                  precision={0}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: 8 }}>
                <Statistic
                  title="当前页"
                  value={currentPage}
                  precision={0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<Badge.Ribbon text="显示" color="#52c41a" />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: 8 }}>
                <Statistic
                  title="筛选结果"
                  value={filteredTeachers.length}
                  precision={0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<Badge.Ribbon text="当前" color="#faad14" />}
                />
              </Card>
            </Col>
          </Row>

          {/* 教师列表表格 */}
          <Card 
            title="教师评分与评论管理"
            bordered={false}
            style={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <Spin size="large" />
              </div>
            ) : error ? (
              <Result
                status="error"
                title="加载失败"
                subTitle={error}
                extra={
                  <Button type="primary" onClick={fetchTeachers}>
                    重试
                  </Button>
                }
              />
            ) : filteredTeachers.length === 0 ? (
              <Result
                status="warning"
                title="没有找到符合条件的教师"
                extra={
                  <Button type="primary" onClick={() => setRatingFilter('all')}>
                    显示全部教师
                  </Button>
                }
              />
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={sortedTeachersData}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  bordered={false}
                  size="middle"
                  scroll={{ x: 'max-content' }}
                />
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    current={currentPage}
                    total={filteredTeachers.length}
                    pageSize={10}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '8px 16px', borderRadius: 8 }}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      </Content>

      {/* 添加天气小组件 */}
      <WeatherWidget />

      {/* 聊天小部件 */}
      <ChatWidget />
    </Layout>
  );
}