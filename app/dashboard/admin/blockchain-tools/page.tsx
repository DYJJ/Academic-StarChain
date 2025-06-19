'use client';

import { useState, useEffect } from 'react';
import {
    Card, Button, Typography, Space, Divider, message,
    Table, Switch, Input, Form, Spin, Descriptions
} from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface BlockchainStatus {
    connected: boolean;
    balance: string;
    config: {
        mockMode: boolean;
        rpcUrl: string;
        contractAddress: string;
        accountAddress: string;
    }
}

export default function BlockchainTools() {
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<BlockchainStatus | null>(null);
    const [reloading, setReloading] = useState<boolean>(false);

    // 获取区块链状态
    const fetchStatus = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/blockchain/status');
            if (response.data.success) {
                setStatus(response.data);
            } else {
                message.error(response.data.message || '获取区块链状态失败');
            }
        } catch (error) {
            console.error('获取区块链状态出错:', error);
            message.error('获取区块链状态时发生错误');
        } finally {
            setLoading(false);
        }
    };

    // 重新加载配置
    const handleReload = async () => {
        setReloading(true);
        try {
            const response = await axios.post('/api/config/reload');
            if (response.data.success) {
                message.success('区块链配置已重新加载');
                fetchStatus(); // 重新获取状态
            } else {
                message.error(response.data.message || '重新加载配置失败');
            }
        } catch (error) {
            console.error('重新加载配置出错:', error);
            message.error('重新加载配置时发生错误');
        } finally {
            setReloading(false);
        }
    };

    // 页面加载时获取状态
    useEffect(() => {
        fetchStatus();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <Title level={2}>区块链管理工具</Title>
                    <Space>
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={fetchStatus}
                            loading={loading}
                        >
                            刷新状态
                        </Button>
                        <Button
                            onClick={handleReload}
                            loading={reloading}
                            icon={<ReloadOutlined />}
                        >
                            重新加载配置
                        </Button>
                    </Space>
                </div>

                <Spin spinning={loading}>
                    {status ? (
                        <>
                            <Card title="区块链连接状态" bordered={false}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                    <Text strong style={{ marginRight: '8px' }}>连接状态:</Text>
                                    {status.connected ? (
                                        <Text type="success"><CheckCircleOutlined /> 已连接</Text>
                                    ) : (
                                        <Text type="danger"><CloseCircleOutlined /> 未连接</Text>
                                    )}
                                </div>

                                <Descriptions bordered column={1}>
                                    <Descriptions.Item label="模拟模式">
                                        {status.config.mockMode ? '开启' : '关闭'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="RPC URL">
                                        {status.config.rpcUrl || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="合约地址">
                                        {status.config.contractAddress || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="账户地址">
                                        {status.config.accountAddress || 'N/A'}
                                    </Descriptions.Item>
                                    {status.connected && (
                                        <Descriptions.Item label="账户余额">
                                            {status.balance || 'N/A'}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>

                            <Divider />

                            <Card title="环境变量说明" bordered={false}>
                                <ul>
                                    <li><Text strong>FORCE_MOCK_MODE</Text> - 设置为true强制使用模拟模式，false使用真实区块链</li>
                                    <li><Text strong>ETH_RPC_URL</Text> - 区块链节点RPC URL（例如：http://localhost:8888）</li>
                                    <li><Text strong>ETH_CONTRACT_ADDRESS</Text> - 已部署的成绩记录合约地址</li>
                                    <li><Text strong>ETH_ACCOUNT_ADDRESS</Text> - 用于交易的以太坊账户地址</li>
                                </ul>
                                <Text type="secondary">注意：修改环境变量后需要重新启动应用或使用"重新加载配置"按钮</Text>
                            </Card>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Text type="secondary">加载区块链状态中...</Text>
                        </div>
                    )}
                </Spin>
            </Card>
        </div>
    );
} 