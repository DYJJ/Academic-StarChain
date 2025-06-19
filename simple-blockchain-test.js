// 简化版区块链测试脚本
require('dotenv').config();
const Web3 = require('web3');

// 学生成绩数据
const testGrade = {
  studentId: "student_123",
  courseId: "course_456",
  score: 85,
  semester: "2023-2024-2",
  teacherId: "teacher_789",
  metadata: JSON.stringify({
    status: "VERIFIED",
    timestamp: new Date().toISOString()
  })
};

// 模拟区块链交易
function simulateBlockchainTransaction(gradeData) {
  // 生成模拟的交易哈希和区块链ID
  const generateRandomHex = (length) => 
    '0x' + Array.from({ length }).map(() => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  
  const transactionHash = generateRandomHex(64);
  const blockchainGradeId = generateRandomHex(64);
  
  console.log(`模拟上链成功: ${transactionHash}`);
  
  // 返回模拟结果
  return {
    success: true,
    mockMode: true,
    blockchainGradeId,
    transactionHash,
    blockNumber: Math.floor(Math.random() * 10000000) + 1,
    message: '在模拟模式下成功记录成绩'
  };
}

// 检查区块链连接
async function checkBlockchainConnection() {
  try {
    // 创建Web3实例
    const web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    // 尝试连接
    const isConnected = await web3.eth.net.isListening();
    console.log(`区块链连接状态: ${isConnected ? '已连接' : '未连接'}`);
    
    if (isConnected) {
      // 读取区块高度
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`当前区块高度: ${blockNumber}`);
      
      // 读取账户余额
      const balance = await web3.eth.getBalance(process.env.ETHEREUM_ACCOUNT);
      console.log(`账户余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);
    }
    
    return isConnected;
  } catch (error) {
    console.error('连接区块链失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  try {
    console.log('===== 学生成绩上链测试 =====');
    
    // 检查环境配置
    console.log('\n系统配置:');
    console.log(`模拟模式: ${process.env.FORCE_MOCK_MODE === 'true' ? '已启用' : '未启用'}`);
    console.log(`RPC URL: ${process.env.ETHEREUM_RPC_URL}`);
    console.log(`账户地址: ${process.env.ETHEREUM_ACCOUNT}`);
    console.log(`合约地址: ${process.env.GRADE_CONTRACT_ADDRESS}`);
    
    // 检查连接
    console.log('\n区块链连接:');
    const connected = await checkBlockchainConnection();
    
    // 测试成绩数据
    console.log('\n测试成绩数据:');
    console.log(testGrade);
    
    // 上链操作
    console.log('\n执行上链操作:');
    const result = simulateBlockchainTransaction(testGrade);
    console.log('上链结果:', result);
    
    // 验证过程
    console.log('\n验证上链结果:');
    console.log(`交易哈希: ${result.transactionHash}`);
    console.log(`区块号: ${result.blockNumber}`);
    console.log(`区块链成绩ID: ${result.blockchainGradeId}`);
    
    console.log('\n===== 测试完成 =====');
    console.log('\n在实际系统中，上链过程会被记录到BlockchainTransaction表，');
    console.log('并且成绩状态会更新为VERIFIED。');
    
    if (process.env.FORCE_MOCK_MODE === 'true') {
      console.log('\n注意: 当前运行在模拟模式下，没有与真实区块链交互。');
      console.log('若要使用真实区块链，请设置FORCE_MOCK_MODE="false"并部署合约。');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 执行主函数
main(); 