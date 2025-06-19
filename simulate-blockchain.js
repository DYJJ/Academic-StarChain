// simulate-blockchain.js
// 这个脚本用于模拟区块链上链操作，用于演示成绩上链流程
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 模拟合约地址
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

// 模拟区块链交易记录
class BlockchainSimulator {
    constructor() {
        this.transactions = [];
        this.gradeRecords = {};
        this.nextId = 1;
        this.dataFile = path.join(__dirname, 'simulated-blockchain-data.json');

        // 尝试加载已有数据
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.transactions = data.transactions || [];
                this.gradeRecords = data.gradeRecords || {};
                this.nextId = data.nextId || 1;
            }
        } catch (error) {
            console.error('加载模拟数据失败:', error.message);
        }
    }

    // 保存数据到文件
    saveData() {
        const data = {
            transactions: this.transactions,
            gradeRecords: this.gradeRecords,
            nextId: this.nextId
        };
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    }

    // 生成交易哈希
    generateTxHash() {
        return '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    }

    // 生成区块号
    generateBlockNumber() {
        return Math.floor(Math.random() * 10000) + 1;
    }

    // 生成区块链成绩ID (模拟bytes32)
    generateGradeId(studentId, courseId, semester) {
        return '0x' + Array.from({ length: 64 }).map(() =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    // 添加成绩到区块链(模拟)
    addGrade(gradeData) {
        // 生成模拟的区块链ID
        const blockchainGradeId = this.generateGradeId(
            gradeData.studentId,
            gradeData.courseId,
            gradeData.semester
        );

        // 存储成绩数据
        this.gradeRecords[blockchainGradeId] = {
            studentId: gradeData.studentId,
            courseId: gradeData.courseId,
            score: gradeData.score,
            semester: gradeData.semester,
            timestamp: Date.now(),
            teacherId: gradeData.teacherId,
            metadata: gradeData.metadata || '{}'
        };

        // 创建交易记录
        const txHash = this.generateTxHash();
        const blockNumber = this.generateBlockNumber();
        const transaction = {
            id: this.nextId++,
            transactionHash: txHash,
            blockNumber,
            gradeId: gradeData.id,
            studentId: gradeData.studentId,
            courseId: gradeData.courseId,
            teacherId: gradeData.teacherId,
            blockchainGradeId,
            blockTimestamp: new Date().toISOString(),
            status: 'CONFIRMED'
        };

        this.transactions.push(transaction);
        this.saveData();

        return {
            transactionHash: txHash,
            blockNumber,
            blockchainGradeId,
            databaseRecordId: transaction.id
        };
    }

    // 验证成绩(模拟)
    verifyGrade(blockchainGradeId) {
        const exists = !!this.gradeRecords[blockchainGradeId];

        return {
            exists,
            gradeData: exists ? this.gradeRecords[blockchainGradeId] : null
        };
    }
}

// 创建模拟器实例
const simulator = new BlockchainSimulator();

// 更新.env文件中的合约地址
function updateEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // 替换GRADE_CONTRACT_ADDRESS
        if (envContent.includes('GRADE_CONTRACT_ADDRESS=')) {
            envContent = envContent.replace(
                /GRADE_CONTRACT_ADDRESS=["']?[^"'\n]*["']?/,
                `GRADE_CONTRACT_ADDRESS="${CONTRACT_ADDRESS}"`
            );
        } else {
            // 如果没有这一行，添加它
            envContent += `\nGRADE_CONTRACT_ADDRESS="${CONTRACT_ADDRESS}"`;
        }

        // 写回文件
        fs.writeFileSync(envPath, envContent);
        console.log(`已更新.env文件中的合约地址为: ${CONTRACT_ADDRESS}`);
    } catch (error) {
        console.error('更新.env文件失败:', error);
    }
}

// 模拟部署合约
function simulateDeployment() {
    console.log('模拟部署智能合约...');
    console.log(`模拟合约地址: ${CONTRACT_ADDRESS}`);
    updateEnvFile();
}

// 模拟添加成绩
function simulateAddGrade() {
    // 模拟成绩数据
    const gradeData = {
        id: 'grade_' + Math.floor(Math.random() * 1000),
        studentId: 'student_' + Math.floor(Math.random() * 100),
        courseId: 'course_' + Math.floor(Math.random() * 50),
        score: Math.floor(Math.random() * 41) + 60, // 60-100分
        semester: '2023-2024-2',
        teacherId: 'teacher_' + Math.floor(Math.random() * 20),
        metadata: JSON.stringify({
            status: 'VERIFIED',
            createdAt: new Date().toISOString()
        })
    };

    console.log('模拟添加成绩到区块链...');
    console.log('成绩数据:', gradeData);

    const result = simulator.addGrade(gradeData);
    console.log('上链结果:', result);

    return result;
}

// 模拟验证成绩
function simulateVerifyGrade(blockchainGradeId) {
    console.log(`模拟验证成绩(ID: ${blockchainGradeId})...`);

    const result = simulator.verifyGrade(blockchainGradeId);
    console.log('验证结果:', result);

    return result;
}

// 运行模拟流程
function runSimulation() {
    console.log('===== 开始模拟区块链成绩上链流程 =====');

    // 步骤1: 部署合约
    console.log('\n步骤1: 部署智能合约');
    simulateDeployment();

    // 步骤2: 添加成绩
    console.log('\n步骤2: 添加成绩到区块链');
    const addResult = simulateAddGrade();

    // 步骤3: 验证成绩
    console.log('\n步骤3: 验证区块链上的成绩');
    simulateVerifyGrade(addResult.blockchainGradeId);

    console.log('\n===== 模拟区块链成绩上链流程完成 =====');
}

// 执行模拟
runSimulation(); 