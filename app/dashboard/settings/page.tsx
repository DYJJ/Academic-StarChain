'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { LogAction, logAction } from '../../utils/logger';
import { Table, Button, Card, Select, DatePicker, Space, Typography, Input, message, Tooltip, Badge, Tag, Modal, Dropdown } from 'antd';
import { DownloadOutlined, SearchOutlined, UndoOutlined, EyeOutlined, FileTextOutlined, InfoCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, SortAscendingOutlined, BarChartOutlined } from '@ant-design/icons';
import BackButton from '../../components/BackButton';
import dayjs from 'dayjs';
import LogDetailModal from './components/LogDetailModal';

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
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [clearLogsLoading, setClearLogsLoading] = useState(false);
    const [initLogsLoading, setInitLogsLoading] = useState(false);
    const { confirm } = Modal;
    const [user, setUser] = useState<User | null>(null);
    const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');

    // 操作类型选项
    const actionOptions = Object.values(LogAction);

    useEffect(() => {
        fetchUsers();
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (user?.id) {
            // 只在用户加载完成后执行一次
            logAction(LogAction.SYSTEM_SETTING, '访问系统设置页面', user.id);
        }
    }, [user?.id]);

    useEffect(() => {
        // 只在分页参数和用户加载完成后获取日志
        if (user?.id) {
            fetchLogs();
        }
    }, [pagination.page, pagination.limit]);

    const fetchLogs = async () => {
        if (!user?.id) {
            console.warn('未获取到用户信息，无法获取日志');
            return;
        }

        try {
            setLoading(true);
            console.log('开始获取日志，用户ID:', user.id, '用户角色:', user.role);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString()
            });

            // 添加筛选条件
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                queryParams.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
                queryParams.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
            }

            const url = `/api/logs?${queryParams.toString()}`;
            console.log('请求URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });

            console.log('API响应状态:', response.status, response.statusText);
            
            // 用更兼容的方式获取响应头
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            console.log('响应头:', headers);
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('用户未登录或会话已过期');
                    message.error('登录已过期，请重新登录');
                    router.push('/login');
                    return;
                }

                if (response.status === 403) {
                    console.error('用户无权限访问日志');
                    message.error('您没有权限访问系统日志');
                    return;
                }

                let errorMessage = '获取日志失败';
                try {
                    const errorData = await response.json();
                    console.error('API错误响应:', errorData);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('解析错误响应失败:', e);
                }
                throw new Error(errorMessage);
            }

            let data;
            try {
                const responseText = await response.text();
                console.log('原始响应文本:', responseText.substring(0, 1000) + (responseText.length > 1000 ? '...(截断)' : ''));
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('解析JSON响应失败:', parseError);
                throw new Error('服务器返回了无效的JSON数据');
            }
            
            console.log('日志数据:', data);
            // 添加防御性检查
            if (!data || typeof data !== 'object') {
                console.error('API返回的数据格式不正确:', data);
                message.error('获取日志失败: 服务器返回数据格式不正确');
                setLogs([]);
                setLoading(false);
                return;
            }
            
            setLogs(data.logs || []);
            setPagination({
                total: data.pagination?.total || 0,
                page: data.pagination?.page || 1,
                limit: data.pagination?.limit || 10,
                totalPages: data.pagination?.totalPages || 1
            });
        } catch (err: any) {
            console.error('加载日志数据失败:', err);
            message.error(`加载数据失败: ${err.message || '未知错误'}`);
            // 清空数据，避免显示错误数据
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('用户未登录');
                    return;
                }
                throw new Error('获取用户列表失败');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (err: any) {
            console.error('获取用户列表失败:', err);
            message.error('获取用户列表失败');
        }
    };

    // 获取当前登录用户信息
    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/users/current', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    message.error('请先登录');
                    router.push('/login');
                    return;
                }
                throw new Error('获取用户信息失败');
            }

            const data = await response.json();
            console.log('当前用户数据:', data);
            setUser(data.user);

            // 确保是管理员
            if (data.user.role !== 'ADMIN') {
                message.error('您没有权限访问此页面');
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('获取当前用户信息失败:', error);
            message.error('获取用户信息失败，请重新登录');
            router.push('/login');
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
        logAction(LogAction.SYSTEM_SETTING, '导出系统日志', user?.id);
        message.success('日志导出成功');
    };

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

    // 初始化示例日志
    const initializeLogs = async () => {
        try {
            setInitLogsLoading(true);
            const response = await fetch('/api/logs/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.error || '初始化日志失败');
            }

            const data = await response.json();
            message.success(`已初始化系统日志，创建了 ${data.createdCount} 条记录`);
            // 刷新日志列表
            fetchLogs();
        } catch (err: any) {
            message.error(err.message || '初始化日志失败');
        } finally {
            setInitLogsLoading(false);
        }
    };

    const getRoleName = (role: string) => {
        return role === 'ADMIN' ? '管理员' :
            role === 'TEACHER' ? '教师' : '学生';
    };

    const showLogDetail = (log: LogEntry) => {
        setSelectedLog(log);
        setDetailModalVisible(true);
        // 记录查看日志详情操作
        logAction(LogAction.SYSTEM_SETTING, `查看日志详情: ${log.id}`, user?.id);
    };

    const handleSort = (key: 'name' | 'recent') => {
        setSortOrder(key);
        // 实现排序逻辑
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
            render: (role: string) => (
                <Tag color={role === 'ADMIN' ? 'red' : role === 'TEACHER' ? 'green' : 'default'}>
                    {getRoleName(role)}
                </Tag>
            )
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            render: (text: string) => (
                <Tag color="blue">{text}</Tag>
            )
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true,
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
                        <Space>
                            <Button
                                onClick={initializeLogs}
                                loading={initLogsLoading}
                                icon={<FileTextOutlined />}
                            >
                                初始化示例日志
                            </Button>
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
                            <Dropdown
                                menu={{
                                    items: [
                                        { key: 'name', label: '按姓名排序' },
                                        { key: 'recent', label: '按最近活跃排序' }
                                    ],
                                    onClick: ({ key }) => handleSort(key as 'name' | 'recent')
                                }}
                            >
                                <Button icon={<SortAscendingOutlined />}>
                                    {sortOrder === 'name' ? '按姓名排序' : '按最近活跃排序'} <BarChartOutlined />
                                </Button>
                            </Dropdown>
                        </Space>
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

            {/* 日志详情Modal */}
            <LogDetailModal
                isOpen={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                log={selectedLog}
            />
        </div>
    );
} 