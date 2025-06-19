import { useState, useEffect } from 'react';
import { Modal, Table, Button, Input, Space, Tag, Typography, Avatar, Select, message, Tooltip, Spin, Tabs, Empty } from 'antd';
import { SearchOutlined, UserAddOutlined, DeleteOutlined, DownloadOutlined, UserOutlined, AuditOutlined, ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import gradeUtils from '@/app/utils/gradeUtils';

const { Text, Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 学生类型定义
interface Student {
  id: string;
  name: string;
  email: string;
  score?: number | null;
  status?: string;
  avatarUrl?: string | null;
}

// 课程类型定义
interface Course {
  id: string;
  code: string;
  name: string;
}

interface ManageStudentsModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onStudentsChanged?: () => void;
}

export default function ManageStudentsModal({
  course,
  isOpen,
  onClose,
  onStudentsChanged
}: ManageStudentsModalProps) {
  // 学生列表状态
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('enrolled');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);

  // 获取选课学生数据
  useEffect(() => {
    if (isOpen && course.id) {
      fetchEnrolledStudents();
    }
  }, [isOpen, course.id]);

  // 获取所有学生数据（用于添加学生）
  useEffect(() => {
    if (isOpen && activeTab === 'add') {
      fetchAllStudents();
    }
  }, [isOpen, activeTab]);

  // 获取已选课学生
  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${course.id}/enroll`);
      
      if (!response.ok) {
        throw new Error('获取选课学生失败');
      }
      
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('获取选课学生出错:', error);
      message.error('获取选课学生失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有学生（用于添加）
  const fetchAllStudents = async () => {
    try {
      setLoadingAllStudents(true);
      const response = await fetch('/api/users?role=STUDENT');
      
      if (!response.ok) {
        throw new Error('获取学生列表失败');
      }
      
      const data = await response.json();
      
      // 过滤掉已经选课的学生
      const enrolledStudentIds = students.map(s => s.id);
      const availableStudents = (data.users || []).filter(
        (student: Student) => !enrolledStudentIds.includes(student.id)
      );
      
      setAllStudents(availableStudents);
    } catch (error) {
      console.error('获取学生列表出错:', error);
      message.error('获取学生列表失败');
    } finally {
      setLoadingAllStudents(false);
    }
  };

  // 添加学生到课程
  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      message.info('请选择至少一名学生');
      return;
    }
    
    try {
      setAddingStudents(true);
      
      // 批量添加学生
      const results = await Promise.all(
        selectedStudents.map(async (studentId) => {
          const response = await fetch(`/api/courses/${course.id}/students`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId }),
          });
          
          return { studentId, success: response.ok };
        })
      );
      
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        message.success(`成功添加 ${successCount} 名学生到课程`);
        fetchEnrolledStudents();
        setSelectedStudents([]);
        setActiveTab('enrolled');
        
        if (onStudentsChanged) {
          onStudentsChanged();
        }
      }
      
      if (successCount < selectedStudents.length) {
        message.warning(`${selectedStudents.length - successCount} 名学生添加失败`);
      }
    } catch (error) {
      console.error('添加学生出错:', error);
      message.error('添加学生失败');
    } finally {
      setAddingStudents(false);
    }
  };

  // 从课程中移除学生
  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/courses/${course.id}/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('移除学生失败');
      }
      
      message.success('学生已从课程中移除');
      fetchEnrolledStudents();
      
      if (onStudentsChanged) {
        onStudentsChanged();
      }
    } catch (error) {
      console.error('移除学生出错:', error);
      message.error('移除学生失败');
    }
  };
  
  // 获取状态标签颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'enrolled': return 'blue';
      case 'completed': return 'green';
      case 'dropped': return 'red';
      default: return 'default';
    }
  };
  
  // 获取状态显示文本
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'enrolled': return '在修';
      case 'completed': return '已完成';
      case 'dropped': return '已退课';
      default: return '未知';
    }
  };

  // 获取成绩颜色
  const getGradeColor = (score?: number | null) => {
    if (score === undefined || score === null) return {};
    
    if (score >= 90) return { color: '#52c41a' }; // A
    if (score >= 80) return { color: '#1890ff' }; // B
    if (score >= 70) return { color: '#faad14' }; // C
    if (score >= 60) return { color: '#fa8c16' }; // D
    return { color: '#f5222d' }; // F
  };

  // 学生列表表格列定义
  const columns: ColumnsType<Student> = [
    {
      title: '学生姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ marginRight: 8 }} 
            src={record.avatarUrl} 
            icon={!record.avatarUrl && <UserOutlined />}
          >
            {!record.avatarUrl && text.charAt(0)}
          </Avatar>
          {text}
        </div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => {
        return record.name.toLowerCase().includes((value as string).toLowerCase()) ||
          record.email.toLowerCase().includes((value as string).toLowerCase());
      },
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
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
              <>
                <span>{score}</span>
                <Tag 
                  color={getGradeColor(score).color}
                  style={{ marginLeft: 8 }}
                >
                  {grade}
                </Tag>
              </>
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
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '在修', value: 'enrolled' },
        { text: '已完成', value: 'completed' },
        { text: '已退课', value: 'dropped' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看成绩详情">
            <Button 
              type="text" 
              size="small" 
              icon={<AuditOutlined />} 
            />
          </Tooltip>
          <Tooltip title="移出课程">
            <Button 
              type="text" 
              size="small" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleRemoveStudent(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 所有学生列表列定义（用于添加学生）
  const allStudentsColumns: ColumnsType<Student> = [
    {
      title: '选择',
      dataIndex: 'selection',
      key: 'selection',
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedStudents.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedStudents([...selectedStudents, record.id]);
            } else {
              setSelectedStudents(selectedStudents.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: '学生姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ marginRight: 8 }} 
            src={record.avatarUrl} 
            icon={!record.avatarUrl && <UserOutlined />}
          >
            {!record.avatarUrl && text.charAt(0)}
          </Avatar>
          {text}
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExperimentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>管理 {course.name} 的学生</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        <TabPane
          tab={
            <span>
              <CheckCircleOutlined />
              已选课学生
            </span>
          }
          key="enrolled"
        >
          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Input
                placeholder="搜索学生姓名或邮箱"
                prefix={<SearchOutlined />}
                style={{ width: 250 }}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
              <Space>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setActiveTab('add')}
                >
                  添加学生
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                >
                  导出成绩单
                </Button>
              </Space>
            </Space>

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
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <UserAddOutlined />
              添加学生
            </span>
          }
          key="add"
          disabled={loading}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>添加学生到 {course.name}</Title>
            <Text type="secondary">
              请在下方列表中选择要添加到该课程的学生
            </Text>
          </div>

          {loadingAllStudents ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="加载学生列表..." />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={handleAddStudents}
                    disabled={selectedStudents.length === 0 || addingStudents}
                    loading={addingStudents}
                  >
                    添加选中的学生 ({selectedStudents.length})
                  </Button>
                  <Button
                    onClick={() => setSelectedStudents([])}
                    disabled={selectedStudents.length === 0}
                  >
                    清除选择
                  </Button>
                </Space>
              </div>

              <Table
                columns={allStudentsColumns}
                dataSource={allStudents}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedStudents,
                  onChange: (selectedRowKeys) => {
                    setSelectedStudents(selectedRowKeys as string[]);
                  }
                }}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                }}
                locale={{
                  emptyText: <Empty description="没有可添加的学生" />
                }}
              />
            </>
          )}
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button onClick={() => setActiveTab('enrolled')}>
              返回学生列表
            </Button>
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
} 