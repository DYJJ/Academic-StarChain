/**
 * 部署合约到本地Geth私有链的脚本
 * 使用方法: node scripts/deploy-to-local.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检查本地Geth是否运行
function checkGeth(callback) {
    console.log('正在检查本地Geth节点状态...');

    exec("curl -s -X POST -H \"Content-Type: application/json\" --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' http://localhost:8888", (error, stdout, stderr) => {
        if (error) {
            console.error('无法连接到Geth节点:', error);
            console.error('请确保Geth节点在端口8888上运行');
            console.error('示例命令: geth --datadir "." --dev --dev.period 2 --http --http.api eth,web3,net --http.corsdomain="*" --http.port 8888 --graphql');
            process.exit(1);
        }

        try {
            const response = JSON.parse(stdout);
            if (response.result) {
                console.log(`Geth节点已连接，当前区块高度: ${parseInt(response.result, 16)}`);
                callback();
            } else {
                console.error('Geth节点响应异常:', response);
                process.exit(1);
            }
        } catch (e) {
            console.error('解析Geth响应失败:', e);
            console.error('原始响应:', stdout);
            process.exit(1);
        }
    });
}

// 解锁账户
function unlockAccount(callback) {
    console.log('尝试解锁开发账户...');

    // 开发模式下不需要密码
    exec("curl -s -X POST -H \"Content-Type: application/json\" --data '{\"jsonrpc\":\"2.0\",\"method\":\"personal_unlockAccount\",\"params\":[\"0x3d8ce59BaBe6A23Fe852dEDbF5803E35b36E1ca9\", \"\", 0],\"id\":1}' http://localhost:8888", (error, stdout, stderr) => {
        if (error) {
            console.warn('解锁账户请求失败:', error);
            console.warn('将尝试继续部署，可能需要Geth自动签名');
            callback();
            return;
        }

        try {
            const response = JSON.parse(stdout);
            if (response.result === true) {
                console.log('账户解锁成功');
            } else {
                console.warn('账户解锁失败，可能是开发者模式不需要解锁');
                console.warn('将尝试继续部署');
            }
            callback();
        } catch (e) {
            console.warn('解析解锁响应失败:', e);
            console.warn('将尝试继续部署');
            callback();
        }
    });
}

// 部署合约
function deployContract(callback) {
    console.log('开始部署合约...');

    const deployScript = path.join(__dirname, 'deploy.js');
    const deployProcess = exec(`node "${deployScript}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('部署合约失败:', error);
            process.exit(1);
        }

        console.log(stdout);

        if (stderr) {
            console.warn('部署过程中有警告:', stderr);
        }

        // 检查部署是否成功
        const deployInfoPath = path.join(__dirname, '../build/deploy-info.json');
        if (!fs.existsSync(deployInfoPath)) {
            console.error('未找到部署信息文件，部署可能失败');
            process.exit(1);
        }

        try {
            const deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
            console.log(`合约部署成功，地址: ${deployInfo.address}`);
            callback(deployInfo);
        } catch (e) {
            console.error('读取部署信息失败:', e);
            process.exit(1);
        }
    });

    // 显示部署脚本的实时输出
    deployProcess.stdout.pipe(process.stdout);
    deployProcess.stderr.pipe(process.stderr);
}

// 主流程
checkGeth(() => {
    unlockAccount(() => {
        deployContract((deployInfo) => {
            console.log('===============================================');
            console.log('部署完成！应用程序已配置为使用本地区块链');
            console.log('合约地址:', deployInfo.address);
            console.log('');
            console.log('现在可以重启应用以使用新部署的合约:');
            console.log('npm run dev');
            console.log('===============================================');
        });
    });
}); 