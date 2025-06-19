'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout,
  Table,
  Button,
  Input,
  Select,
  Card,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  message,
  Spin,
  Statistic,
  Divider,
  Tabs,
  Empty,
  Avatar,
  List,
  Tooltip,
  Progress
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  SyncOutlined
} from '@ant-design/icons';
import BlockchainIcon from '../../components/icons/BlockchainIcon';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import AddGradeModal from './components/AddGradeModal';
import EditGradeModal from './components/EditGradeModal';
import GradeStatistics from './components/GradeStatistics';
import BlockchainActionButton from './components/BlockchainActionButton';
import { LogAction, logAction } from '../../utils/logger';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 定义用户类型
type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

// 定义课程类型
type Course = {
  id: string;
  code: string;
  name: string;
  credit: number;
  semester: string;
};

// 定义成绩类型
type Grade = {
  id: string;
  score: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    code: string;
    name: string;
    credit: number;
    semester: string;
  };
};

export default function GradesManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 自动刷新控制
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 添加成绩是否已上链的检查函数
  const [onChainGradeIds, setOnChainGradeIds] = useState<Set<string>>(new Set());

  // 加载成绩列表函数
  const loadGrades = async () => {
    try {
      console.log('重新加载成绩列表...');
      setLoading(true);
      const response = await fetch('/api/grades');
      if (!response.ok) {
        throw new Error(`获取成绩列表失败: ${response.status}`);
      }
      const data = await response.json();
      setGrades(data.grades || []);
      setLoading(false);
      console.log('成绩列表已更新');
    } catch (err: any) {
      console.error('加载成绩列表时出错:', err);
      setError(`加载成绩列表失败: ${err.message}`);
      setLoading(false);
    }
  };

  // 检查所有成绩是否已上链
  const checkOnChainStatus = async (gradesData: Grade[]) => {
    try {
      // 获取所有成绩ID
      const gradeIds = gradesData.map(g => g.id);

      // 查询已上链的成绩
      const response = await fetch('/api/grades/blockchain/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gradeIds }),
      });

      if (!response.ok) {
        console.warn('获取成绩上链状态失败');
        return;
      }

      const data = await response.json();
      
      // 确保返回的是字符串数组并创建新Set
      const onChainGradeIdsArray: string[] = [];
      
      if (Array.isArray(data.onChainGradeIds)) {
        data.onChainGradeIds.forEach((id: any) => {
          if (typeof id === 'string') {
            onChainGradeIdsArray.push(id);
          }
        });
      }
      
      setOnChainGradeIds(new Set<string>(onChainGradeIdsArray));
    } catch (error) {
      console.error('检查成绩上链状态出错:', error);
    }
  };

  // 在成绩加载后检查上链状态
  useEffect(() => {
    if (grades.length > 0) {
      checkOnChainStatus(grades);
    }
  }, [grades]);

  useEffect(() => {
    // 获取当前用户
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`获取用户信息失败: ${response.status}`);
        }
        const data = await response.json();
        setCurrentUser(data.user);
        return data.user;
      } catch (err: any) {
        console.error('获取用户信息时出错:', err);
        setError(`获取用户信息失败: ${err.message}`);
        return null;
      }
    }

    // 加载成绩列表
    async function loadGrades() {
      try {
        setLoading(true);
        const response = await fetch('/api/grades');
        if (!response.ok) {
          throw new Error(`获取成绩列表失败: ${response.status}`);
        }
        const data = await response.json();
        setGrades(data.grades || []);
        setLoading(false);
      } catch (err: any) {
        console.error('加载成绩列表时出错:', err);
        setError(`加载成绩列表失败: ${err.message}`);
        setLoading(false);
      }
    }

    // 加载课程列表（用于过滤）
    async function loadCourses() {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error(`获取课程列表失败: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err: any) {
        console.error('加载课程列表时出错:', err);
        // 课程加载失败不会显示错误，只是过滤选项会少
      }
    }

    // 加载学生列表（仅管理员和教师需要）
    async function loadStudents() {
      try {
        const user = await fetchCurrentUser();
        if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
          return;
        }

        const response = await fetch('/api/users?role=STUDENT');
        if (!response.ok) {
          throw new Error(`获取学生列表失败: ${response.status}`);
        }
        const data = await response.json();
        setStudents(data.users || []);
      } catch (err: any) {
        console.error('加载学生列表时出错:', err);
        // 学生加载失败不会显示错误，只是添加成绩选项会少
      }
    }

    // 初始化数据
    async function init() {
      await Promise.all([
        fetchCurrentUser(),
        loadGrades(),
        loadCourses(),
        loadStudents()
      ]);
    }

    init();
  }, [router]);

  // 过滤成绩
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      // 搜索词过滤（学生姓名、课程名称、课程代码）
      const searchMatch =
        searchTerm === '' ||
        (grade.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grade.course?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grade.course?.code || '').toLowerCase().includes(searchTerm.toLowerCase());

      // 课程过滤
      const courseMatch = selectedCourse === '' || grade.course?.id === selectedCourse;

      // 状态过滤
      const statusMatch = selectedStatus === '' || grade.status === selectedStatus;

      return searchMatch && courseMatch && statusMatch;
    });
  }, [grades, searchTerm, selectedCourse, selectedStatus, lastUpdated]);

  // 添加成绩
  const handleAddGrade = async (gradeData: { studentId: string; courseId: string; score: number }) => {
    try {
      setLoading(true);

      // 检查数据
      if (!gradeData.studentId || !gradeData.courseId || gradeData.score === undefined) {
        message.error('提交的数据不完整，请检查所有字段');
        setLoading(false);
        return;
      }

      // 确保数据格式正确
      const payload = {
        studentId: gradeData.studentId,
        courseId: gradeData.courseId,
        score: Number(gradeData.score) // 确保score是数字类型
      };

      console.log('发送添加成绩请求数据:', payload);

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // 获取响应并解析
      const responseText = await response.text();
      console.log('API响应文本:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('解析响应JSON失败:', e);
        throw new Error(`服务器响应格式错误: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `添加成绩失败: ${response.status}`);
      }

      setGrades(prevGrades => [...prevGrades, data.grade]);
      setIsAddModalOpen(false);
      message.success('成绩添加成功');
    } catch (err: any) {
      console.error('添加成绩时出错:', err);
      message.error(`添加成绩失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 编辑成绩
  const handleEditGrade = async (gradeData: { id: string; studentId?: string; courseId?: string; score: number; status?: string }) => {
    try {
      setLoading(true);
      console.log('发送编辑成绩请求数据:', gradeData);

      const response = await fetch('/api/grades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        // 获取响应并解析
        const responseText = await response.text();
        console.log('API响应文本:', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error('解析响应JSON失败:', e);
          throw new Error(`编辑成绩失败: ${response.status}`);
        }

        throw new Error(errorData.error || `编辑成绩失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('成绩编辑API响应:', data);

      // 检查API返回的数据结构
      if (data && data.grade && data.grade.id) {
        // 响应格式为 { grade: { ... } }
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.id === data.grade.id ? data.grade : grade
          )
        );
      } else if (data && data.message === '成绩修改成功' && data.grade) {
        // 响应格式为 { message: '...', grade: { ... } }
        // updatedGrade 直接作为 grade 字段返回
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.id === data.grade.id ? data.grade : grade
          )
        );
      } else {
        // 不进行任何状态更新，但显示成功信息
        console.warn('API返回的数据结构不符合预期:', data);
        // 重新加载成绩列表以确保数据最新
        await loadGrades();
      }

      setIsEditModalOpen(false);
      message.success(data.message || '成绩更新成功');
    } catch (err: any) {
      console.error('编辑成绩时出错:', err);
      message.error(`编辑成绩失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除成绩
  const handleDeleteGrade = async () => {
    if (!selectedGrade) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/grades?id=${selectedGrade.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`删除成绩失败: ${response.status}`);
      }

      setGrades(prevGrades =>
        prevGrades.filter(grade => grade.id !== selectedGrade.id)
      );
      setIsDeleteModalOpen(false);
      message.success('成绩删除成功');
    } catch (err: any) {
      console.error('删除成绩时出错:', err);
      message.error(`删除成绩失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 验证成绩
  const handleVerifyGrade = async (gradeId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      // 保存旧的状态，用于比较
      let oldStatus = 'PENDING';
      setGrades(prevGrades => {
        const gradeToUpdate = prevGrades.find(g => g.id === gradeId);
        if (gradeToUpdate) {
          oldStatus = gradeToUpdate.status;
        }
        
        // 立即更新UI状态，提供即时反馈
        return prevGrades.map(grade =>
          grade.id === gradeId ? { 
            ...grade, 
            status: status as 'PENDING' | 'VERIFIED' | 'REJECTED',
            updatedAt: new Date().toISOString() 
          } : grade
        );
      });
      
      message.loading(`正在${status === 'VERIFIED' ? '验证' : '拒绝'}成绩...`, 1);
      console.log(`尝试将成绩 ${gradeId} 的状态从 ${oldStatus} 更新为 ${status}`);
      
      setLoading(true);

      // 使用新的API路径确保一致性
      const response = await fetch(`/api/grades/${gradeId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        // 获取详细的错误信息
        const errorText = await response.text();
        console.error('验证成绩API错误响应:', errorText);
        
        // 还原状态更新（操作失败）
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.id === gradeId ? { 
              ...grade, 
              status: oldStatus as 'PENDING' | 'VERIFIED' | 'REJECTED'
            } : grade
          )
        );
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // 如果不是有效的JSON，使用原始文本
          throw new Error(`验证成绩失败 (${response.status}): ${errorText.substring(0, 100)}`);
        }
        throw new Error(errorData.error || `验证成绩失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('验证成绩API响应:', data);

      // 使用服务器返回的数据更新状态，确保数据完整性
      if (data && data.grade) {
        // 强制使用服务器返回的成绩数据
        console.log('服务器返回的成绩数据:', data.grade);
        setGrades(prevGrades =>
          prevGrades.map(grade =>
            grade.id === gradeId ? {
              ...grade,
              ...data.grade,
              status: data.grade.status as 'PENDING' | 'VERIFIED' | 'REJECTED',
              student: data.grade.student || grade.student,
              course: data.grade.course || grade.course,
              teacher: data.grade.teacher || grade.teacher
            } : grade
          )
        );
        
        // 强制界面刷新
        setLastUpdated(Date.now());
      } else {
        console.warn('API返回的数据不包含成绩信息:', data);
      }

      message.success(data?.message || `成绩${status === 'VERIFIED' ? '验证' : '拒绝'}成功`);
    } catch (err: any) {
      console.error('验证成绩时出错:', err);
      message.error(`验证成绩失败: ${err.message}`);
      // 出错时尝试重新加载成绩列表以保持数据一致性
      await loadGrades();
    } finally {
      setLoading(false);
    }
  };

  // 导出Excel成绩
  const exportExcelGrades = async () => {
    if (!currentUser) return;

    try {
      message.loading('正在导出Excel成绩数据...', 0);

      // 构建查询参数
      const params = new URLSearchParams();
      if (selectedCourse) {
        params.append('courseId', selectedCourse);
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0]);
        params.append('endDate', dateRange[1]);
      }

      console.log('导出Excel参数:', params.toString());

      // 调用API获取成绩数据
      const response = await fetch(`/api/grades/export/excel?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('导出Excel错误:', response.status, errorData);
        throw new Error(errorData.error || errorData.message || '导出Excel成绩失败');
      }

      // 获取Blob数据
      const blob = await response.blob();

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `成绩单-${new Date().toLocaleDateString()}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.destroy();
      message.success('Excel成绩数据已导出');

      // 记录客户端日志
      console.log('Excel成绩数据已导出');
    } catch (error) {
      message.destroy();
      message.error(error instanceof Error ? error.message : '导出Excel成绩失败，请稍后重试');
      console.error('导出Excel成绩失败:', error);
    }
  };

  // 生成基于姓名的默认头像URL
  const getDefaultAvatarUrl = (name: string = '用户') => {
    // 使用在线服务生成基于姓名的头像
    // 设置背景色为随机色，文字为白色，大小为200
    const encodedName = encodeURIComponent(name);
    const colors = ['1890ff', '52c41a', 'fa8c16', 'eb2f96', '722ed1', 'faad14', 'a0d911'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodedName}&background=${randomColor}&color=fff&size=256&bold=true`;
  };

  // 学生头像渲染函数
  const renderAvatar = (student: { name?: string; avatarUrl?: string } | undefined) => {
    if (!student) {
      return (
        <Avatar 
          size="large" 
          src={getDefaultAvatarUrl('用户')}
          style={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      );
    }
    
    const name = student.name || '用户';
    // 如果有avatarUrl则使用，否则生成默认头像
    const avatarUrl = student.avatarUrl || getDefaultAvatarUrl(name);
    
    return (
      <Avatar 
        size="large" 
        src={avatarUrl}
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {name.charAt(0)}
      </Avatar>
    );
  };

  // 列定义
  const getTableColumns = () => {
    return [
      {
        title: '学生',
        dataIndex: ['student', 'name'],
        key: 'studentName',
        render: (text: string, record: Grade) => (
          <Space>
            {renderAvatar(record.student)}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text strong style={{ fontSize: '14px' }}>{record.student?.name || '未知学生'}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>{record.student?.email || '无邮箱'}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: '课程',
        dataIndex: ['course', 'name'],
        key: 'courseName',
        render: (text: string, record: Grade) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '14px' }}>{record.course?.name || '未知课程'}</Text>
            <Tooltip title="课程代码">
              <Tag color="blue" style={{ marginTop: '4px' }}>{record.course?.code || '无代码'}</Tag>
            </Tooltip>
          </div>
        ),
      },
      {
        title: '成绩',
        dataIndex: 'score',
        key: 'score',
        render: (score: number) => (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: '16px' }}>{isNaN(score) ? '未设置' : score}</Text>
              <Tag color={
                isNaN(score) ? 'default' :
                score >= 90 ? '#52c41a' : 
                score >= 80 ? '#1890ff' : 
                score >= 70 ? '#faad14' : 
                score >= 60 ? '#fa8c16' : '#f5222d'
              }>
                {
                  isNaN(score) ? '无数据' :
                  score >= 90 ? '优秀' : 
                  score >= 80 ? '良好' : 
                  score >= 70 ? '中等' : 
                  score >= 60 ? '及格' : '不及格'
                }
              </Tag>
            </div>
            <Progress
              percent={isNaN(score) ? 0 : score}
              size="small"
              status={isNaN(score) ? 'exception' : score >= 60 ? 'success' : 'exception'}
              format={() => ''}
              strokeWidth={8}
              style={{ marginTop: '6px', borderRadius: '4px', overflow: 'hidden' }}
            />
          </Space>
        ),
      },
      {
        title: '区块链状态',
        key: 'blockchain',
        render: (_: any, record: Grade) => (
          <BlockchainActionButton
            gradeId={record.id}
            studentName={record.student?.name || '未知学生'}
            courseName={record.course?.name || '未知课程'}
            score={record.score}
          />
        )
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: Grade) => (
          <Space size="middle">
            {currentUser?.role !== 'STUDENT' && (
              <>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedGrade(record);
                    setIsEditModalOpen(true);
                  }}
                  shape="circle"
                  style={{ boxShadow: '0 2px 5px rgba(24, 144, 255, 0.2)' }}
                />
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setSelectedGrade(record);
                    setIsDeleteModalOpen(true);
                  }}
                  shape="circle"
                  style={{ boxShadow: '0 2px 5px rgba(245, 34, 45, 0.2)' }}
                />
              </>
            )}
            {currentUser?.role === 'TEACHER' && record.status === 'PENDING' && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ 
                    color: 'white',
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    boxShadow: '0 2px 5px rgba(82, 196, 26, 0.2)'
                  }}
                  shape="circle"
                  onClick={() => handleVerifyGrade(record.id, 'VERIFIED')}
                />
                <Button
                  type="primary"
                  danger
                  icon={<CloseCircleOutlined />}
                  shape="circle"
                  style={{ boxShadow: '0 2px 5px rgba(245, 34, 45, 0.2)' }}
                  onClick={() => handleVerifyGrade(record.id, 'REJECTED')}
                />
              </>
            )}
          </Space>
        )
      }
    ];
  };

  // 刷新成绩数据
  const refreshGrades = async () => {
    message.loading('正在刷新成绩数据...', 1);
    try {
      await loadGrades();
      setLastUpdated(Date.now());
      message.success('成绩数据已刷新');
    } catch (err) {
      message.error('刷新成绩数据失败');
      console.error('刷新成绩数据失败:', err);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
        <Card 
          style={{ 
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderRadius: '12px'
          }}
        >
          <Row gutter={[24, 24]} align="middle" justify="space-between">
            <Col>
              <Space align="center" size="large">
                <BackButton />
                <Title level={2} style={{ margin: 0, fontWeight: 600 }}>成绩管理</Title>
              </Space>
            </Col>
            <Col>
              <Space size="middle">
                <Button
                  icon={<SyncOutlined spin={loading} />}
                  onClick={refreshGrades}
                  style={{
                    borderRadius: '8px',
                    height: '42px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  刷新数据
                </Button>
                {currentUser?.role !== 'STUDENT' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                      background: 'linear-gradient(120deg, #1890ff, #096dd9)',
                      borderColor: '#1890ff',
                      borderRadius: '8px',
                      height: '42px',
                      boxShadow: '0 2px 6px rgba(24, 144, 255, 0.3)'
                    }}
                  >
                    添加成绩
                  </Button>
                )}
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => setShowStatistics(true)}
                  style={{
                    borderRadius: '8px',
                    height: '42px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  统计分析
                </Button>
                {currentUser?.role !== 'STUDENT' && (
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={exportExcelGrades}
                    style={{
                      borderRadius: '8px',
                      height: '42px',
                      background: '#52c41a',
                      color: 'white',
                      borderColor: '#52c41a',
                      boxShadow: '0 2px 6px rgba(82, 196, 26, 0.3)'
                    }}
                  >
                    导出Excel
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        <Card 
          style={{ 
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderRadius: '12px'
          }}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索学生姓名或课程"
                prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '8px', height: '42px' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Select
                style={{ width: '100%', borderRadius: '8px' }}
                placeholder="选择课程"
                value={selectedCourse}
                onChange={setSelectedCourse}
                allowClear
                size="large"
                dropdownStyle={{ borderRadius: '8px' }}
              >
                {courses.map((course) => (
                  <Option key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select
                style={{ width: '100%', borderRadius: '8px' }}
                placeholder="选择状态"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                size="large"
                dropdownStyle={{ borderRadius: '8px' }}
              >
                <Option value="PENDING">
                  <Tag color="gold">待审核</Tag>
                </Option>
                <Option value="VERIFIED">
                  <Tag color="green">已通过</Tag>
                </Option>
                <Option value="REJECTED">
                  <Tag color="red">已驳回</Tag>
                </Option>
              </Select>
            </Col>
          </Row>

          <Table
            dataSource={filteredGrades}
            loading={loading}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              onChange: setCurrentPage,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条记录`,
              style: { marginTop: '16px' }
            }}
            columns={getTableColumns()}
            rowClassName={() => 'row-hover-shadow'}
            key={`grades-table-${new Date().getTime()}`}
            title={() => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>成绩列表</Text>
                  {filteredGrades.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                      共 {filteredGrades.length} 条记录
                    </Tag>
                  )}
                </div>
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => {
                    message.loading('正在刷新数据...', 1);
                    loadGrades();
                  }}
                  shape="circle"
                  type="primary"
                  ghost
                  size="small"
                />
              </div>
            )}
          />
        </Card>

        {/* 模态框组件 */}
        <AddGradeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddGrade}
          courses={courses}
          loading={loading}
        />

        {selectedGrade && (
          <EditGradeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleEditGrade}
            grade={selectedGrade}
            loading={loading}
            userRole={currentUser?.role || ''}
          />
        )}

        <Modal
          title="确认删除"
          open={isDeleteModalOpen}
          onOk={handleDeleteGrade}
          onCancel={() => setIsDeleteModalOpen(false)}
          okText="确认删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          style={{ borderRadius: '12px', overflow: 'hidden' }}
        >
          <div style={{ padding: '12px 0' }}>
            <p>确定要删除这条成绩记录吗？此操作不可恢复。</p>
            {selectedGrade && (
              <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                <p style={{ margin: '4px 0' }}>
                  <Text type="secondary">学生：</Text>
                  <Text strong>{selectedGrade.student?.name || '未知学生'}</Text>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <Text type="secondary">课程：</Text>
                  <Text strong>{selectedGrade.course?.name || '未知课程'}</Text> 
                  <Tag color="blue" style={{ marginLeft: '8px' }}>{selectedGrade.course?.code || '无代码'}</Tag>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <Text type="secondary">成绩：</Text>
                  <Text 
                    strong 
                    style={{ 
                      color: selectedGrade.score >= 60 ? '#52c41a' : '#f5222d', 
                      fontSize: '16px' 
                    }}
                  >
                    {selectedGrade.score}分
                  </Text>
                </p>
              </div>
            )}
          </div>
        </Modal>

        <GradeStatistics
          grades={grades}
        />
      </Content>
    </Layout>
  );
}

// 添加全局样式
const styleElement = document.createElement('style');
styleElement.textContent = `
  .row-hover-shadow:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    transform: translateY(-2px);
    transition: all 0.3s;
  }
  
  .ant-table-thead > tr > th {
    background-color: #f5f7fa !important;
    font-weight: 600;
  }
  
  .ant-pagination-item-active {
    border-color: #1890ff;
  }
`;
document.head.appendChild(styleElement); 