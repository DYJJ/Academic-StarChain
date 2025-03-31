'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Typography, Space, Avatar, Alert, Tooltip, Badge, Switch, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TeamOutlined, KeyOutlined, EditOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import { generate as generatePassword } from 'generate-password';

const { Option } = Select;
const { Title, Text } = Typography;
const { Password } = Input;

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  password?: string;
};

type EditUserModalProps = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onEditUser: (user: User) => void;
};

export default function EditUserModal({ user, isOpen, onClose, onEditUser }: EditUserModalProps) {
  const [form] = Form.useForm();
  const [roleColor, setRoleColor] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [changeHistory, setChangeHistory] = useState<{ field: string, from: string, to: string }[]>([]);

  // 角色对应的颜色
  const roleColors = {
    ADMIN: '#f56a00',
    TEACHER: '#1677ff',
    STUDENT: '#52c41a'
  };

  // 角色对应的图标
  const roleIcons = {
    ADMIN: <KeyOutlined />,
    TEACHER: <TeamOutlined />,
    STUDENT: <UserOutlined />
  };

  // 初始化表单和角色颜色
  useEffect(() => {
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setRoleColor(roleColors[user.role]);
  }, [user, form]);

  // 重置表单
  const handleReset = () => {
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowPasswordField(false);
  };

  // 随机生成密码
  const handleGeneratePassword = () => {
    const newPassword = generatePassword({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true
    });
    form.setFieldsValue({ password: newPassword });
    message.success('已生成安全密码！');
  };

  // 根据角色更新颜色
  const handleRoleChange = (value: string) => {
    const previousRole = form.getFieldValue('role');
    setRoleColor(roleColors[value as keyof typeof roleColors]);

    // 添加到变更历史
    if (previousRole !== value) {
      const newHistory = [...changeHistory];
      newHistory.push({
        field: '角色',
        from: getRoleName(previousRole),
        to: getRoleName(value)
      });
      setChangeHistory(newHistory);
    }
  };

  // 获取角色名称
  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return '管理员';
      case 'TEACHER': return '教师';
      case 'STUDENT': return '学生';
      default: return role;
    }
  };

  // 监听表单字段变化
  const handleFieldChange = (changedFields: any, allFields: any) => {
    const changedField = changedFields[0];
    if (!changedField) return;

    const { name, value } = changedField;
    if (name[0] === 'name' || name[0] === 'email') {
      const originalValue = name[0] === 'name' ? user.name : user.email;
      const displayName = name[0] === 'name' ? '姓名' : '邮箱';

      if (originalValue !== value && value && originalValue) {
        // 确保不是初始化设置
        const existingIndex = changeHistory.findIndex(h => h.field === displayName);
        const newHistory = [...changeHistory];

        if (existingIndex >= 0) {
          // 更新现有记录
          newHistory[existingIndex] = {
            field: displayName,
            from: originalValue,
            to: value
          };
        } else {
          // 添加新记录
          newHistory.push({
            field: displayName,
            from: originalValue,
            to: value
          });
        }

        setChangeHistory(newHistory);
      }
    }
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // 准备提交数据
        const userData: {
          id: string;
          name: any;
          email: any;
          role: any;
          password?: string;
        } = {
          id: user.id,
          name: values.name,
          email: values.email,
          role: values.role
        };

        // 如果有填写密码则添加
        if (values.password) {
          userData.password = values.password;
        }

        onEditUser(userData);
        if (showPasswordField) {
          setShowPasswordField(false);
        }
        setChangeHistory([]);
      })
      .catch(info => {
        console.log('验证失败:', info);
      });
  };

  // 角色选项
  const roleOptions = [
    { value: 'STUDENT', label: '学生', icon: <UserOutlined />, color: '#52c41a' },
    { value: 'TEACHER', label: '教师', icon: <TeamOutlined />, color: '#1677ff' },
    { value: 'ADMIN', label: '管理员', icon: <KeyOutlined />, color: '#f56a00' }
  ];

  return (
    <Modal
      title={
        <Space align="center">
          <Avatar
            icon={roleIcons[user.role as keyof typeof roleIcons]}
            style={{ backgroundColor: roleColor }}
          />
          <div>
            <Title level={5} style={{ margin: 0 }}>编辑用户</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>ID: {user.id.substring(0, 8)}...</Text>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={520}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFieldsChange={handleFieldChange}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入用户姓名' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: roleColor }} />}
            placeholder="请输入用户姓名"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: roleColor }} />}
            placeholder="请输入邮箱地址"
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Switch
              checked={showPasswordField}
              onChange={(checked) => setShowPasswordField(checked)}
              size="small"
            />
            <Text>修改密码</Text>
          </Space>

          {showPasswordField && (
            <Form.Item
              name="password"
              rules={[
                { min: 6, message: '密码长度不能少于6位' }
              ]}
              style={{ marginBottom: 0 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Password
                  prefix={<LockOutlined style={{ color: roleColor }} />}
                  placeholder="请输入新密码"
                />
                <Button
                  type="link"
                  size="small"
                  icon={<LockOutlined />}
                  onClick={handleGeneratePassword}
                  style={{ padding: '0' }}
                >
                  生成随机密码
                </Button>
              </Space>
            </Form.Item>
          )}
        </div>

        <Form.Item
          name="role"
          label="角色"
        >
          <Select
            onChange={handleRoleChange}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          >
            {roleOptions.map(role => (
              <Option key={role.value} value={role.value}>
                <Space>
                  <Avatar size="small" icon={role.icon} style={{ backgroundColor: role.color }} />
                  {role.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {changeHistory.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Badge count={changeHistory.length} style={{ backgroundColor: '#1677ff' }} />
              <Button
                type="link"
                icon={<HistoryOutlined />}
                onClick={() => setShowHistory(!showHistory)}
                size="small"
                style={{ padding: 0 }}
              >
                {showHistory ? '隐藏变更记录' : '显示变更记录'}
              </Button>
            </Space>

            {showHistory && (
              <Alert
                type="info"
                showIcon
                description={
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {changeHistory.map((change, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>
                        <Text>{change.field}：</Text>
                        <Text delete type="secondary">{change.from}</Text>
                        <Text> → </Text>
                        <Text strong style={{ color: roleColor }}>{change.to}</Text>
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleReset} icon={<HistoryOutlined />}>
              重置
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              style={{ backgroundColor: roleColor }}
            >
              保存修改
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
} 