// check-balance.js
const Web3 = require('web3');
require('dotenv').config();

async function checkBalances() {
    try {
        const rpcUrl = process.env.ETHEREUM_RPC_URL;
        console.log(`尝试连接到: ${rpcUrl}`);

        const web3 = new Web3(rpcUrl);
        const isConnected = await web3.eth.net.isListening();
        console.log(`连接状态: ${isConnected ? '已连接' : '未连接'}`);

        if (isConnected) {
            // 获取账户列表
            const accounts = await web3.eth.getAccounts();
            console.log(`发现 ${accounts.length} 个账户:`);

            // 显示每个账户的余额
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                const balance = await web3.eth.getBalance(account);
                const ethBalance = web3.utils.fromWei(balance, 'ether');
                console.log(`账户[${i}]: ${account}`);
                console.log(`  - 余额: ${ethBalance} ETH`);
                console.log(`  - 余额(Wei): ${balance}`);
            }

            // 特别检查当前配置的账户
            const configAccount = process.env.ETHEREUM_ACCOUNT;
            if (configAccount) {
                console.log(`\n当前配置的账户: ${configAccount}`);
                try {
                    const balance = await web3.eth.getBalance(configAccount);
                    console.log(`  - 余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);
                    console.log(`  - 余额(Wei): ${balance}`);
                } catch (err) {
                    console.error(`  - 获取余额失败: ${err.message}`);
                }
            }
        }
    } catch (error) {
        console.error('检查余额失败:', error.message);
    }
}

checkBalances(); 