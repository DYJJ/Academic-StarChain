// 真实区块链测试脚本
require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// 学生成绩数据
const testGrade = {
  id: 'grade_' + Date.now(),
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

// 主函数
async function main() {
  try {
    console.log('===== 真实区块链学生成绩上链测试 =====');
    
    // 检查配置
    console.log('\n系统配置:');
    console.log(`模拟模式: ${process.env.FORCE_MOCK_MODE === 'true' ? '已启用' : '未启用'}`);
    console.log(`RPC URL: ${process.env.ETHEREUM_RPC_URL}`);
    console.log(`账户地址: ${process.env.ETHEREUM_ACCOUNT}`);
    console.log(`合约地址: ${process.env.GRADE_CONTRACT_ADDRESS}`);
    
    // 创建Web3实例
    const web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    // 检查连接
    console.log('\n1. 检查区块链连接');
    try {
      const isConnected = await web3.eth.net.isListening();
      console.log(`区块链连接状态: ${isConnected ? '已连接' : '未连接'}`);
      
      if (!isConnected) {
        throw new Error('无法连接到以太坊节点');
      }
      
      // 检查区块高度
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`当前区块高度: ${blockNumber}`);
      
      // 检查账户余额
      const balance = await web3.eth.getBalance(process.env.ETHEREUM_ACCOUNT);
      console.log(`账户余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);
    } catch (error) {
      console.error('区块链连接检查失败:', error.message);
      throw error;
    }
    
    // 检查合约
    console.log('\n2. 检查智能合约');
    let contractABI;
    try {
      // 尝试读取ABI
      const abiPath = path.resolve(__dirname, 'build/GradeRecord.json');
      if (fs.existsSync(abiPath)) {
        const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        contractABI = contractData.abi;
        console.log('成功加载合约ABI');
      } else {
        console.error('找不到合约ABI文件，请先编译并部署合约');
        throw new Error('合约ABI文件不存在');
      }
      
      // 创建合约实例
      const contract = new web3.eth.Contract(contractABI, process.env.GRADE_CONTRACT_ADDRESS);
      
      // 检查合约代码
      const code = await web3.eth.getCode(process.env.GRADE_CONTRACT_ADDRESS);
      if (code === '0x' || code === '0x0') {
        console.error('合约地址无效或合约未部署');
        throw new Error('合约未部署');
      }
      
      console.log('合约有效 ✅');
      
      // 准备账户
      console.log('\n3. 准备账户');
      // 使用私钥添加账户
      const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.ETHEREUM_PRIVATE_KEY);
      web3.eth.accounts.wallet.add(account);
      console.log(`使用账户: ${account.address}`);
      
      // 调用合约
      console.log('\n4. 准备成绩数据');
      console.log(testGrade);
      
      console.log('\n5. 准备调用合约');
      
      // 确保输入数据格式正确
      const formattedGrade = {
        studentId: String(testGrade.studentId),
        courseId: String(testGrade.courseId),
        score: parseInt(testGrade.score),
        semester: String(testGrade.semester),
        teacherId: String(testGrade.teacherId),
        metadata: String(testGrade.metadata)
      };
      
      console.log('格式化后的数据:', formattedGrade);
      
      console.log('\n6. 调用合约方法 addGrade');
      
      // 估算Gas
      const gasEstimate = await contract.methods.addGrade(
        formattedGrade.studentId,
        formattedGrade.courseId,
        formattedGrade.score,
        formattedGrade.semester,
        formattedGrade.teacherId,
        formattedGrade.metadata
      ).estimateGas({ from: account.address });
      
      console.log(`预估Gas: ${gasEstimate}`);
      
      // 发送交易
      console.log('\n7. 发送交易');
      const receipt = await contract.methods.addGrade(
        formattedGrade.studentId,
        formattedGrade.courseId,
        formattedGrade.score,
        formattedGrade.semester,
        formattedGrade.teacherId,
        formattedGrade.metadata
      ).send({
        from: account.address,
        gas: Math.floor(gasEstimate * 1.2),
        gasPrice: web3.utils.toWei('10', 'gwei')
      });
      
      // 处理结果
      console.log('\n8. 交易结果');
      console.log(`交易哈希: ${receipt.transactionHash}`);
      console.log(`区块号: ${receipt.blockNumber}`);
      
      // 从事件中提取gradeId
      let blockchainGradeId = null;
      if (receipt.events && receipt.events.GradeAdded) {
        blockchainGradeId = receipt.events.GradeAdded.returnValues.gradeId;
        console.log(`区块链成绩ID: ${blockchainGradeId}`);
      } else {
        console.warn('无法从事件中提取成绩ID');
      }
      
      // 验证成绩
      console.log('\n9. 验证成绩');
      const verifyResult = await contract.methods.verifyGrade(blockchainGradeId).call();
      console.log('验证结果:', verifyResult);
      
      console.log('\n✅ 测试成功：成绩已成功上链并验证!');
    } catch (error) {
      console.error('测试过程出错:', error);
      
      if (process.env.FORCE_MOCK_MODE !== 'true') {
        console.log('\n提示: 如果您遇到合约相关错误，可能是因为:');
        console.log('1. 合约地址无效或未正确部署');
        console.log('2. 账户未解锁或没有足够的ETH');
        console.log('3. 合约ABI与实际部署的合约不匹配');
        console.log('\n您可以设置 FORCE_MOCK_MODE="true" 来使用模拟模式进行测试');
      }
    }
  } catch (error) {
    console.error('主函数错误:', error);
  }
}

// 执行主函数
main(); 