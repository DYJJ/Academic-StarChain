'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';
import { Table, Button, Card, Select, DatePicker, Space, Typography, Input, message } from 'antd';
import { DownloadOutlined, SearchOutlined, UndoOutlined } from '@ant-design/icons';
import BackButton from '../../components/BackButton';
import dayjs from 'dayjs';

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

    const getRoleName = (role: string) => {
        return role === 'ADMIN' ? '管理员' :
            role === 'TEACHER' ? '教师' : '学生';
    };

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
            render: (role: string) => getRoleName(role)
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true,
        },
        {
            title: 'IP地址',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
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
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={exportLogs}
                        >
                            导出日志
                        </Button>
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
        </div>
    );
} 