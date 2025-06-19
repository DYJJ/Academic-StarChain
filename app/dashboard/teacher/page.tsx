"use client";

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Tag,
  Space,
  Pagination,
  Row,
  Col,
  Result,
  Spin,
  Typography,
  Statistic,
  Divider,
  Avatar,
  Badge,
  Button,
  Select,
  Tooltip,
  Empty,
  Rate,
  Modal,
  Form,
  Input,
  message,
  Progress
} from 'antd';
import { 
  UserOutlined, 
  StarOutlined, 
  ArrowLeftOutlined, 
  LikeOutlined, 
  DislikeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  MailOutlined,
  HeartTwoTone,
  HeartOutlined,
  TrophyOutlined,
  RiseOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import WeatherWidget from '../../components/WeatherWidget';
import { motion } from 'framer-motion';
import styles from './TeachersPage.module.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Meta } = Card;

// 定义教师类型接口
interface Teacher {
  id: string;
  name: string;
  email: string;
  teachergrade: number;
  comment: string;
  like: number;
  avatarUrl?: string;
  comprehensiveScore?: number;
}

// 定义 5 个等级的描述和颜色
const commentLevels = [
  { value: "优秀：教学方法独特，成果显著", level: 5, color: '#52c41a', gradient: 'linear-gradient(135deg, #b7eb8f, #52c41a)' },
  { value: "良好：教学认真负责，表现出色", level: 4, color: '#1677ff', gradient: 'linear-gradient(135deg, #91caff, #1677ff)' },
  { value: "中等：教学水平一般，有待提高", level: 3, color: '#faad14', gradient: 'linear-gradient(135deg, #ffe58f, #faad14)' },
  { value: "及格：基本完成教学任务，需加强", level: 2, color: '#ff7a45', gradient: 'linear-gradient(135deg, #ffbb96, #ff7a45)' },
  { value: "不及格：教学存在较大问题，需改进", level: 1, color: '#ff4d4f', gradient: 'linear-gradient(135deg, #ff9b9b, #ff4d4f)' }
];

// 动画配置
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// 卡片动画配置
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: "spring",
      stiffness: 100
    }
  })
};

// 顶部统计卡片动画
const statCardVariants = {
  hover: {
    y: -8,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
    transition: {
      duration: 0.3
    }
  }
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likes, setLikes] = useState<Record<string, {isLiked: boolean, count: number}>>({});
  const [filter, setFilter] = useState('all');
  
  // 评价教师相关状态
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [ratingForm] = Form.useForm();
  const [submittingRating, setSubmittingRating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 根据评分获取对应的等级对象
  const getCommentLevel = (teacher: Teacher) => {
    // 根据教师的评分来确定颜色
    const score = teacher.teachergrade;
    if (score >= 9) return commentLevels[0]; // 优秀
    if (score >= 8) return commentLevels[1]; // 良好
    if (score >= 7) return commentLevels[2]; // 中等
    if (score >= 6) return commentLevels[3]; // 及格
    return commentLevels[4]; // 不及格
  };

  // 筛选后的教师数据
  const filteredTeachers = filter === 'all' 
    ? teachers 
    : teachers.filter((teacher: Teacher) => getCommentLevel(teacher).level >= parseInt(filter));

  // 按综合评价排序教师（同时考虑评分和点赞数）
  const sortedTeachersData = [...filteredTeachers].sort((a: Teacher, b: Teacher) => {
    // 评分的权重为0.7，点赞数的权重为0.3
    const scoreA = a.teachergrade * 0.7 + a.like * 0.3;
    const scoreB = b.teachergrade * 0.7 + b.like * 0.3;
    return scoreB - scoreA; // 降序排列
  });

  useEffect(() => {
    fetchTeachers();
  }, [currentPage]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // 添加时间戳参数，确保不使用缓存数据
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/teachers?page=${currentPage}&sortField=comprehensive&t=${timestamp}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 计算每位教师的综合评分
      const teachersWithScore = data.teachers.map((teacher: Teacher) => ({
        ...teacher,
        comprehensiveScore: Number((teacher.teachergrade * 0.7 + teacher.like * 0.3).toFixed(1))
      }));
      
      setTeachers(teachersWithScore);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalCount(data.totalCount);
      setError('');
      // 初始化点赞状态
      const initialLikes: Record<string, {isLiked: boolean, count: number}> = {};
      data.teachers.forEach((teacher: Teacher) => {
        initialLikes[teacher.id] = { isLiked: false, count: teacher.like };
      });
      setLikes(initialLikes);
    } catch (error: any) {
      setError(error.message || '加载教师列表失败');
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1); // 重置页码
  };

  // 点赞逻辑
  const handleLike = async (teacherId: string) => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: teacherId,
          action: 'like'
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLikes(prevLikes => ({
        ...prevLikes,
        [teacherId]: {
          isLiked: true,
          count: data.teacher.like
        }
      }));
    } catch (error: any) {
      console.error('Error liking teacher:', error);
      alert(error.message || '点赞失败，请重试');
    }
  };

  // 取消点赞逻辑
  const handleUnlike = async (teacherId: string) => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: teacherId,
          action: 'unlike'
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLikes(prevLikes => ({
        ...prevLikes,
        [teacherId]: {
          isLiked: false,
          count: data.teacher.like
        }
      }));
    } catch (error: any) {
      console.error('Error unliking teacher:', error);
      alert(error.message || '取消点赞失败，请重试');
    }
  };

  // 打开评价教师模态框
  const openRatingModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsRatingModalVisible(true);
    // 设置表单默认值，只设置评分
    ratingForm.setFieldsValue({
      teachergrade: teacher.teachergrade / 2, // 转换为5分制
    });
  };
  
  // 关闭评价教师模态框
  const closeRatingModal = () => {
    setIsRatingModalVisible(false);
    setSelectedTeacher(null);
    ratingForm.resetFields();
  };
  
  // 提交教师评价
  const handleRatingSubmit = async (values: any) => {
    if (!selectedTeacher) return;
    
    try {
      setSubmittingRating(true);
      
      // 转换评分为10分制
      const teachergrade = Math.round(values.teachergrade * 2);
      
      // 先更新评分
      const gradeResponse = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedTeacher.id,
          action: 'grade',
          teachergrade
        })
      });
      
      if (!gradeResponse.ok) {
        throw new Error('更新评分失败');
      }
      
      const gradeData = await gradeResponse.json();
      
      // 再更新评论
      const commentResponse = await fetch('/api/teachers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedTeacher.id,
          action: 'comment',
          comment: values.comment
        })
      });
      
      if (!commentResponse.ok) {
        throw new Error('更新评论失败');
      }
      
      const commentData = await commentResponse.json();
      
      // 更新成功，关闭模态框并刷新教师列表
      message.success('评价提交成功');
      closeRatingModal();
      
      // 立即更新本地教师数据，不等待整个列表刷新
      setTeachers(prevTeachers => 
        prevTeachers.map(teacher => 
          teacher.id === selectedTeacher.id ? 
          {
            ...teacher,
            teachergrade,
            comment: values.comment,
            comprehensiveScore: commentData.teacher.comprehensiveScore || 
                              Number((teachergrade * 0.7 + teacher.like * 0.3).toFixed(1))
          } : 
          teacher
        )
      );
      
      // 然后再强制从服务器刷新全部数据
      setTimeout(() => {
        fetchTeachers();
      }, 500);
      
    } catch (error: any) {
      console.error('提交评价失败:', error);
      message.error(error.message || '提交评价失败，请重试');
    } finally {
      setSubmittingRating(false);
    }
  };

  // 获取当前用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // 获取前三名教师
  const topThreeTeachers = sortedTeachersData.slice(0, 3);

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f7ff 0%, #f5f5f5 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <Navbar />
      <Content style={{ padding: '24px', margin: '0 auto', maxWidth: '1200px' }}>
        {/* 页面标题和返回按钮 */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className={styles.pageHeader}
          style={{ 
            marginBottom: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '16px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/dashboard" className={styles.backLink}>
              <Button icon={<ArrowLeftOutlined />} type="text" size="large">
                返回仪表盘
              </Button>
            </Link>
            <div>
              <Title level={2} style={{ margin: '0', color: '#1f2937', fontWeight: 700 }}>教师评价与点赞</Title>
              <Text type="secondary" style={{ display: 'flex', alignItems: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: '8px' }} />
                教师按综合评分排序（教学评分×70% + 点赞数×30%）
              </Text>
            </div>
          </div>
          
          {/* 搜索和筛选区域 */}
          <div>
            <Select
              value={filter}
              onChange={handleFilterChange}
              style={{ width: 200 }}
              bordered={true}
              suffixIcon={<FilterOutlined />}
              dropdownStyle={{ borderRadius: '8px' }}
              className={styles.selectFilter}
            >
              <Option value="all">全部教师</Option>
              <Option value="4">4分及以上</Option>
              <Option value="3">3分及以上</Option>
              <Option value="2">2分及以上</Option>
            </Select>
            <Tooltip title="根据教师评分进行筛选">
              <InfoCircleOutlined style={{ color: '#8c8c8c', marginLeft: 8 }} />
            </Tooltip>
          </div>
        </motion.div>

        {/* 统计卡片区域 */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Row gutter={24} style={{ marginBottom: '24px' }}>
            <Col span={8}>
              <motion.div whileHover="hover" variants={statCardVariants}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(120deg, #ffffff, #f9fdff)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic
                    title={<Text strong style={{fontSize: '16px', color: '#1677ff'}}>教师总数</Text>}
                    value={totalCount}
                    precision={0}
                    valueStyle={{
                      color: '#1677ff',
                      fontSize: '28px',
                      fontWeight: '700'
                    }}
                    prefix={
                      <div style={{
                        background: 'rgba(22, 119, 255, 0.1)',
                        borderRadius: '50%',
                        padding: '12px',
                        marginRight: '12px'
                      }}>
                        <UserOutlined style={{ fontSize: '24px', color: '#1677ff' }} />
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div whileHover="hover" variants={statCardVariants}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(120deg, #ffffff, #f5fff5)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic
                    title={<Text strong style={{fontSize: '16px', color: '#52c41a'}}>当前页</Text>}
                    value={currentPage}
                    precision={0}
                    valueStyle={{
                      color: '#52c41a',
                      fontSize: '28px',
                      fontWeight: '700'
                    }}
                    prefix={
                      <div style={{
                        background: 'rgba(82, 196, 26, 0.1)',
                        borderRadius: '50%',
                        padding: '12px',
                        marginRight: '12px'
                      }}>
                        <RiseOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
            <Col span={8}>
              <motion.div whileHover="hover" variants={statCardVariants}>
                <Card
                  bordered={false}
                  hoverable
                  style={{
                    background: 'linear-gradient(120deg, #ffffff, #fffbf0)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Statistic
                    title={<Text strong style={{fontSize: '16px', color: '#faad14'}}>筛选结果</Text>}
                    value={filteredTeachers.length}
                    precision={0}
                    valueStyle={{
                      color: '#faad14',
                      fontSize: '28px',
                      fontWeight: '700'
                    }}
                    prefix={
                      <div style={{
                        background: 'rgba(250, 173, 20, 0.1)',
                        borderRadius: '50%',
                        padding: '12px',
                        marginRight: '12px'
                      }}>
                        <FilterOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>

        {/* 前三名教师卡片区域 */}
        {topThreeTeachers.length > 0 && (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
            style={{ marginBottom: '24px' }}
          >
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>教师榜单 TOP 3</span>
                </div>
              }
              bordered={false}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Row gutter={[16, 16]}>
                {topThreeTeachers.map((teacher, index) => {
                  const commentLevel = getCommentLevel(teacher);
                  return (
                    <Col span={8} key={teacher.id}>
                      <Card
                        bordered={false}
                        style={{ 
                          background: 'white',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ position: 'relative' }}>
                            <Avatar
                              size={64}
                              icon={<UserOutlined />}
                              src={teacher.avatarUrl}
                              style={{
                                backgroundColor: teacher.avatarUrl ? 'transparent' : '#1677ff',
                                border: `3px solid ${commentLevel.color}`
                              }}
                            />
                            <Badge 
                              count={index + 1} 
                              style={{ 
                                backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                                position: 'absolute',
                                bottom: -5,
                                right: -5,
                                boxShadow: '0 0 0 2px #fff'
                              }} 
                            />
                          </div>
                          <div>
                            <Text strong style={{ fontSize: '16px', display: 'block' }}>{teacher.name}</Text>
                            <Rate disabled value={Math.round(teacher.teachergrade / 2)} style={{ fontSize: '14px' }} />
                            <div style={{ marginTop: '4px' }}>
                              <Tag color={commentLevel.color}>
                                综合评分: {teacher.comprehensiveScore || 0}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </motion.div>
        )}

        {/* 教师列表卡片区域 */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: '600' }}>教师评价排行榜</span>
                <Badge count={filteredTeachers.length} 
                  style={{ backgroundColor: '#1677ff' }} 
                  title={`共${filteredTeachers.length}位教师`}
                />
              </div>
            }
            bordered={false}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              marginBottom: '24px'
            }}
          >
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', color: '#666' }}>正在加载教师数据...</p>
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
            ) : sortedTeachersData.length === 0 ? (
              <Empty
                description={
                  <span>
                    没有找到符合条件的教师
                    <Button style={{ marginLeft: 8 }} onClick={() => setFilter('all')}>
                      重置筛选
                    </Button>
                  </span>
                }
              />
            ) : (
              <>
                <Row gutter={[24, 24]}>
                  {sortedTeachersData.map((teacher: Teacher, index: number) => {
                    const { isLiked, count } = likes[teacher.id] || { isLiked: false, count: teacher.like || 0 };
                    const commentLevel = getCommentLevel(teacher);
                    
                    return (
                      <Col xs={24} sm={12} md={8} key={teacher.id}>
                        <motion.div
                          custom={index}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                          <Card
                            hoverable
                            className={styles.teacherCard}
                            style={{ 
                              borderRadius: '16px',
                              overflow: 'hidden',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                              height: '100%',
                              border: 'none'
                            }}
                            cover={
                              <div style={{ 
                                background: commentLevel.gradient,
                                padding: '28px 0 24px', 
                                textAlign: 'center',
                                position: 'relative'
                              }}>
                                <Avatar
                                  size={90}
                                  icon={<UserOutlined />}
                                  src={teacher.avatarUrl}
                                  style={{
                                    backgroundColor: teacher.avatarUrl ? 'transparent' : '#1677ff',
                                    border: `4px solid white`,
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                                  }}
                                />
                                <div style={{ marginTop: '16px' }}>
                                  <Rate disabled defaultValue={Math.round(teacher.teachergrade / 2)} />
                                </div>
                                <div style={{ 
                                  position: 'absolute', 
                                  top: '12px', 
                                  right: '12px',
                                  background: 'rgba(255,255,255,0.8)',
                                  borderRadius: '12px',
                                  padding: '3px 10px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: commentLevel.color
                                }}>
                                  {teacher.teachergrade}分
                                </div>
                              </div>
                            }
                            actions={[
                              <Tooltip title={teacher.email}>
                                <Button type="text" icon={<MailOutlined />} />
                              </Tooltip>,
                              <div>
                                <Button
                                  type="text"
                                  icon={isLiked ? <HeartTwoTone twoToneColor="#eb2f96" /> : <HeartOutlined />}
                                  onClick={() => isLiked ? handleUnlike(teacher.id) : handleLike(teacher.id)}
                                />
                                <span>{count}</span>
                              </div>,
                              // 只有学生才能评价
                              currentUser?.role === 'STUDENT' && (
                                <Tooltip title="评价教师">
                                  <Button 
                                    type="text" 
                                    icon={<StarOutlined />}
                                    onClick={() => openRatingModal(teacher)}
                                  />
                                </Tooltip>
                              )
                            ].filter(Boolean)}
                          >
                            <Meta
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <Text strong style={{ fontSize: '18px' }}>{teacher.name}</Text>
                                </div>
                              }
                              description={
                                <div>
                                  <Divider style={{ margin: '12px 0' }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <Tooltip title="综合评分 = 教学评分×70% + 点赞数×30%">
                                      <Tag color="purple" style={{ padding: '4px 10px', borderRadius: '20px' }}>
                                        综合评分: {teacher.comprehensiveScore || 0}
                                      </Tag>
                                    </Tooltip>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                      <LikeOutlined style={{ marginRight: '4px' }} />{count}
                                    </Text>
                                  </div>
                                  <Tooltip title={teacher.comment}>
                                    <div
                                      style={{
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        width: '100%',
                                        textAlign: 'left',
                                        whiteSpace: 'normal',
                                        height: 'auto',
                                        backgroundColor: '#f9f9f9',
                                        border: `1px solid ${commentLevel.color}33`,
                                        color: '#333',
                                        maxHeight: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                      }}
                                    >
                                      {teacher.comment || '暂无评价'}
                                    </div>
                                  </Tooltip>
                                </div>
                              }
                            />
                          </Card>
                        </motion.div>
                      </Col>
                    );
                  })}
                </Row>
                
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    current={currentPage}
                    total={totalCount}
                    pageSize={9}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    style={{ 
                      background: 'white', 
                      padding: '14px 28px', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}
                  />
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* 教师分布统计卡片 */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RiseOutlined style={{ color: '#1677ff' }} />
                <span>教师评分分布</span>
              </div>
            }
            bordered={false}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
              {commentLevels.map((level, index) => {
                const count = teachers.filter((t: Teacher) => getCommentLevel(t).level === level.level).length;
                const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} style={{ textAlign: 'center', padding: '16px' }}>
                    <Progress 
                      type="circle" 
                      percent={Number(percentage)} 
                      format={() => `${percentage}%`}
                      strokeColor={level.color}
                      strokeWidth={10}
                      width={80}
                      style={{ marginBottom: '16px' }}
                    />
                    <Tag color={level.color} style={{ marginBottom: '8px', padding: '4px 12px', borderRadius: '20px' }}>
                      {level.level}分 ({count}人)
                    </Tag>
                    <p style={{ fontSize: '14px', color: '#666' }}>{level.value}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </Content>

      {/* 添加天气小组件 */}
      <WeatherWidget />
      
      {/* 评价教师模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>{selectedTeacher ? `评价教师: ${selectedTeacher.name}` : "评价教师"}</span>
          </div>
        }
        open={isRatingModalVisible}
        onCancel={closeRatingModal}
        footer={null}
        destroyOnClose
        width={500}
        style={{ borderRadius: '16px', overflow: 'hidden' }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={ratingForm}
          layout="vertical"
          onFinish={handleRatingSubmit}
        >
          <Form.Item
            name="teachergrade"
            label={<Text strong>教学评分</Text>}
            rules={[{ required: true, message: '请给教师评分' }]}
          >
            <Rate 
              allowHalf 
              style={{ fontSize: '28px' }}
            />
          </Form.Item>
          
          <Form.Item
            name="comment"
            label={<Text strong>评价内容</Text>}
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入您对该教师的评价内容..." 
              maxLength={200}
              showCount
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeRatingModal} size="large">取消</Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={submittingRating}
                size="large"
                style={{ borderRadius: '8px' }}
              >
                提交评价
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}  