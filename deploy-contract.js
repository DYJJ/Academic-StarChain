// 部署GradeRecord合约到本地geth节点
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const solc = require('solc');

// 加载账户信息
const accountAddress = process.env.ETHEREUM_ACCOUNT;
const privateKey = process.env.ETHEREUM_PRIVATE_KEY;

// 创建Web3实例
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETHEREUM_RPC_URL));

// 编译合约
async function compileContract() {
  console.log('正在编译智能合约...');
  
  // 读取合约源代码
  const contractPath = path.resolve(__dirname, 'contracts', 'GradeRecord.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  
  // 设置编译输入
  const input = {
    language: 'Solidity',
    sources: {
      'GradeRecord.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };
  
  // 编译合约
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  // 检查编译错误
  if (output.errors) {
    output.errors.forEach(error => {
      console.error(error.formattedMessage);
    });
    
    // 如果有严重错误，停止部署
    if (output.errors.some(error => error.severity === 'error')) {
      throw new Error('合约编译失败');
    }
  }
  
  // 获取合约数据
  const contractOutput = output.contracts['GradeRecord.sol']['GradeRecord'];
  const abi = contractOutput.abi;
  const bytecode = contractOutput.evm.bytecode.object;
  
  // 创建输出目录
  const buildDir = path.resolve(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }
  
  // 保存ABI到文件
  fs.writeFileSync(
    path.resolve(buildDir, 'GradeRecord.json'),
    JSON.stringify({ abi, bytecode }, null, 2)
  );
  
  console.log('合约编译完成');
  return { abi, bytecode };
}

// 部署合约
async function deployContract(abi, bytecode) {
  console.log('正在部署合约...');
  
  // 创建合约实例
  const contract = new web3.eth.Contract(abi);
  
  // 创建部署交易
  const deployTx = contract.deploy({
    data: '0x' + bytecode,
    arguments: [] // 构造函数参数（如果有）
  });
  
  // 获取账户余额
  const balance = await web3.eth.getBalance(accountAddress);
  console.log(`账户余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);
  
  try {
    // 添加privateKey到Web3钱包
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    
    // 估算Gas
    const gas = await deployTx.estimateGas({ from: accountAddress });
    console.log(`预估Gas: ${gas}`);
    
    // 使用固定gas值避免浮点数问题
    const gasToUse = Math.floor(Number(gas) * 1.2);
    console.log(`使用Gas: ${gasToUse}`);
    
    // 发送交易
    console.log(`使用账户 ${accountAddress} 部署合约`);
    const deployedContract = await deployTx.send({
      from: accountAddress,
      gas: gasToUse,
      gasPrice: web3.utils.toWei('10', 'gwei')
    });
    
    // 获取部署的合约地址
    const contractAddress = deployedContract.options.address;
    console.log(`合约已部署，地址: ${contractAddress}`);
    
    // 更新.env文件中的合约地址
    updateEnvFile(contractAddress);
    
    return contractAddress;
  } catch (error) {
    console.error('部署合约失败:', error);
    throw error;
  }
}

// 更新.env文件中的合约地址
function updateEnvFile(contractAddress) {
  console.log('正在更新.env文件...');
  
  // 读取原.env文件
  const envPath = path.resolve(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 替换GRADE_CONTRACT_ADDRESS行
  envContent = envContent.replace(
    /GRADE_CONTRACT_ADDRESS\s*=\s*"[^"]*"/,
    `GRADE_CONTRACT_ADDRESS="${contractAddress}"`
  );
  
  // 写回.env文件
  fs.writeFileSync(envPath, envContent);
  console.log('已更新.env文件中的合约地址');
}

// 主函数
async function main() {
  try {
    // 检查Web3连接
    console.log('正在检查区块链连接...');
    const isConnected = await web3.eth.net.isListening();
    if (!isConnected) {
      throw new Error('无法连接到以太坊节点，请确保节点正在运行');
    }
    console.log('成功连接到以太坊节点');
    
    // 编译合约
    const { abi, bytecode } = await compileContract();
    
    // 部署合约
    const contractAddress = await deployContract(abi, bytecode);
    
    console.log('=================================');
    console.log('部署完成');
    console.log(`合约地址: ${contractAddress}`);
    console.log('=================================');
    
    // 退出进程
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

// 运行主函数
main(); 