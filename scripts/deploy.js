const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const solc = require('solc');
require('dotenv').config();

// 从环境变量获取配置参数
const RPC_URL = 'http://localhost:8888'; // 直接使用8888端口
const ACCOUNT_ADDRESS = '0x3d8ce59BaBe6A23Fe852dEDbF5803E35b36E1ca9'; // 使用Geth开发者账户
const PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY || '';
const GAS_LIMIT = 3000000; // 增加Gas限制，确保合约部署成功
const CONTRACT_NAME = 'GradeRecord';
const OUTPUT_DIR = path.join(__dirname, '../build');

// 输出配置信息
console.log(`使用以下配置进行部署:`);
console.log(`RPC URL: ${RPC_URL}`);
console.log(`账户地址: ${ACCOUNT_ADDRESS}`);
console.log(`Gas限制: ${GAS_LIMIT}`);
console.log(`合约名称: ${CONTRACT_NAME}`);

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 连接到以太坊网络
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

// 读取和编译合约
async function compileContract() {
    // 读取合约文件
    const contractPath = path.join(__dirname, '../contracts/GradeRecord.sol');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    // 准备编译器输入
    const input = {
        language: 'Solidity',
        sources: {
            'GradeRecord.sol': {
                content: contractSource
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
        if (output.errors.some(error => error.severity === 'error')) {
            throw new Error('编译合约时出错');
        }
    }

    // 获取编译结果
    const contractOutput = output.contracts['GradeRecord.sol'][CONTRACT_NAME];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    // 保存ABI到文件
    fs.writeFileSync(
        path.join(OUTPUT_DIR, `${CONTRACT_NAME}.json`),
        JSON.stringify({ abi, bytecode }, null, 2)
    );

    return { abi, bytecode };
}

// 部署合约
async function deployContract() {
    try {
        console.log('开始编译合约...');
        const { abi, bytecode } = await compileContract();
        console.log('合约编译完成');

        // 创建合约实例
        const contract = new web3.eth.Contract(abi);

        // 检查账户余额
        const balance = await web3.eth.getBalance(ACCOUNT_ADDRESS);
        console.log(`账户余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);

        if (web3.utils.fromWei(balance, 'ether') < 0.1) {
            console.warn('账户余额可能不足以支付Gas费用！');
        }

        // 直接使用本地Geth账户部署（无需私钥）
        console.log('准备部署合约...');
        console.log('使用以下账户进行部署:', ACCOUNT_ADDRESS);

        const deployTx = contract.deploy({
            data: '0x' + bytecode,
            arguments: [] // 构造函数参数，如果有的话
        });

        // 估算Gas
        const estimatedGas = await deployTx.estimateGas({ from: ACCOUNT_ADDRESS });
        console.log(`估算的Gas消耗: ${estimatedGas}`);

        // 发送交易
        console.log('正在部署合约...');
        const deployedContract = await deployTx.send({
            from: ACCOUNT_ADDRESS,
            gas: Math.max(estimatedGas * 1.2, GAS_LIMIT) // 添加20%的Gas余量
        });

        const contractAddress = deployedContract.options.address;
        console.log(`合约部署成功！合约地址: ${contractAddress}`);

        // 保存部署信息
        const deployInfo = {
            address: contractAddress,
            deployer: ACCOUNT_ADDRESS,
            network: 'localhost:8888',
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'deploy-info.json'),
            JSON.stringify(deployInfo, null, 2)
        );

        // 创建部署完成标记文件
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'deployment-complete'),
            `CONTRACT_ADDRESS=${contractAddress}\nDEPLOYER=${ACCOUNT_ADDRESS}\nTIMESTAMP=${new Date().toISOString()}`
        );

        console.log(`部署信息已保存至: ${path.join(OUTPUT_DIR, 'deploy-info.json')}`);

        // 更新.env.local文件
        updateEnvFile(contractAddress);

        return deployInfo;
    } catch (error) {
        console.error('部署合约时出错:', error);
        throw error;
    }
}

// 更新.env.local文件中的合约地址
function updateEnvFile(contractAddress) {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        let envContent = '';

        // 尝试读取现有.env.local
        try {
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }
        } catch (e) {
            console.log('未找到现有的.env.local文件，将创建新文件');
        }

        // 构建新的配置
        const newConfig = `# 以太坊配置
FORCE_MOCK_MODE=false

# RPC URL
ETHEREUM_RPC_URL=http://localhost:8888

# 区块链账户
ETHEREUM_ACCOUNT=0x3d8ce59BaBe6A23Fe852dEDbF5803E35b36E1ca9

# 合约地址
GRADE_CONTRACT_ADDRESS=${contractAddress}
`;

        // 写入文件
        fs.writeFileSync(envPath, newConfig);
        console.log(`已更新.env.local文件中的合约地址为: ${contractAddress}`);
    } catch (error) {
        console.error('更新.env.local文件失败:', error);
    }
}

// 执行部署
deployContract()
    .then(() => {
        console.log('部署脚本执行完成');
        process.exit(0);
    })
    .catch(error => {
        console.error('部署失败:', error);
        process.exit(1);
    }); 