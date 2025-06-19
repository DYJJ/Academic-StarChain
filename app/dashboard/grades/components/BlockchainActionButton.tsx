import React, { useState } from 'react';
import { Button, Tooltip, Modal, message, Descriptions, Spin, Tag, Typography, Card, Space, Divider } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import BlockchainIcon from '../../../components/icons/BlockchainIcon';

const { Title, Text, Paragraph } = Typography;

interface BlockchainActionButtonProps {
    gradeId: string;
    studentName: string;
    courseName: string;
    score: number;
}

const BlockchainActionButton: React.FC<BlockchainActionButtonProps> = ({
    gradeId,
    studentName,
    courseName,
    score
}) => {
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [blockchainData, setBlockchainData] = useState<any>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 上链操作
    const handleAddToBlockchain = async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch('/api/grades/blockchain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gradeId }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    // 已经上链的情况
                    setTransactionHash(data.transactionInfo?.transactionHash || null);
                    message.info('该成绩已经上链，可以直接验证');
                    setModalVisible(true);
                } else {
                    throw new Error(data.error || '上链失败');
                }
            } else {
                setBlockchainData(data);
                setTransactionHash(data.transactionHash);
                message.success('成绩已成功上链');
                setModalVisible(true);
            }
        } catch (error: any) {
            console.error('上链失败:', error);
            setErrorMessage(error.message || '上链失败，请稍后重试');
            message.error(`上链失败: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 验证区块链上的成绩
    const handleVerifyBlockchain = async () => {
        if (!transactionHash) {
            return;
        }

        try {
            setVerifying(true);
            setErrorMessage(null);

            const response = await fetch(`/api/grades/blockchain/verify?txHash=${transactionHash}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '验证失败');
            }

            setVerificationResult(data);
            message.success(data.verified ? '验证成功，数据存在于区块链上' : '验证失败，未找到数据');
        } catch (error: any) {
            console.error('验证失败:', error);
            setErrorMessage(error.message || '验证失败，请稍后重试');
            message.error(`验证失败: ${error.message}`);
        } finally {
            setVerifying(false);
        }
    };

    const formatDatetime = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            return dateString || '未知时间';
        }
    };

    return (
        <>
            <Tooltip title="将成绩添加到区块链">
                <Button
                    type="primary"
                    icon={<BlockchainIcon />}
                    onClick={handleAddToBlockchain}
                    loading={loading}
                    ghost
                >
                    上链
                </Button>
            </Tooltip>

            <Modal
                title="区块链操作"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        关闭
                    </Button>,
                    <Button
                        key="verify"
                        type="primary"
                        loading={verifying}
                        onClick={handleVerifyBlockchain}
                        disabled={!transactionHash}
                    >
                        验证上链数据
                    </Button>
                ]}
                width={800}
            >
                {errorMessage && (
                    <div style={{ marginBottom: 16, color: 'red' }}>
                        <Text type="danger">{errorMessage}</Text>
                    </div>
                )}

                {(blockchainData || transactionHash) && !verificationResult && (
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">交易哈希: </Text>
                        <Text copyable>{blockchainData?.transactionHash || transactionHash}</Text>
                        <br />
                        <Text type="secondary">点击"验证上链数据"按钮查看详细信息</Text>
                    </div>
                )}

                {verificationResult && (
                    <Card style={{ marginTop: 16 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Tag color={verificationResult.verified ? 'success' : 'error'} icon={verificationResult.verified ? <CheckCircleOutlined /> : null}>
                                    {verificationResult.verified ? '验证成功，数据存在于区块链上！' : '验证失败'}
                                </Tag>
                                {verificationResult.message && (
                                    <Text type="secondary" style={{ marginLeft: 8 }}>{verificationResult.message}</Text>
                                )}
                            </div>

                            {verificationResult.verified && (
                                <>
                                    {verificationResult.databaseRecord && (
                                        <Descriptions bordered column={1} size="small" style={{ marginTop: 16 }}>
                                            <Descriptions.Item label="交易哈希">
                                                <Text copyable>{verificationResult.databaseRecord.transactionHash}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="区块号">
                                                {verificationResult.databaseRecord.blockNumber}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="记录时间">
                                                {formatDatetime(verificationResult.databaseRecord.timestamp)}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    )}

                                    {verificationResult.blockchainData && (
                                        <Descriptions bordered column={1} size="small" style={{ marginTop: 16 }}>
                                            <Descriptions.Item label="学生">
                                                {verificationResult.blockchainData.studentName || verificationResult.databaseRecord?.grade?.student?.name || verificationResult.blockchainData.studentId || '未知学生'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="课程">
                                                {verificationResult.blockchainData.courseName || verificationResult.databaseRecord?.grade?.course?.name || verificationResult.blockchainData.courseId || '未知课程'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="成绩">
                                                <Text strong>{verificationResult.blockchainData.score || verificationResult.databaseRecord?.grade?.score}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="学期">
                                                {verificationResult.blockchainData.semester || verificationResult.databaseRecord?.grade?.course?.semester || '未知学期'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="教师">
                                                {verificationResult.blockchainData.teacherName || verificationResult.databaseRecord?.grade?.teacher?.name || verificationResult.blockchainData.teacherId || '未知教师'}
                                            </Descriptions.Item>
                                            {/* <Descriptions.Item label="记录时间">
                                                {formatDatetime(verificationResult.blockchainData.timestamp)}
                                            </Descriptions.Item> */}
                                        </Descriptions>
                                    )}
                                </>
                            )}
                        </Space>
                    </Card>
                )}

                {(loading || verifying) && (
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                        <p>{loading ? '正在上链...' : '正在验证...'}</p>
                    </div>
                )}

                <div style={{ marginTop: 20 }}>
                    <Text type="secondary">
                        <LinkOutlined style={{ marginRight: 8 }} />
                        区块链记录不可篡改，上链后的成绩数据将永久保存在区块链上
                    </Text>
                </div>
            </Modal>
        </>
    );
};

export default BlockchainActionButton; 