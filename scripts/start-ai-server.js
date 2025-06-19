import { exec } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n===== 成绩分析AI服务启动助手 =====\n');
console.log('该脚本将帮助您启动DeepSeek 8B本地AI服务，用于成绩分析和学习建议\n');

// 检查Ollama是否已安装
console.log('正在检查Ollama是否已安装...');
exec('ollama -v', (error, stdout, stderr) => {
  if (error) {
    console.log('\x1b[31m错误：未检测到Ollama\x1b[0m');
    console.log('请先安装Ollama：');
    console.log('\x1b[36mhttps://ollama.com/download\x1b[0m');
    console.log('\n安装后，再次运行此脚本');
    
    rl.question('\n按Enter键退出', () => {
      rl.close();
    });
    return;
  }
  
  console.log(`\x1b[32m✓ 已检测到Ollama: ${stdout.trim()}\x1b[0m`);
  
  // 检查模型是否已下载
  console.log('\n正在检查DeepSeek 8B模型是否已下载...');
  exec('ollama list', (error, stdout, stderr) => {
    const modelExists = stdout.includes('deepseek-r1:8b');
    
    if (!modelExists) {
      console.log('\x1b[33m提示: DeepSeek 8B模型未下载\x1b[0m');
      console.log('需要下载模型（约4.3GB），这可能需要一些时间');
      
      rl.question('\n是否现在下载DeepSeek 8B模型? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\n正在下载DeepSeek 8B模型，请稍候...');
          console.log('（首次下载大约需要5-10分钟，取决于您的网络速度）\n');
          
          const pullProcess = exec('ollama pull deepseek-r1:8b');
          
          pullProcess.stdout.on('data', (data) => {
            console.log(data);
          });
          
          pullProcess.stderr.on('data', (data) => {
            console.log(data);
          });
          
          pullProcess.on('close', (code) => {
            if (code === 0) {
              console.log('\x1b[32m✓ DeepSeek 8B模型下载完成!\x1b[0m');
              startOllamaService();
            } else {
              console.log('\x1b[31m✗ 模型下载失败，请检查网络连接并重试\x1b[0m');
              rl.close();
            }
          });
        } else {
          console.log('\n您可以稍后通过以下命令下载模型:');
          console.log('\x1b[36mollama pull deepseek-r1:8b\x1b[0m');
          rl.close();
        }
      });
    } else {
      console.log('\x1b[32m✓ DeepSeek 8B模型已安装\x1b[0m');
      startOllamaService();
    }
  });
});

// 启动Ollama服务
function startOllamaService() {
  console.log('\n准备启动AI服务...');
  
  rl.question('是否启动DeepSeek 8B AI服务? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\n正在启动DeepSeek 8B AI服务...');
      console.log('\x1b[33m注意：请保持此窗口开启以使AI服务持续运行\x1b[0m');
      console.log('您可以使用Ctrl+C随时停止AI服务\n');
      
      // 启动Ollama服务
      const ollamaProcess = exec('ollama run deepseek-r1:8b');
      
      ollamaProcess.stdout.on('data', (data) => {
        console.log(data);
      });
      
      ollamaProcess.stderr.on('data', (data) => {
        console.log('\x1b[31m错误: ' + data + '\x1b[0m');
      });
      
      ollamaProcess.on('close', (code) => {
        console.log(`\nAI服务已停止，退出代码: ${code}`);
        rl.close();
      });
    } else {
      console.log('\n您可以稍后通过以下命令启动AI服务:');
      console.log('\x1b[36mollama run deepseek-r1:8b\x1b[0m');
      rl.close();
    }
  });
} 