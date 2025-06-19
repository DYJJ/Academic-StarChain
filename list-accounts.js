// list-accounts.js
const Web3 = require('web3');
require('dotenv').config();

async function listAccounts() {
    try {
        const rpcUrl = process.env.ETHEREUM_RPC_URL;
        console.log(`尝试连接到: ${rpcUrl}`);

        const web3 = new Web3(rpcUrl);
        const isConnected = await web3.eth.net.isListening();
        console.log(`连接状态: ${isConnected ? '已连接' : '未连接'}`);

        if (isConnected) {
            // 获取账户列表
            const accounts = await web3.eth.getAccounts();
            console.log(`发现 ${accounts.length} 个账户`);
            console.dir(accounts, { depth: null });

            // 对每个账户进行检查
            if (accounts.length > 0) {
                const account = accounts[0]; // 使用第一个账户
                console.log(`\n使用账户: ${account}`);

                try {
                    const balance = await web3.eth.getBalance(account);
                    const ethBalance = web3.utils.fromWei(balance, 'ether');
                    console.log(`余额: ${ethBalance} ETH`);

                    // 更新.env文件的建议
                    console.log(`\n请在.env文件中使用以下配置:`);
                    console.log(`ETHEREUM_ACCOUNT="${account}"`);
                } catch (err) {
                    console.error(`获取账户${account}的余额失败:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('列出账户失败:', error.message);
    }
}

listAccounts(); 