'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Button, Typography, Space, Avatar, Tooltip, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TeamOutlined, KeyOutlined, SmileOutlined, SafetyOutlined } from '@ant-design/icons';
import { generate as generatePassword } from 'generate-password';

const { Option } = Select;
const { Title, Text } = Typography;

type User = {
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  password?: string;
  avatarUrl?: string;
};

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
};

export default function AddUserModal({ isOpen, onClose, onAddUser }: AddUserModalProps) {
  const [form] = Form.useForm();
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [roleColor, setRoleColor] = useState('#52c41a'); // 默认学生颜色
  const [avatarUrl, setAvatarUrl] = useState('');

  // 角色对应的颜色
  const roleColors = {
    ADMIN: '#f56a00',
    TEACHER: '#1677ff',
    STUDENT: '#52c41a'
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
    setGeneratedPassword(newPassword);
    message.success('已生成安全密码！');
  };

  // 根据角色更新颜色
  const handleRoleChange = (value: string) => {
    setRoleColor(roleColors[value as keyof typeof roleColors]);
  };

  // 处理头像URL变更
  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value);
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onAddUser(values);
        form.resetFields();
        setGeneratedPassword('');
      })
      .catch(info => {
        console.log('验证失败:', info);
      });
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setGeneratedPassword('');
    setRoleColor('#52c41a');
    setAvatarUrl('');
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
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: roleColor }}
            src={avatarUrl}
          >
            {!avatarUrl && form.getFieldValue('name') ? form.getFieldValue('name').charAt(0).toUpperCase() : null}
          </Avatar>
          <Title level={5} style={{ margin: 0 }}>添加新用户</Title>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={500}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: 'STUDENT' }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="avatarUrl"
          label="头像URL"
        >
          <Input
            placeholder="请输入头像URL地址（可选）"
            onChange={handleAvatarUrlChange}
            suffix={
              avatarUrl ? (
                <Avatar size="small" src={avatarUrl} />
              ) : null
            }
          />
        </Form.Item>

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

        <Form.Item
          name="password"
          label={
            <Space>
              <span>密码</span>
              <Tooltip title="生成随机安全密码">
                <Button
                  type="link"
                  size="small"
                  icon={<SafetyOutlined />}
                  onClick={handleGeneratePassword}
                  style={{ padding: 0 }}
                >
                  生成密码
                </Button>
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能少于6位' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: roleColor }} />}
            placeholder="请输入密码"
            visibilityToggle={{ visible: !!generatedPassword }}
          />
        </Form.Item>

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

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={handleReset}>
              重置
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SmileOutlined />}
              style={{ backgroundColor: roleColor }}
            >
              创建用户
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
} 