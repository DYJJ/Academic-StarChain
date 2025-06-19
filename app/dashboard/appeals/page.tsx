'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout,
  Typography,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileSearchOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 申诉类型枚举
const appealTypeMap = {
  'SCORE_ERROR': '分数错误',
  'CALCULATION_ERROR': '计算错误',
  'MISSING_POINTS': '漏计分数',
  'OTHER': '其他原因'
};

// 申诉状态枚举
const appealStatusMap = {
  'PENDING': { text: '等待处理', color: 'blue', icon: <SyncOutlined spin /> },
  'REVIEWING': { text: '正在审核', color: 'orange', icon: <FileSearchOutlined /> },
  'RESOLVED': { text: '已解决', color: 'green', icon: <CheckCircleOutlined /> },
  'REJECTED': { text: '已拒绝', color: 'red', icon: <CloseCircleOutlined /> }
};

// 申诉数据接口
interface AppealData {
  id: string;
  gradeId: string;
  studentId: string;
  type: string;
  reason: string;
  expectedScore?: number;
  evidence?: string;
  status: string;
  teacherComment?: string;
  meetingTime?: string;
  createdAt: string;
  updatedAt: string;
  grade: {
    id: string;
    score: number;
    course: {
      id: string;
      code: string;
      name: string;
    };
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
  };
}

// 用户数据接口
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AppealsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appeals, setAppeals] = useState<AppealData[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    rejected: 0
  });

  // 当前用户
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 处理申诉相关
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<AppealData | null>(null);
  const [form] = Form.useForm();
  const [processing, setProcessing] = useState(false);
  // 添加一个状态来控制自定义分数输入框的显示
  const [showCustomScore, setShowCustomScore] = useState(false);
  // 添加一个状态来存储当前输入的自定义分数
  const [currentCustomScore, setCurrentCustomScore] = useState<number | null>(null);

  // 筛选状态
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);

  // 确认对话框相关
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState<any>(null);

  // 加载用户和申诉数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取当前用户信息
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('获取用户信息失败');
        }

        const userData = await userResponse.json();
        setCurrentUser(userData.user);

        // 获取所有申诉
        const appealsResponse = await fetch('/api/grades/appeals');
        if (!appealsResponse.ok) {
          throw new Error('获取申诉列表失败');
        }

        const appealsData = await appealsResponse.json();

        // 根据用户角色过滤申诉数据
        let filteredAppeals = appealsData.appeals || [];
        if (userData.user.role === 'TEACHER') {
          // 教师只能看到与自己相关的申诉
          filteredAppeals = filteredAppeals.filter((appeal: AppealData) =>
            appeal.grade.teacher.id === userData.user.id
          );
        }

        setAppeals(filteredAppeals);

        // 计算统计数据
        setStats({
          total: filteredAppeals.length,
          pending: filteredAppeals.filter((a: AppealData) => a.status === 'PENDING').length,
          reviewing: filteredAppeals.filter((a: AppealData) => a.status === 'REVIEWING').length,
          resolved: filteredAppeals.filter((a: AppealData) => a.status === 'RESOLVED').length,
          rejected: filteredAppeals.filter((a: AppealData) => a.status === 'REJECTED').length
        });

        setLoading(false);
      } catch (err: any) {
        console.error('加载数据失败:', err);
        setError(err.message || '加载数据失败');
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // 打开申诉处理模态框
  const openProcessModal = (appeal: AppealData) => {
    setSelectedAppeal(appeal);
    // 重置自定义分数显示状态
    setShowCustomScore(false);
    setCurrentCustomScore(null);
    form.setFieldsValue({
      status: appeal.status,
      teacherComment: appeal.teacherComment || '',
      meetingTime: appeal.meetingTime ? dayjs(appeal.meetingTime) : undefined,
      updateGrade: 'expected' // 默认选择更新为学生预期分数
    });
    setModalVisible(true);
  };

  // 打开申诉详情模态框
  const openDetailModal = (appeal: AppealData) => {
    setSelectedAppeal(appeal);
    setDetailModalVisible(true);
  };

  // 表单提交前验证
  const handleFormSubmit = (values: any) => {
    // 显示确认对话框
    setConfirmModalContent(values);
    setConfirmModalVisible(true);
  };

  // 确认处理申诉
  const confirmProcessAppeal = async () => {
    if (!confirmModalContent || !selectedAppeal) return;

    await handleProcessAppeal(confirmModalContent);
    setConfirmModalVisible(false);
  };

  // 处理申诉
  const handleProcessAppeal = async (values: any) => {
    if (!selectedAppeal) return;

    try {
      setProcessing(true);

      const updateData = {
        status: values.status,
        teacherComment: values.teacherComment,
        meetingTime: values.meetingTime ? values.meetingTime.toISOString() : undefined
      };

      // 判断是否需要更新成绩以及更新方式
      const needUpdateGrade = values.status === 'RESOLVED' && 
        (values.updateGrade === 'expected' || values.updateGrade === 'custom');
      
      // 确定要更新的分数
      const updatedScore = values.updateGrade === 'expected' 
        ? selectedAppeal.expectedScore 
        : values.updateGrade === 'custom'
          ? Number(values.customScore)
          : null;

      // 提交申诉更新请求
      const response = await fetch(`/api/grades/appeals/${selectedAppeal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新申诉失败');
      }

      // 成功处理申诉
      const data = await response.json();

      // 如果需要更新成绩
      if (needUpdateGrade && updatedScore !== null) {
        // 更新成绩请求
        const gradeUpdateResponse = await fetch(`/api/grades`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: selectedAppeal.gradeId,
            score: updatedScore,
            metadata: {
              reason: `根据申诉ID: ${selectedAppeal.id} 更新成绩`,
              appealId: selectedAppeal.id,
              approvedBy: currentUser?.id,
              scoreType: values.updateGrade === 'expected' ? '学生预期分数' : '教师自定义分数'
            }
          }),
        });

        if (!gradeUpdateResponse.ok) {
          const errorData = await gradeUpdateResponse.json();
          console.error('成绩更新失败:', errorData);
          message.error(`申诉状态已更新，但成绩更新失败: ${errorData.error || '未知错误'}`);
        } else {
          const scoreType = values.updateGrade === 'expected' ? '学生预期分数' : '自定义分数';
          message.success(`申诉已解决，成绩已更新为${scoreType}`);
        }
      } else {
        message.success('申诉已更新');
      }

      // 更新本地状态
      setAppeals(appeals.map(appeal => {
        if (appeal.id === selectedAppeal.id) {
          return {
            ...appeal,
            ...data.appeal
          };
        }
        return appeal;
      }));

      // 更新统计数据
      const updatedAppeals = appeals.map(appeal => {
        if (appeal.id === selectedAppeal.id) {
          return { ...appeal, status: values.status };
        }
        return appeal;
      });

      setStats({
        total: updatedAppeals.length,
        pending: updatedAppeals.filter((a: AppealData) => a.status === 'PENDING').length,
        reviewing: updatedAppeals.filter((a: AppealData) => a.status === 'REVIEWING').length,
        resolved: updatedAppeals.filter((a: AppealData) => a.status === 'RESOLVED').length,
        rejected: updatedAppeals.filter((a: AppealData) => a.status === 'REJECTED').length
      });

      setModalVisible(false);
    } catch (err: any) {
      message.error(err.message || '处理申诉失败');
    } finally {
      setProcessing(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '学生',
      dataIndex: ['grade', 'student', 'name'],
      key: 'student',
      render: (text: string, record: AppealData) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.grade.student.email}</Text>
        </div>
      ),
    },
    {
      title: '课程',
      dataIndex: ['grade', 'course', 'name'],
      key: 'course',
      render: (text: string, record: AppealData) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.grade.course.code}</Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => appealTypeMap[type as keyof typeof appealTypeMap] || type,
    },
    {
      title: '当前分数',
      dataIndex: ['grade', 'score'],
      key: 'currentScore',
      render: (score: number) => <Text strong>{score.toFixed(1)}</Text>,
    },
    {
      title: '期望分数',
      dataIndex: 'expectedScore',
      key: 'expectedScore',
      render: (score: number | undefined) => score ? <Text strong>{score.toFixed(1)}</Text> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = appealStatusMap[status as keyof typeof appealStatusMap];
        return (
          <Tag icon={statusInfo?.icon} color={statusInfo?.color}>
            {statusInfo?.text || status}
          </Tag>
        );
      },
      filters: [
        { text: '等待处理', value: 'PENDING' },
        { text: '正在审核', value: 'REVIEWING' },
        { text: '已解决', value: 'RESOLVED' },
        { text: '已拒绝', value: 'REJECTED' },
      ],
      onFilter: (value: any, record: AppealData) => record.status === value,
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: AppealData, b: AppealData) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AppealData) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            onClick={() => openProcessModal(record)}
            disabled={record.status === 'RESOLVED'}
            style={{
              backgroundColor: record.status === 'RESOLVED' ? '#f5f5f5' : undefined,
              cursor: record.status === 'RESOLVED' ? 'not-allowed' : 'pointer'
            }}
          >
            处理
          </Button>
          <Button
            size="small"
            onClick={() => openDetailModal(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // 根据状态筛选
  const filteredAppeals = filteredStatus
    ? appeals.filter(appeal => appeal.status === filteredStatus)
    : appeals;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <Alert message="错误" description={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <BackButton />
            <Title level={3} style={{ margin: 0, marginLeft: 16 }}>成绩申诉管理</Title>
          </div>

          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8} md={4}>
              <Card size="small">
                <Statistic
                  title="总申诉"
                  value={stats.total}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small">
                <Statistic
                  title="待处理"
                  value={stats.pending}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<SyncOutlined spin />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small">
                <Statistic
                  title="审核中"
                  value={stats.reviewing}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<FileSearchOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small">
                <Statistic
                  title="已解决"
                  value={stats.resolved}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={5}>
              <Card size="small">
                <Statistic
                  title="已拒绝"
                  value={stats.rejected}
                  valueStyle={{ color: '#f5222d' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 状态筛选按钮 */}
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type={filteredStatus === null ? 'primary' : 'default'}
                onClick={() => setFilteredStatus(null)}
              >
                全部
              </Button>
              <Button
                type={filteredStatus === 'PENDING' ? 'primary' : 'default'}
                onClick={() => setFilteredStatus('PENDING')}
                icon={<SyncOutlined spin />}
              >
                待处理
              </Button>
              <Button
                type={filteredStatus === 'REVIEWING' ? 'primary' : 'default'}
                onClick={() => setFilteredStatus('REVIEWING')}
                icon={<FileSearchOutlined />}
              >
                审核中
              </Button>
              <Button
                type={filteredStatus === 'RESOLVED' ? 'primary' : 'default'}
                onClick={() => setFilteredStatus('RESOLVED')}
                icon={<CheckCircleOutlined />}
              >
                已解决
              </Button>
              <Button
                type={filteredStatus === 'REJECTED' ? 'primary' : 'default'}
                onClick={() => setFilteredStatus('REJECTED')}
                icon={<CloseCircleOutlined />}
              >
                已拒绝
              </Button>
            </Space>
          </div>

          {/* 申诉列表表格 */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredAppeals}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `共 ${total} 条申诉`
              }}
            />
          </Card>

          {/* 申诉处理模态框 */}
          <Modal
            title="处理成绩申诉"
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={600}
          >
            {selectedAppeal && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div><Text strong>学生：</Text> {selectedAppeal.grade.student.name}</div>
                  <div><Text strong>课程：</Text> {selectedAppeal.grade.course.name} ({selectedAppeal.grade.course.code})</div>
                  <div><Text strong>当前分数：</Text> {selectedAppeal.grade.score}</div>
                  <div><Text strong>期望分数：</Text> {selectedAppeal.expectedScore || '未提供'}</div>
                  <div><Text strong>类型：</Text> {appealTypeMap[selectedAppeal.type as keyof typeof appealTypeMap] || selectedAppeal.type}</div>
                  <div><Text strong>申诉理由：</Text></div>
                  <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                    {selectedAppeal.reason}
                  </div>
                  {selectedAppeal.evidence && (
                    <>
                      <div style={{ marginTop: 8 }}><Text strong>证据说明：</Text></div>
                      <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                        {selectedAppeal.evidence}
                      </div>
                    </>
                  )}
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleFormSubmit}
                  initialValues={{
                    status: selectedAppeal.status,
                    teacherComment: selectedAppeal.teacherComment || '',
                    meetingTime: selectedAppeal.meetingTime ? dayjs(selectedAppeal.meetingTime) : undefined
                  }}
                >
                  <Form.Item
                    name="status"
                    label="申诉状态"
                    rules={[{ required: true, message: '请选择申诉状态' }]}
                  >
                    <Select>
                      <Option value="PENDING">等待处理</Option>
                      <Option value="REVIEWING">正在审核</Option>
                      <Option value="RESOLVED">已解决</Option>
                      <Option value="REJECTED">已拒绝</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="teacherComment"
                    label="处理意见"
                  >
                    <TextArea
                      rows={4}
                      placeholder="请输入对该申诉的处理意见..."
                    />
                  </Form.Item>

                  <Form.Item
                    name="updateGrade"
                    label="更新成绩"
                    tooltip="选择是否更新成绩及更新方式"
                  >
                    <Select onChange={(value) => {
                      setShowCustomScore(value === 'custom');
                      if (value === 'custom') {
                        form.setFieldsValue({ 
                          customScore: selectedAppeal?.grade.score 
                        });
                      }
                    }}>
                      <Option value="expected">更新为学生预期分数 ({selectedAppeal.expectedScore || '未提供'})</Option>
                      <Option value="custom">自定义修改分数</Option>
                      <Option value="none">不更新成绩</Option>
                    </Select>
                  </Form.Item>
                  
                  {showCustomScore && (
                    <Form.Item
                      name="customScore"
                      label="自定义分数"
                      rules={[
                        { required: true, message: '请输入自定义分数' },
                        { 
                          type: 'number', 
                          min: 0, 
                          max: 100, 
                          message: '分数必须在0-100之间',
                          transform: val => Number(val)
                        }
                      ]}
                    >
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        step={0.1} 
                        placeholder="输入0-100之间的分数"
                        addonAfter="分" 
                        style={{ width: '200px' }}
                        autoFocus
                        onChange={(e) => setCurrentCustomScore(e.target.value ? Number(e.target.value) : null)}
                      />
                    </Form.Item>
                  )}
                  
                  {/* 显示当前成绩与自定义成绩的对比提示 */}
                  {showCustomScore && (
                    <div style={{ marginBottom: '16px', paddingLeft: '24px' }}>
                      <Text type="secondary">
                        当前成绩: <Text strong>{selectedAppeal.grade.score}</Text> → 
                        自定义成绩: <Text strong style={{ color: currentCustomScore !== null ? '#1677ff' : 'inherit' }}>
                          {currentCustomScore !== null ? currentCustomScore : '?'}
                        </Text>
                        {selectedAppeal.expectedScore && (
                          <Text type="secondary"> (学生预期: {selectedAppeal.expectedScore})</Text>
                        )}
                      </Text>
                    </div>
                  )}

                  <Form.Item
                    name="meetingTime"
                    label="会面时间（可选）"
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      placeholder="选择与学生会面的时间"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={processing}
                      >
                        提交处理
                      </Button>
                      <Button onClick={() => setModalVisible(false)}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            )}
          </Modal>

          {/* 申诉详情模态框 */}
          <Modal
            title="申诉详情"
            open={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={[
              <Button key="back" onClick={() => setDetailModalVisible(false)}>
                关闭
              </Button>,
              <Button
                key="process"
                type="primary"
                onClick={() => {
                  setDetailModalVisible(false);
                  if (selectedAppeal) {
                    openProcessModal(selectedAppeal);
                  }
                }}
                disabled={selectedAppeal?.status === 'RESOLVED'}
                style={{
                  backgroundColor: selectedAppeal?.status === 'RESOLVED' ? '#f5f5f5' : undefined,
                  cursor: selectedAppeal?.status === 'RESOLVED' ? 'not-allowed' : 'pointer'
                }}
              >
                处理此申诉
              </Button>,
            ]}
            width={600}
          >
            {selectedAppeal && (
              <div>
                <Card title="基本信息" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}><Text strong>学生：</Text> {selectedAppeal.grade.student.name}</Col>
                    <Col span={12}><Text strong>邮箱：</Text> {selectedAppeal.grade.student.email}</Col>
                    <Col span={12}><Text strong>课程：</Text> {selectedAppeal.grade.course.name}</Col>
                    <Col span={12}><Text strong>课程代码：</Text> {selectedAppeal.grade.course.code}</Col>
                    <Col span={12}><Text strong>当前分数：</Text> {selectedAppeal.grade.score}</Col>
                    <Col span={12}><Text strong>期望分数：</Text> {selectedAppeal.expectedScore || '未提供'}</Col>
                    <Col span={12}>
                      <Text strong>申诉类型：</Text>
                      {appealTypeMap[selectedAppeal.type as keyof typeof appealTypeMap] || selectedAppeal.type}
                    </Col>
                    <Col span={12}>
                      <Text strong>申诉状态：</Text>
                      <Tag color={appealStatusMap[selectedAppeal.status as keyof typeof appealStatusMap]?.color}>
                        {appealStatusMap[selectedAppeal.status as keyof typeof appealStatusMap]?.text || selectedAppeal.status}
                      </Tag>
                    </Col>
                    <Col span={12}>
                      <Text strong>提交时间：</Text>
                      {dayjs(selectedAppeal.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Col>
                    <Col span={12}>
                      <Text strong>更新时间：</Text>
                      {dayjs(selectedAppeal.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </Col>
                    {selectedAppeal.meetingTime && (
                      <Col span={24}>
                        <Text strong>会面时间：</Text>
                        <Tag icon={<CalendarOutlined />} color="purple">
                          {dayjs(selectedAppeal.meetingTime).format('YYYY-MM-DD HH:mm')}
                        </Tag>
                      </Col>
                    )}
                  </Row>
                </Card>

                <Card title="申诉理由" style={{ marginBottom: 16 }}>
                  <Paragraph>{selectedAppeal.reason}</Paragraph>
                </Card>

                {selectedAppeal.evidence && (
                  <Card title="证据说明">
                    <Paragraph>{selectedAppeal.evidence}</Paragraph>
                  </Card>
                )}

                {selectedAppeal.teacherComment && (
                  <Card title="处理意见" style={{ marginTop: 16 }}>
                    <Paragraph>{selectedAppeal.teacherComment}</Paragraph>
                  </Card>
                )}
              </div>
            )}
          </Modal>

          {/* 申诉处理确认对话框 */}
          <Modal
            title="确认处理申诉"
            open={confirmModalVisible}
            onOk={confirmProcessAppeal}
            onCancel={() => setConfirmModalVisible(false)}
            confirmLoading={processing}
          >
            <p>您确定要处理此申诉吗？</p>
            {confirmModalContent && (
              <div>
                {confirmModalContent.updateGrade === 'expected' && confirmModalContent.status === 'RESOLVED' && (
                  <Alert
                    message="注意：将更新成绩"
                    description={`学生成绩将从 ${selectedAppeal?.grade.score} 更改为学生预期分数 ${selectedAppeal?.expectedScore}`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, marginTop: 16 }}
                  />
                )}
                {confirmModalContent.updateGrade === 'custom' && confirmModalContent.status === 'RESOLVED' && (
                  <Alert
                    message="注意：将更新成绩"
                    description={
                      <>
                        <p>学生成绩将从 <Text strong>{selectedAppeal?.grade.score}</Text> 更改为自定义分数 <Text strong style={{color: '#ff4d4f'}}>{confirmModalContent.customScore}</Text></p>
                        <p>学生预期分数为: <Text strong>{selectedAppeal?.expectedScore || '未提供'}</Text></p>
                      </>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, marginTop: 16 }}
                  />
                )}
                <p><Text strong>申诉状态：</Text> {appealStatusMap[confirmModalContent.status as keyof typeof appealStatusMap]?.text}</p>
                {confirmModalContent.teacherComment && (
                  <p><Text strong>处理意见：</Text> {confirmModalContent.teacherComment}</p>
                )}
              </div>
            )}
          </Modal>
        </div>
      </Content>
    </Layout>
  );
} 