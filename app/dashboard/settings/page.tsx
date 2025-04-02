'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';
<<<<<<< HEAD
import { Table, Button, Card, Select, DatePicker, Space, Typography, Input, message, Tooltip, Badge, Tag, Modal } from 'antd';
import { DownloadOutlined, SearchOutlined, UndoOutlined, EyeOutlined, FileTextOutlined, InfoCircleOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import BackButton from '../../components/BackButton';
import dayjs from 'dayjs';
import LogDetailModal from './components/LogDetailModal';
=======
import { Table, Button, Card, Select, DatePicker, Space, Typography, Input, message } from 'antd';
import { DownloadOutlined, SearchOutlined, UndoOutlined } from '@ant-design/icons';
import BackButton from '../../components/BackButton';
import dayjs from 'dayjs';
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface LogEntry {
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    user: {
        name: string;
        email: string;
        role: string;
    };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function Settings() {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        dateRange: null as null | [dayjs.Dayjs, dayjs.Dayjs]
    });
<<<<<<< HEAD
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [clearLogsLoading, setClearLogsLoading] = useState(false);
    const { confirm } = Modal;
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f

    // 操作类型选项
    const actionOptions = Object.values(LogAction);

    useEffect(() => {
        fetchLogs();
        fetchUsers();

        // 记录访问设置页面的操作
        logAction(LogAction.SYSTEM_SETTING, '访问系统设置页面');
    }, [pagination.page, pagination.limit]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString()
            });

            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                queryParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
                queryParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
            }

            const response = await fetch(`/api/logs?${queryParams.toString()}`);

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error('获取日志失败');
            }

            const data = await response.json();
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (err: any) {
            message.error(err.message || '加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');

            if (!response.ok) {
                throw new Error('获取用户列表失败');
            }

            const data = await response.json();
            setUsers(data.users);
        } catch (err: any) {
            console.error('获取用户列表失败:', err);
            message.error('获取用户列表失败');
        }
    };

    const handleTableChange = (pagination: any) => {
        setPagination({
            ...pagination,
            page: pagination.current,
            limit: pagination.pageSize
        });
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    const applyFilters = () => {
        setPagination({ ...pagination, page: 1 });
        fetchLogs();
    };

    const resetFilters = () => {
        setFilters({
            userId: '',
            action: '',
            dateRange: null
        });
        setPagination({ ...pagination, page: 1 });
        fetchLogs();
    };

    const exportLogs = () => {
        // 将日志数据转换为CSV格式
        const headers = ['操作时间', '用户', '角色', '操作类型', '详情', 'IP地址'];
        const csvData = logs.map(log => [
            new Date(log.createdAt).toLocaleString('zh-CN'),
            `${log.user.name} (${log.user.email})`,
            log.user.role === 'ADMIN' ? '管理员' : log.user.role === 'TEACHER' ? '教师' : '学生',
            log.action,
            log.details || '',
            log.ipAddress || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `系统日志_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 记录导出日志操作
        logAction(LogAction.SYSTEM_SETTING, '导出系统日志');
        message.success('日志导出成功');
    };

<<<<<<< HEAD
    const showClearLogsConfirm = () => {
        confirm({
            title: '确定要清空所有日志吗？',
            icon: <ExclamationCircleOutlined />,
            content: '此操作将永久删除所有系统操作日志，且无法恢复。',
            okText: '确定清空',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                clearAllLogs();
            }
        });
    };

    const clearAllLogs = async () => {
        try {
            setClearLogsLoading(true);
            const response = await fetch('/api/logs/clear', {
                method: 'DELETE'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.error || '清空日志失败');
            }

            const data = await response.json();
            message.success(`已清空系统日志，共删除 ${data.deletedCount} 条记录`);
            // 刷新日志列表
            fetchLogs();
        } catch (err: any) {
            message.error(err.message || '清空日志失败');
        } finally {
            setClearLogsLoading(false);
        }
    };

=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    const getRoleName = (role: string) => {
        return role === 'ADMIN' ? '管理员' :
            role === 'TEACHER' ? '教师' : '学生';
    };

<<<<<<< HEAD
    const showLogDetail = (log: LogEntry) => {
        setSelectedLog(log);
        setDetailModalVisible(true);
        // 记录查看日志详情操作
        logAction(LogAction.SYSTEM_SETTING, `查看日志详情: ${log.id}`);
    };

=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    // 表格列配置
    const columns = [
        {
            title: '操作时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => {
                return new Date(text).toLocaleString('zh-CN');
            }
        },
        {
            title: '用户',
            key: 'user',
            render: (record: LogEntry) => (
                <span>
                    {record.user.name} <span style={{ color: '#999', fontSize: '12px' }}>({record.user.email})</span>
                </span>
            )
        },
        {
            title: '角色',
            dataIndex: ['user', 'role'],
            key: 'role',
<<<<<<< HEAD
            render: (role: string) => (
                <Tag color={role === 'ADMIN' ? 'red' : role === 'TEACHER' ? 'green' : 'default'}>
                    {getRoleName(role)}
                </Tag>
            )
=======
            render: (role: string) => getRoleName(role)
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
<<<<<<< HEAD
            render: (text: string) => (
                <Tag color="blue">{text}</Tag>
            )
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true,
<<<<<<< HEAD
            render: (details: string, record: LogEntry) => (
                <Space>
                    {details ?
                        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {details}
                        </div>
                        :
                        <span style={{ color: '#999' }}>无详情</span>
                    }
                    <Badge dot={details ? true : false}>
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => showLogDetail(record)}
                            size="small"
                        />
                    </Badge>
                </Space>
            )
        },
        {
            title: '操作',
            key: 'operation',
            width: 80,
            render: (_: any, record: LogEntry) => (
                <Tooltip title="查看详情">
                    <Button
                        type="link"
                        icon={<InfoCircleOutlined />}
                        onClick={() => showLogDetail(record)}
                    />
                </Tooltip>
            ),
=======
        },
        {
            title: 'IP地址',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        }
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Navbar />

            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <Card
                    title={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <BackButton route="/dashboard" />
                            <Title level={4} style={{ margin: '0 0 0 16px' }}>系统设置</Title>
                        </div>
                    }
                    extra={
<<<<<<< HEAD
                        <Space>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={exportLogs}
                            >
                                导出日志
                            </Button>
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={showClearLogsConfirm}
                                loading={clearLogsLoading}
                            >
                                清空日志
                            </Button>
                        </Space>
=======
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={exportLogs}
                        >
                            导出日志
                        </Button>
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
                    }
                >
                    {/* 筛选区域 */}
                    <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ minWidth: '200px' }}>
                            <Select
                                placeholder="选择用户"
                                style={{ width: '100%' }}
                                value={filters.userId || undefined}
                                onChange={(value) => handleFilterChange('userId', value)}
                                allowClear
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.id}>
                                        {user.name} ({getRoleName(user.role)})
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div style={{ minWidth: '200px' }}>
                            <Select
                                placeholder="操作类型"
                                style={{ width: '100%' }}
                                value={filters.action || undefined}
                                onChange={(value) => handleFilterChange('action', value)}
                                allowClear
                            >
                                {actionOptions.map(action => (
                                    <Option key={action} value={action}>
                                        {action}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div style={{ minWidth: '300px' }}>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={filters.dateRange}
                                onChange={(dates) => handleFilterChange('dateRange', dates)}
                            />
                        </div>

                        <div>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<SearchOutlined />}
                                    onClick={applyFilters}
                                >
                                    筛选
                                </Button>
                                <Button
                                    icon={<UndoOutlined />}
                                    onClick={resetFilters}
                                >
                                    重置
                                </Button>
                            </Space>
                        </div>
                    </div>

                    {/* 日志表格 */}
                    <Table
                        columns={columns}
                        dataSource={logs}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: pagination.page,
                            pageSize: pagination.limit,
                            total: pagination.total,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total) => `共 ${total} 条记录`
                        }}
                        onChange={handleTableChange}
                        bordered
                    />
                </Card>
            </div>
<<<<<<< HEAD

            {/* 日志详情Modal */}
            <LogDetailModal
                isOpen={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                log={selectedLog}
            />
=======
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        </div>
    );
} 