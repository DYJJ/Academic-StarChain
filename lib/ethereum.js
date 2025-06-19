// 以太坊区块链服务
// 支持真实区块链连接和模拟模式
import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import prismaClient from './prisma';

// 获取Prisma客户端实例
const prisma = global.prisma || prismaClient;

// 合约ABI
import contractABIData from '../build/GradeRecord.json';
const contractABI = contractABIData.abi;

/**
 * @class EthereumService
 * @description 以太坊服务类，用于处理区块链操作
 */
class EthereumService {
    /**
     * 构造函数，初始化以太坊服务
     */
    constructor() {
        this.initialized = false;
        this.mockMode = process.env.FORCE_MOCK_MODE === 'true';
        this.rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8888';
        this.accountAddress = process.env.ETHEREUM_ACCOUNT;
        this.contractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
        this.gasLimit = process.env.ETHEREUM_GAS_LIMIT || 3000000;

        console.log(`初始化以太坊服务，模拟模式: ${this.mockMode ? '是' : '否'}`);
        if (!this.mockMode) {
            this.initWeb3();
        } else {
            console.log('运行在模拟模式，不会连接真实区块链');
        }
    }

    /**
     * 初始化Web3连接
     */
    initWeb3() {
        try {
            // 检查配置
            if (!this.rpcUrl) {
                console.error('错误: 缺少RPC URL配置');
                this.mockMode = true;
                return;
            }

            if (!this.accountAddress) {
                console.error('错误: 缺少账户地址配置');
                this.mockMode = true;
                return;
            }

            if (!this.contractAddress) {
                console.error('错误: 缺少合约地址配置');
                this.mockMode = true;
                return;
            }

            if (!contractABI) {
                console.error('错误: 无法加载合约ABI');
                this.mockMode = true;
                return;
            }

            // 创建Web3实例
            this.web3 = new Web3(new Web3.providers.HttpProvider(this.rpcUrl));
            console.log(`连接到以太坊节点: ${this.rpcUrl}`);

            // 设置默认账户
            this.web3.eth.defaultAccount = this.accountAddress;

            // 创建合约实例
            this.contract = new this.web3.eth.Contract(
                contractABI,
                this.contractAddress
            );

            console.log(`合约地址: ${this.contractAddress}`);
            this.initialized = true;

            // 测试连接
            this.checkConnection().then(connected => {
                if (connected) {
                    console.log('成功连接到以太坊网络');
                } else {
                    console.warn('无法连接到以太坊网络，将使用模拟模式');
                    this.mockMode = true;
                }
            });
        } catch (error) {
            console.error('初始化Web3失败:', error);
            this.mockMode = true;
        }
    }

    /**
     * 检查连接状态
     * @returns {Promise<boolean>} 连接状态
     */
    async checkConnection() {
        if (this.mockMode) {
            console.log('检查以太坊连接 (模拟模式)');
            return true;
        }

        try {
            const blockNumber = await this.web3.eth.getBlockNumber();
            console.log(`当前区块高度: ${blockNumber}`);
            return true;
        } catch (error) {
            console.error('检查区块链连接失败:', error);
            return false;
        }
    }

    /**
     * 检查是否连接到以太坊网络
     * @returns {Promise<boolean>} 是否已连接
     */
    async isConnected() {
        if (this.mockMode) return true;
        return this.web3.eth.net.isListening();
    }

    /**
     * 获取账户余额
     * @returns {Promise<string>} 账户余额
     */
    async getBalance() {
        if (this.mockMode) {
            console.log('获取账户余额 (模拟模式)');
            return '1000.0';
        }

        try {
            const balanceWei = await this.web3.eth.getBalance(this.accountAddress);
            const balanceEth = this.web3.utils.fromWei(balanceWei, 'ether');
            console.log(`账户 ${this.accountAddress} 余额: ${balanceEth} ETH`);
            return balanceEth;
        } catch (error) {
            console.error('获取余额失败:', error);
            return '0';
        }
    }

    /**
     * 添加成绩到区块链
     * @param {Object} gradeData 成绩数据
     * @returns {Promise<Object>} 成功则返回交易信息
     */
    async addGrade(gradeData) {
        console.log('添加成绩到区块链:', gradeData);

        // 验证必须的数据字段
        if (!gradeData.studentId || !gradeData.courseId || gradeData.score === undefined) {
            throw new Error('缺少必要的成绩数据字段');
        }

        // 处理模拟模式
        if (this.mockMode) {
            console.log('添加成绩到区块链 (模拟模式):', gradeData);

            // 模拟2秒的处理时间
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 生成模拟的交易数据
            const blockchainGradeId = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            const transactionHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

            // 如果有Prisma客户端，记录模拟交易
            if (prisma) {
                try {
                    await prisma.blockchainTransaction.create({
                        data: {
                            transactionHash,
                            blockNumber: Math.floor(Math.random() * 10000000) + 1,
                            gradeId: gradeData.id,
                            studentId: gradeData.studentId,
                            courseId: gradeData.courseId,
                            teacherId: gradeData.teacherId,
                            blockchainData: JSON.stringify({
                                blockchainGradeId,
                                gradeData
                            }),
                            blockTimestamp: new Date()
                        }
                    });
                } catch (error) {
                    console.error('记录模拟交易失败:', error);
                }
            }

            return {
                success: true,
                mockMode: true,
                blockchainGradeId,
                transactionHash,
                blockNumber: Math.floor(Math.random() * 10000000) + 1,
                message: '在模拟模式下成功记录成绩'
            };
        }

        // 真实区块链模式
        if (!this.initialized) {
            throw new Error('以太坊服务未初始化');
        }

        try {
            // 准备参数
            const params = [
                gradeData.studentId,
                gradeData.courseId,
                gradeData.score,
                gradeData.semester || '',
                gradeData.teacherId || '',
                gradeData.metadata || ''
            ];

            console.log('调用合约方法 addGrade，参数:', params);

            // 调用合约方法
            const gasEstimate = await this.contract.methods.addGrade(...params).estimateGas({
                from: this.accountAddress,
                gas: this.gasLimit
            });

            console.log(`预估Gas消耗: ${gasEstimate}`);

            const receipt = await this.contract.methods.addGrade(...params).send({
                from: this.accountAddress,
                gas: Math.min(gasEstimate * 1.2, this.gasLimit)
            });

            console.log('交易成功:', receipt);

            // 从事件中获取成绩ID
            let blockchainGradeId = null;
            if (receipt.events && receipt.events.GradeAdded) {
                blockchainGradeId = receipt.events.GradeAdded.returnValues.gradeId;
                console.log('区块链成绩ID:', blockchainGradeId);
            } else {
                console.warn('无法从事件中获取成绩ID');
            }

            return {
                success: true,
                mockMode: false,
                blockchainGradeId,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                events: receipt.events,
                message: '成功将成绩记录到区块链'
            };
        } catch (error) {
            console.error('添加成绩到区块链失败:', error);

            // 检查是否为MCOPY操作码错误
            if (error.message && error.message.includes('invalid opcode: MCOPY')) {
                console.warn('检测到不兼容的EVM操作码，自动切换到模拟模式');

                // 临时启用模拟模式
                this.mockMode = true;

                // 记录系统日志
                if (prisma) {
                    try {
                        await prisma.systemLog.create({
                            data: {
                                userId: gradeData.teacherId || 'system',
                                action: 'BLOCKCHAIN_ERROR',
                                details: `区块链兼容性错误: ${error.message}。系统已临时切换到模拟模式。`,
                                ipAddress: 'localhost'
                            }
                        });
                    } catch (logError) {
                        console.error('记录系统日志失败:', logError);
                    }
                }

                // 递归调用自身，使用模拟模式处理
                return this.addGrade(gradeData);
            }

            throw error;
        }
    }

    /**
     * 验证成绩是否存在于区块链上
     * @param {string} gradeId 成绩ID或交易哈希
     * @returns {Promise<Object>} 验证结果
     */
    async verifyGrade(gradeId) {
        console.log(`验证成绩ID或交易哈希: ${gradeId}`);

        if (this.mockMode) {
            console.log(`验证成绩 (模拟模式): ${gradeId}`);

            // 模拟1秒的处理时间
            await new Promise(resolve => setTimeout(resolve, 500));

            // 检查数据库中的记录 - 优化查询
            if (prisma) {
                try {
                    // 先尝试按交易哈希查询
                    let transaction = await prisma.blockchainTransaction.findFirst({
                        where: {
                            transactionHash: gradeId
                        }
                    });

                    // 如果未找到，则检查是否为区块链成绩ID或普通成绩ID
                    if (!transaction) {
                        transaction = await prisma.blockchainTransaction.findFirst({
                            where: {
                                OR: [
                                    { blockchainData: { contains: gradeId } },
                                    { gradeId: gradeId }
                                ]
                            }
                        });
                    }

                    if (transaction) {
                        let blockchainData = {};
                        try {
                            blockchainData = JSON.parse(transaction.blockchainData || '{}');
                        } catch (e) {
                            console.error('解析区块链数据失败:', e);
                            blockchainData = {};
                        }

                        // 查询关联的成绩详情
                        const grade = await prisma.grade.findUnique({
                            where: { id: transaction.gradeId },
                            include: {
                                student: true,
                                course: true,
                                teacher: true
                            }
                        }).catch(e => null);

                        // 构建更完整的响应
                        return {
                            exists: true,
                            transactionHash: transaction.transactionHash,
                            blockNumber: transaction.blockNumber,
                            blockTimestamp: transaction.blockTimestamp,
                            blockchainGradeId: blockchainData.blockchainGradeId || null,
                            data: grade ? {
                                studentId: grade.studentId,
                                studentName: grade.student?.name || '未知学生',
                                courseId: grade.courseId,
                                courseName: grade.course?.name || '未知课程',
                                score: grade.score,
                                semester: grade.course?.semester || '',
                                timestamp: transaction.blockTimestamp.toISOString(),
                                teacherId: grade.teacherId,
                                teacherName: grade.teacher?.name || '未知教师',
                                metadata: JSON.stringify({
                                    recordTime: transaction.createdAt.toISOString(),
                                    verifiedAt: new Date().toISOString()
                                })
                            } : blockchainData.gradeData || {
                                studentId: transaction.studentId,
                                courseId: transaction.courseId,
                                score: 0,
                                timestamp: transaction.blockTimestamp.toISOString()
                            },
                            error: null
                        };
                    }
                } catch (error) {
                    console.error('查询区块链交易记录失败:', error);
                }
            }

            // 如果没有找到记录或查询失败，返回验证失败结果
            return {
                exists: false,
                data: null,
                error: "未找到匹配的区块链交易记录"
            };
        }

        // 真实区块链模式
        if (!this.initialized) {
            throw new Error('以太坊服务未初始化');
        }

        try {
            // 首先检查是否为交易哈希格式
            let blockchainGradeId = gradeId;
            let transactionInfo = null;

            // 如果输入的是交易哈希（以太坊交易哈希为0x开头的66位十六进制）
            if (gradeId.startsWith('0x') && gradeId.length === 66 && /^0x[0-9a-fA-F]{64}$/.test(gradeId)) {
                try {
                    // 尝试获取交易收据
                    const receipt = await this.web3.eth.getTransactionReceipt(gradeId);
                    if (receipt && receipt.logs && receipt.logs.length > 0) {
                        // 尝试从日志中解析成绩ID
                        for (const log of receipt.logs) {
                            if (log.topics[0] === '0x71e71a8458267085d5ab16980fd5f114d2d37f232479c245d523ce8d23ca40ed') {
                                blockchainGradeId = log.topics[1];
                                transactionInfo = {
                                    transactionHash: receipt.transactionHash,
                                    blockNumber: receipt.blockNumber
                                };
                                break;
                            }
                        }
                    }
                } catch (txError) {
                    console.warn('获取交易信息失败:', txError);
                    // 继续使用原始ID尝试验证
                }
            }

            // 检查成绩是否存在
            const exists = await this.contract.methods.verifyGrade(blockchainGradeId).call();

            if (!exists) {
                return {
                    exists: false,
                    data: null,
                    error: null
                };
            }

            // 获取成绩详情
            const gradeData = await this.contract.methods.getGrade(blockchainGradeId).call();

            // 如果交易信息不存在，从区块链获取区块信息
            if (!transactionInfo) {
                try {
                    const blockNumber = await this.web3.eth.getBlockNumber();
                    transactionInfo = {
                        blockNumber: blockNumber,
                        transactionHash: gradeId
                    };
                } catch (error) {
                    console.warn('获取区块信息失败:', error);
                }
            }

            return {
                exists: true,
                blockchainGradeId: blockchainGradeId,
                transactionHash: transactionInfo?.transactionHash || null,
                blockNumber: transactionInfo?.blockNumber || 0,
                data: {
                    studentId: gradeData.studentId,
                    courseId: gradeData.courseId,
                    score: parseInt(gradeData.score),
                    semester: gradeData.semester,
                    timestamp: new Date(parseInt(gradeData.timestamp) * 1000).toISOString(),
                    teacherId: gradeData.teacherId,
                    metadata: gradeData.metadata
                },
                error: null
            };
        } catch (error) {
            console.error('验证成绩失败:', error);

            // 检查是否为MCOPY操作码错误
            if (error.message && error.message.includes('invalid opcode: MCOPY')) {
                console.warn('验证时检测到不兼容的EVM操作码，自动切换到模拟模式');

                // 临时启用模拟模式
                this.mockMode = true;

                // 记录系统日志
                if (prisma) {
                    try {
                        await prisma.systemLog.create({
                            data: {
                                userId: 'system',
                                action: 'BLOCKCHAIN_VERIFY_ERROR',
                                details: `区块链验证兼容性错误: ${error.message}。系统已临时切换到模拟模式。`,
                                ipAddress: 'localhost'
                            }
                        });
                    } catch (logError) {
                        console.error('记录系统日志失败:', logError);
                    }
                }

                // 递归调用自身，使用模拟模式处理
                return this.verifyGrade(gradeId);
            }

            // 尝试从数据库获取信息作为后备方案
            if (prisma) {
                try {
                    const transaction = await prisma.blockchainTransaction.findFirst({
                        where: {
                            OR: [
                                { transactionHash: gradeId },
                                { blockchainData: { contains: gradeId } },
                                { gradeId: gradeId }
                            ]
                        }
                    });

                    if (transaction) {
                        let blockchainData = {};
                        try {
                            blockchainData = JSON.parse(transaction.blockchainData || '{}');
                        } catch (e) {
                            blockchainData = {};
                        }

                        return {
                            exists: true,
                            transactionHash: transaction.transactionHash,
                            blockNumber: transaction.blockNumber,
                            blockTimestamp: transaction.blockTimestamp,
                            data: blockchainData.gradeData || {
                                studentId: transaction.studentId,
                                courseId: transaction.courseId,
                                score: 0,
                                timestamp: transaction.blockTimestamp.toISOString()
                            },
                            error: null
                        };
                    }
                } catch (dbError) {
                    console.error('数据库查询失败:', dbError);
                }
            }

            return {
                exists: false,
                data: null,
                error: error.message
            };
        }
    }

    /**
     * 获取学生的所有成绩ID
     * @param {string} studentId 学生ID
     * @returns {Promise<Array>} 成绩ID数组
     */
    async getStudentGradeIds(studentId) {
        console.log(`获取学生的所有成绩ID: ${studentId}`);

        if (this.mockMode) {
            console.log(`获取学生的所有区块链成绩ID (模拟模式): ${studentId}`);

            // 模拟1秒的处理时间
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 在模拟模式下，尝试从数据库获取真实记录
            if (prisma) {
                try {
                    const transactions = await prisma.blockchainTransaction.findMany({
                        where: {
                            studentId: studentId,
                            status: {
                                in: ['RECORDED', 'VERIFIED']
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    });

                    if (transactions && transactions.length > 0) {
                        return transactions.map(tx => {
                            try {
                                const data = JSON.parse(tx.blockchainData || '{}');
                                return data.blockchainGradeId || tx.transactionHash;
                            } catch (e) {
                                return tx.transactionHash;
                            }
                        });
                    }
                } catch (error) {
                    console.error('从数据库获取学生成绩记录失败:', error);
                }
            }

            // 如果没有找到记录或查询失败，返回随机结果
            const count = Math.floor(Math.random() * 5) + 1;
            const ids = [];

            for (let i = 0; i < count; i++) {
                ids.push('0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
            }

            return ids;
        }

        // 真实区块链模式
        if (!this.initialized) {
            throw new Error('以太坊服务未初始化');
        }

        try {
            const gradeIds = await this.contract.methods.getStudentGradeIds(studentId).call();
            console.log(`获取到${gradeIds.length}条成绩记录`);
            return gradeIds;
        } catch (error) {
            console.error('获取学生成绩ID失败:', error);

            // 检查是否为MCOPY操作码错误
            if (error.message && error.message.includes('invalid opcode: MCOPY')) {
                console.warn('获取记录时检测到不兼容的EVM操作码，自动切换到模拟模式');

                // 临时启用模拟模式
                this.mockMode = true;

                // 记录系统日志
                if (prisma) {
                    try {
                        await prisma.systemLog.create({
                            data: {
                                userId: 'system',
                                action: 'BLOCKCHAIN_GET_RECORDS_ERROR',
                                details: `获取区块链记录兼容性错误: ${error.message}。系统已临时切换到模拟模式。`,
                                ipAddress: 'localhost'
                            }
                        });
                    } catch (logError) {
                        console.error('记录系统日志失败:', logError);
                    }
                }

                // 递归调用自身，使用模拟模式处理
                return this.getStudentGradeIds(studentId);
            }

            throw error;
        }
    }

    /**
     * 重新加载配置
     */
    reloadConfig() {
        console.log('重新加载以太坊配置...');

        // 重新读取环境变量
        this.mockMode = process.env.FORCE_MOCK_MODE === 'true';
        this.rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8888';
        this.accountAddress = process.env.ETHEREUM_ACCOUNT;
        this.contractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
        this.gasLimit = process.env.ETHEREUM_GAS_LIMIT || 3000000;

        console.log(`更新配置: 模拟模式=${this.mockMode}, RPC=${this.rpcUrl}, 合约=${this.contractAddress}`);

        // 如果不是模拟模式，重新初始化Web3
        if (!this.mockMode) {
            this.initialized = false;
            this.initWeb3();
        }

        return {
            mockMode: this.mockMode,
            rpcUrl: this.rpcUrl,
            accountAddress: this.accountAddress,
            contractAddress: this.contractAddress,
            initialized: this.initialized
        };
    }
}

// 创建单例实例
const ethereumService = new EthereumService();

// 默认导出
export default ethereumService;

// 命名导出
export { EthereumService }; 