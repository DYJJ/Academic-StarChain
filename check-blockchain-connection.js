// 检查区块链连接状态
require('dotenv').config();
const Web3 = require('web3');

async function checkBlockchainConnection() {
  try {
    console.log('环境配置检查:');
    console.log(`RPC URL: ${process.env.ETHEREUM_RPC_URL}`);
    console.log(`账户地址: ${process.env.ETHEREUM_ACCOUNT}`);
    console.log(`合约地址: ${process.env.GRADE_CONTRACT_ADDRESS}`);
    console.log(`模拟模式: ${process.env.FORCE_MOCK_MODE}`);
    
    // 创建Web3实例
    const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_RPC_URL));
    
    console.log('\n1. 正在检查区块链连接...');
    try {
      const isListening = await web3.eth.net.isListening();
      console.log(`网络连接状态: ${isListening ? '已连接' : '未连接'}`);
      
      if (isListening) {
        // 获取区块高度
        const blockNumber = await web3.eth.getBlockNumber();
        console.log(`当前区块高度: ${blockNumber}`);
        
        // 获取账户余额
        console.log('\n2. 正在获取账户余额...');
        const balanceWei = await web3.eth.getBalance(process.env.ETHEREUM_ACCOUNT);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        console.log(`账户余额: ${balanceEth} ETH`);
        
        // 检查合约
        console.log('\n3. 验证合约...');
        const code = await web3.eth.getCode(process.env.GRADE_CONTRACT_ADDRESS);
        if (code && code !== '0x') {
          console.log('合约地址有效 ✅');
        } else {
          console.log('警告: 合约地址无效或尚未部署 ❌');
        }
      }
    } catch (error) {
      console.error('区块链连接失败:', error.message);
      console.log('提示: 请确保您的geth节点正在运行，并且端口配置正确');
    }
    
  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

// 运行检查
checkBlockchainConnection(); 