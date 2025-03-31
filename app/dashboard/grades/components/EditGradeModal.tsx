'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Typography, Descriptions, Space, Tag, Avatar, Tooltip, Progress, Alert, Divider, Switch } from 'antd';
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, TrophyOutlined, BookOutlined, UserOutlined, SaveOutlined, UndoOutlined, PercentageOutlined, AuditOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// 定义成绩类型
type Grade = {
  id: string;
  score: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    code: string;
    name: string;
  };
};

// 定义属性类型
type EditGradeModalProps = {
  grade: Grade;
  onSubmit: (data: { id: string; score: number; status?: string }) => void;
  onClose: () => void;
  isOpen: boolean;
  loading: boolean;
  userRole: string;
};

export default function EditGradeModal({
  grade,
  onSubmit,
  onClose,
  isOpen,
  loading,
  userRole
}: EditGradeModalProps) {
  const [form] = Form.useForm();
  const [currentScore, setCurrentScore] = useState<number>(grade.score);
  const [originalScore, setOriginalScore] = useState<number>(grade.score);
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const isAdmin = userRole === 'ADMIN';

  // 获取成绩级别
  const getGradeLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: '#52c41a' };
    if (score >= 80) return { text: '良好', color: '#1890ff' };
    if (score >= 70) return { text: '中等', color: '#faad14' };
    if (score >= 60) return { text: '及格', color: '#fa8c16' };
    return { text: '不及格', color: '#f5222d' };
  };

  // 状态标签样式
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Tag icon={<CheckCircleOutlined />} color="success">已验证</Tag>;
      case 'REJECTED':
        return <Tag icon={<CloseCircleOutlined />} color="error">已拒绝</Tag>;
      default:
        return <Tag icon={<QuestionCircleOutlined />} color="warning">待验证</Tag>;
    }
  };

  // 表单初始值
  useEffect(() => {
    form.setFieldsValue({
      score: grade.score,
      status: grade.status
    });
    setCurrentScore(grade.score);
    setOriginalScore(grade.score);
    setHasChanged(false);
  }, [grade, form]);

  // 处理分数变化
  const handleScoreChange = (value: number | null) => {
    if (value !== null) {
      setCurrentScore(value);
      setHasChanged(value !== originalScore ||
        (isAdmin && form.getFieldValue('status') !== grade.status));
    }
  };

  // 处理状态变化
  const handleStatusChange = () => {
    setHasChanged(currentScore !== originalScore ||
      (isAdmin && form.getFieldValue('status') !== grade.status));
  };

  const handleFinish = (values: any) => {
    const updateData: { id: string; score: number; status?: string } = {
      id: grade.id,
      score: values.score
    };

    // 如果是管理员，可以修改状态
    if (isAdmin) {
      updateData.status = values.status;
    }

    onSubmit(updateData);
  };

  // 获取进度条状态
  const getProgressStatus = (score: number) => {
    if (score >= 60) return 'success';
    return 'exception';
  };

  return (
    <Modal
      title={
        <Space>
          <Avatar icon={<TrophyOutlined />} style={{ backgroundColor: getGradeLevel(currentScore).color }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>编辑成绩</Title>
            <Text type="secondary">{hasChanged && '(有未保存的更改)'}</Text>
          </div>
        </Space>
      }
      open={isOpen}
      onCancel={() => {
        if (hasChanged) {
          Modal.confirm({
            title: '确定要放弃更改吗？',
            content: '您对成绩的修改尚未保存。',
            okText: '确定放弃',
            cancelText: '继续编辑',
            onOk: onClose
          });
        } else {
          onClose();
        }
      }}
      footer={null}
      width={520}
      destroyOnClose
    >
      <div style={{ marginBottom: 24 }}>
        <Descriptions
          bordered
          size="small"
          column={1}
          title={
            <Space style={{ marginBottom: 8 }}>
              <Text strong>学生与课程信息</Text>
              <Switch
                checkedChildren="显示预览"
                unCheckedChildren="隐藏预览"
                checked={showPreview}
                onChange={setShowPreview}
                size="small"
              />
            </Space>
          }
        >
          <Descriptions.Item
            label={
              <Space>
                <UserOutlined />
                <span>学生</span>
              </Space>
            }
          >
            <Space>
              <Avatar style={{ backgroundColor: '#87d068' }}>
                {grade.student.name.charAt(0)}
              </Avatar>
              <span>{grade.student.name}</span>
              <Text type="secondary">({grade.student.email})</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <BookOutlined />
                <span>课程</span>
              </Space>
            }
          >
            <Space>
              <Tag color="blue">{grade.course.code}</Tag>
              <span>{grade.course.name}</span>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {showPreview && (
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Progress
            type="dashboard"
            percent={Math.round(currentScore)}
            status={getProgressStatus(currentScore)}
            format={(percent) => (
              <span style={{ fontSize: 20, fontWeight: 'bold' }}>
                {percent} <PercentageOutlined style={{ fontSize: 16 }} />
              </span>
            )}
          />
          <div style={{ marginTop: 8 }}>
            <Tag color={getGradeLevel(currentScore).color} style={{ padding: '0 12px', fontSize: 14 }}>
              {getGradeLevel(currentScore).text}
            </Tag>
            {currentScore !== originalScore && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">原始分数: </Text>
                <Text delete>{originalScore}</Text>
                <Text type="secondary"> → 新分数: </Text>
                <Text strong style={{ color: getGradeLevel(currentScore).color }}>{currentScore}</Text>
              </div>
            )}
          </div>
        </div>
      )}

      {hasChanged && (
        <Alert
          message="成绩已修改"
          description="请点击保存按钮以提交修改。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ score: grade.score, status: grade.status }}
        onValuesChange={(changedValues) => {
          setHasChanged(true);
          if (changedValues.score !== undefined) {
            setCurrentScore(changedValues.score);
          }
        }}
      >
        <Form.Item
          name="score"
          label={
            <Tooltip title="分数范围: 0-100">
              <Space>
                <TrophyOutlined />
                <span>成绩分数</span>
              </Space>
            </Tooltip>
          }
          rules={[
            { required: true, message: '请输入成绩' },
            { type: 'number', min: 0, max: 100, message: '成绩必须在0-100之间' }
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            step={0.5}
            style={{ width: '100%' }}
            placeholder="请输入0-100之间的成绩"
            onChange={handleScoreChange}
            addonAfter="分"
            size="large"
          />
        </Form.Item>

        {/* 仅管理员可以修改状态 */}
        {isAdmin && (
          <Form.Item
            name="status"
            label={
              <Space>
                <AuditOutlined /> 成绩状态
              </Space>
            }
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select size="large">
              <Select.Option value="PENDING">
                <Tag icon={<QuestionCircleOutlined />} color="warning">待验证</Tag>
              </Select.Option>
              <Select.Option value="VERIFIED">
                <Tag icon={<CheckCircleOutlined />} color="success">已验证</Tag>
              </Select.Option>
              <Select.Option value="REJECTED">
                <Tag icon={<CloseCircleOutlined />} color="error">已拒绝</Tag>
              </Select.Option>
            </Select>
          </Form.Item>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button
              icon={<UndoOutlined />}
              onClick={() => {
                form.setFieldsValue({
                  score: grade.score,
                  status: grade.status
                });
                setCurrentScore(grade.score);
                setHasChanged(false);
              }}
              disabled={!hasChanged}
            >
              重置
            </Button>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              disabled={!hasChanged}
            >
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
} 