import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Typography, Divider, Tag, Space, Card, Spin, message } from 'antd';

const { Title, Text, Paragraph } = Typography;

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

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: LogEntry | null;
}

const getRoleName = (role: string) => {
    return role === 'ADMIN' ? '管理员' :
        role === 'TEACHER' ? '教师' : '学生';
};

const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, log }) => {
    const [loading, setLoading] = useState(false);
    const [detailedLog, setDetailedLog] = useState<LogEntry | null>(null);

    useEffect(() => {
        if (isOpen && log?.id) {
            fetchLogDetail(log.id);
        } else {
            setDetailedLog(log);
        }
    }, [isOpen, log]);

    const fetchLogDetail = async (logId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/logs/${logId}`);
            if (!response.ok) {
                throw new Error('获取日志详情失败');
            }
            const data = await response.json();
            setDetailedLog(data.log);
        } catch (error) {
            console.error('获取日志详情错误:', error);
            message.error('无法加载详细日志信息');
            // 如果API调用失败，回退到传入的日志数据
            setDetailedLog(log);
        } finally {
            setLoading(false);
        }
    };

    if (!detailedLog) return null;

    const logToDisplay = detailedLog || log;

    return (
        <Modal
            title={
                <Space>
                    <Title level={5} style={{ margin: 0 }}>操作日志详情</Title>
                    <Tag color="blue">{logToDisplay?.action}</Tag>
                </Space>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Spin size="large" tip="加载日志详情..." />
                </div>
            ) : (
                <Card bordered={false}>
                    <Descriptions bordered column={1} size="middle">
                        <Descriptions.Item label="操作ID">
                            <Text copyable>{logToDisplay.id}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="操作类型">
                            <Tag color="blue">{logToDisplay.action}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="操作时间">
                            {new Date(logToDisplay.createdAt).toLocaleString('zh-CN')}
                        </Descriptions.Item>
                        <Descriptions.Item label="操作用户">
                            <Space direction="vertical" size={0}>
                                <Text strong>{logToDisplay.user.name}</Text>
                                <Text type="secondary">{logToDisplay.user.email}</Text>
                                <Tag color={logToDisplay.user.role === 'ADMIN' ? 'red' : logToDisplay.user.role === 'TEACHER' ? 'green' : 'default'}>
                                    {getRoleName(logToDisplay.user.role)}
                                </Tag>
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="操作详情">
                            <div style={{
                                backgroundColor: '#f5f5f5',
                                padding: '12px',
                                borderRadius: '4px',
                                maxHeight: '150px',
                                overflowY: 'auto'
                            }}>
                                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {logToDisplay.details || '无详细信息'}
                                </Paragraph>
                            </div>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </Modal>
    );
};

export default LogDetailModal; 