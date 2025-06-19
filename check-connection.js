// check-connection.js
const Web3 = require('web3');
require('dotenv').config();

async function checkConnection() {
    try {
        // 使用.env中的RPC_URL
        const rpcUrl = process.env.ETHEREUM_RPC_URL;
        console.log(`尝试连接到: ${rpcUrl}`);

        const web3 = new Web3(rpcUrl);

        // 检查连接
        const isConnected = await web3.eth.net.isListening();
        console.log(`连接状态: ${isConnected ? '已连接' : '未连接'}`);

        // 获取当前区块号
        if (isConnected) {
            const blockNumber = await web3.eth.getBlockNumber();
            console.log(`当前区块号: ${blockNumber}`);

            // 获取账户列表
            const accounts = await web3.eth.getAccounts();
            console.log(`可用账户: ${accounts.length > 0 ? accounts.join(', ') : '无'}`);

            // 检查我们配置的账户余额
            const account = process.env.ETHEREUM_ACCOUNT;
            if (account) {
                const balance = await web3.eth.getBalance(account);
                console.log(`账户 ${account} 余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);
            }
        }
    } catch (error) {
        console.error('连接失败:', error.message);
    }
}

checkConnection(); 