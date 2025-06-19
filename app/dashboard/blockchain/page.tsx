'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Alert, Descriptions, Space, Spin, message, Typography, Divider, Switch } from 'antd';
import DashboardLayout from '@/app/components/DashboardLayout';
import axios from 'axios';

const { Title, Text } = Typography;

const BlockchainSettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
    const [mockMode, setMockMode] = useState<boolean | null>(null);
    const [reloadLoading, setReloadLoading] = useState(false);
    const [compatibilityError, setCompatibilityError] = useState<string | null>(null);
    const [forceMode, setForceMode] = useState(false);

    const checkConnectionStatus = async () => {
        setLoading(true);
        setCompatibilityError(null);
        try {
            const response = await axios.get('/api/blockchain/status');
            if (response.data.success) {
                setConnectionStatus(response.data.connected);
                setMockMode(response.data.mockMode);

                // 检查是否因为兼容性错误自动切换了模式
                if (response.data.compatibilityError) {
                    setCompatibilityError(response.data.compatibilityError);
                }
            } else {
                message.error('获取区块链状态失败');
            }
        } catch (error) {
            console.error('获取区块链状态出错:', error);
            message.error('获取区块链状态出错');
        } finally {
            setLoading(false);
        }
    };

    const reloadConfig = async () => {
        setReloadLoading(true);
        setCompatibilityError(null);
        try {
            const response = await axios.post('/api/config/reload', {
                forceMockMode: forceMode
            });
            if (response.data.success) {
                setConnectionStatus(response.data.connected);
                setMockMode(response.data.mockMode);
                message.success('区块链配置已重新加载');

                // 检查是否因为兼容性错误自动切换了模式
                if (response.data.compatibilityError) {
                    setCompatibilityError(response.data.compatibilityError);
                }
            } else {
                message.error(response.data.message || '重新加载配置失败');
            }
        } catch (error) {
            console.error('重新加载配置出错:', error);
            message.error('重新加载配置出错');
        } finally {
            setReloadLoading(false);
        }
    };

    useEffect(() => {
        checkConnectionStatus();
    }, []);

    return (
        <DashboardLayout>
            <div style={{ padding: '24px' }}>
                <Title level={2}>区块链设置</Title>
                <Divider />

                {compatibilityError && (
                    <Alert
                        style={{ marginBottom: '24px' }}
                        type="warning"
                        showIcon
                        message="区块链兼容性问题"
                        description={`检测到区块链兼容性问题: ${compatibilityError}。系统已自动切换到模拟模式，您可以继续使用系统的所有功能。`}
                    />
                )}

                <Card title="区块链连接状态" style={{ marginBottom: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin size="large" />
                            <p>正在获取连接状态...</p>
                        </div>
                    ) : (
                        <>
                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="连接状态">
                                    {connectionStatus === null ? (
                                        '未知'
                                    ) : connectionStatus ? (
                                        <Text type="success">已连接</Text>
                                    ) : (
                                        <Text type="danger">未连接</Text>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="模拟模式">
                                    {mockMode === null ? (
                                        '未知'
                                    ) : (
                                        <Switch
                                            checked={mockMode}
                                            disabled
                                            checkedChildren="开启"
                                            unCheckedChildren="关闭"
                                        />
                                    )}
                                </Descriptions.Item>
                            </Descriptions>

                            <div style={{ marginTop: '16px' }}>
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={checkConnectionStatus}
                                        loading={loading}
                                    >
                                        刷新状态
                                    </Button>
                                </Space>
                            </div>

                            {mockMode && (
                                <Alert
                                    style={{ marginTop: '16px' }}
                                    type="warning"
                                    showIcon
                                    message="模拟模式已启用"
                                    description="系统当前运行在模拟模式下，所有区块链操作将被模拟而不会真正写入区块链。请检查您的环境配置。"
                                />
                            )}

                            {!connectionStatus && !mockMode && (
                                <Alert
                                    style={{ marginTop: '16px' }}
                                    type="error"
                                    showIcon
                                    message="区块链连接失败"
                                    description="无法连接到区块链网络，请检查您的网络连接和配置。"
                                />
                            )}
                        </>
                    )}
                </Card>

                <Card title="区块链配置管理">
                    <p>您可以重新加载区块链配置，系统将重新读取环境变量并尝试连接区块链。</p>

                    <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
                        <div>
                            <Switch
                                checked={forceMode}
                                onChange={(checked) => setForceMode(checked)}
                                checkedChildren="强制模拟模式"
                                unCheckedChildren="标准模式"
                                style={{ marginRight: '8px' }}
                            />
                            <Text type="secondary">
                                {forceMode ? '将强制使用模拟模式，不连接真实区块链' : '尝试连接真实区块链，如有兼容性问题会自动切换'}
                            </Text>
                        </div>
                    </Space>

                    <Button
                        type="primary"
                        danger
                        loading={reloadLoading}
                        onClick={reloadConfig}
                    >
                        重新加载区块链配置
                    </Button>
                </Card>

                <Card title="区块链兼容性说明" style={{ marginTop: '24px' }}>
                    <p>如果您看到"invalid opcode: MCOPY"错误，这是因为当前以太坊节点不支持较新版本Solidity编译的合约。这是一个常见的兼容性问题，有以下解决方案：</p>
                    <ul>
                        <li>使用模拟模式继续使用系统功能（推荐）</li>
                        <li>更新以太坊节点版本</li>
                        <li>使用较低版本的Solidity重新编译合约</li>
                    </ul>
                    <p>在模拟模式下，系统将模拟区块链操作，保持所有功能正常运行。</p>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default BlockchainSettingsPage; 