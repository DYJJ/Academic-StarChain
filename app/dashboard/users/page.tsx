'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout, Table, Card, Button, Input, Select, Space,
  Typography, Tag, Modal, message, Spin, Row, Col, Avatar
} from 'antd';
import {
  UserOutlined, SearchOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import AddUserModal from './components/AddUserModal';
import EditUserModal from './components/EditUserModal';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  createdAt?: string;
  updatedAt?: string;
};

export default function UsersManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // 模态框状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`获取用户列表失败: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err: any) {
      console.error('加载用户列表时出错:', err);
      message.error(`加载用户列表失败: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    // 获取当前登录用户和用户列表
    async function fetchData() {
      try {
        // 从API获取当前用户信息
        const userResponse = await fetch('/api/auth/me');

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            // 未登录或会话已过期，重定向到登录页
            router.push('/login');
            return;
          }
          throw new Error('获取用户信息失败');
        }

        const userData = await userResponse.json();
        const user = userData.user;

        if (user.role !== 'ADMIN') {
          // 如果不是管理员，重定向到仪表板
          router.push('/dashboard');
          return;
        }

        setCurrentUser(user);

        // 加载用户列表数据
        await loadUsers();
      } catch (err: any) {
        message.error(err.message || '加载数据失败');
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // 获取角色显示标签
  const getRoleTag = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Tag color="red">管理员</Tag>;
      case 'TEACHER':
        return <Tag color="blue">教师</Tag>;
      case 'STUDENT':
        return <Tag color="green">学生</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // 添加用户
  const handleAddUser = async (newUser: Omit<User, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '添加用户失败');
      }

      // 重新加载用户列表
      await loadUsers();
      setIsAddModalOpen(false);
      message.success('用户添加成功');
    } catch (err: any) {
      console.error('添加用户时出错:', err);
      message.error(`添加用户失败: ${err.message}`);
      setLoading(false);
    }
  };

  // 编辑用户
  const handleEditUser = async (updatedUser: Omit<User, 'createdAt'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新用户失败');
      }

      // 重新加载用户列表
      await loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
      message.success('用户信息更新成功');
    } catch (err: any) {
      console.error('更新用户时出错:', err);
      message.error(`更新用户失败: ${err.message}`);
      setLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除用户失败');
      }

      // 重新加载用户列表
      await loadUsers();
      message.success('用户删除成功');
    } catch (err: any) {
      console.error('删除用户时出错:', err);
      message.error(`删除用户失败: ${err.message}`);
      setLoading(false);
    }
  };

  // 显示删除确认对话框
  const showDeleteConfirm = (user: User) => {
    confirm({
      title: '确定要删除这个用户吗?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>用户名: {user.name}</p>
          <p>邮箱: {user.email}</p>
          <p>角色: {user.role}</p>
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        return handleDeleteUser(user.id);
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role),
      filters: [
        { text: '管理员', value: 'ADMIN' },
        { text: '教师', value: 'TEACHER' },
        { text: '学生', value: 'STUDENT' },
      ],
      onFilter: (value: string, record: User) => record.role === value,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: User, b: User) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setIsEditModalOpen(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => showDeleteConfirm(record)}
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BackButton route="/dashboard" />
                <Title level={4} style={{ margin: '0 0 0 16px' }}>用户管理</Title>
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalOpen(true)}
              >
                添加用户
              </Button>
            }
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={16}>
                <Input
                  placeholder="搜索用户名或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Select
                  placeholder="选择角色"
                  style={{ width: '100%' }}
                  value={selectedRole}
                  onChange={(value) => setSelectedRole(value)}
                >
                  <Option value="ALL">所有角色</Option>
                  <Option value="ADMIN">管理员</Option>
                  <Option value="TEACHER">教师</Option>
                  <Option value="STUDENT">学生</Option>
                </Select>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={filteredUsers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              loading={loading}
            />
          </Card>

          {/* 添加用户模态框 */}
          <AddUserModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddUser={handleAddUser}
          />

          {/* 编辑用户模态框 */}
          {selectedUser && (
            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              onEditUser={handleEditUser}
              user={selectedUser}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
} 