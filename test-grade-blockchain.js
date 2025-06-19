// 测试学生成绩上链流程
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EthereumService = require('./lib/ethereum');

// 创建Ethereum服务实例
const ethereumService = new EthereumService();

// 测试上链过程
async function testBlockchainUpload() {
  try {
    console.log('===== 学生成绩上链测试 =====');
    
    // 获取系统状态
    console.log('系统状态:');
    console.log(`模拟模式: ${process.env.FORCE_MOCK_MODE === 'true' ? '已启用' : '未启用'}`);
    console.log(`RPC URL: ${process.env.ETHEREUM_RPC_URL}`);
    console.log(`合约地址: ${process.env.GRADE_CONTRACT_ADDRESS}`);
    
    // 检查连接
    console.log('\n1. 检查区块链连接');
    const connected = await ethereumService.checkConnection();
    console.log(`连接状态: ${connected ? '已连接' : '未连接'}`);
    
    if (!connected) {
      throw new Error('无法连接到区块链');
    }
    
    // 从数据库获取一个成绩记录用于测试
    console.log('\n2. 获取数据库中的成绩记录');
    let grade = await prisma.grade.findFirst({
      include: {
        student: true,
        course: true,
        teacher: true
      }
    });
    
    if (!grade) {
      console.log('数据库中没有找到成绩记录，创建测试记录');
      
      // 创建测试学生
      const testStudent = await prisma.user.upsert({
        where: { email: 'test.student@example.com' },
        update: {},
        create: {
          email: 'test.student@example.com',
          password: 'hashed_password',
          name: '测试学生',
          role: 'STUDENT'
        }
      });
      
      // 创建测试教师
      const testTeacher = await prisma.user.upsert({
        where: { email: 'test.teacher@example.com' },
        update: {},
        create: {
          email: 'test.teacher@example.com',
          password: 'hashed_password',
          name: '测试教师',
          role: 'TEACHER'
        }
      });
      
      // 创建测试课程
      const testCourse = await prisma.course.upsert({
        where: { code: 'TEST101' },
        update: {},
        create: {
          code: 'TEST101',
          name: '测试课程',
          description: '这是一个用于测试的课程',
          credit: 4,
          semester: '2023-2024-2'
        }
      });
      
      // 创建测试成绩
      grade = await prisma.grade.create({
        data: {
          score: 85,
          status: 'PENDING',
          studentId: testStudent.id,
          teacherId: testTeacher.id,
          courseId: testCourse.id
        },
        include: {
          student: true,
          course: true,
          teacher: true
        }
      });
      
      console.log(`已创建测试成绩记录: ${grade.id}`);
    } else {
      console.log(`使用现有成绩记录: ${grade.id}`);
    }
    
    // 显示成绩详情
    console.log('\n成绩详情:');
    console.log(`- 学生: ${grade.student.name} (ID: ${grade.studentId})`);
    console.log(`- 课程: ${grade.course.name} (ID: ${grade.courseId})`);
    console.log(`- 分数: ${grade.score}`);
    console.log(`- 学期: ${grade.course.semester}`);
    console.log(`- 教师: ${grade.teacher.name} (ID: ${grade.teacherId})`);
    console.log(`- 状态: ${grade.status}`);
    
    // 检查是否已经上链
    console.log('\n3. 检查成绩是否已经上链');
    const existingTx = await prisma.blockchainTransaction.findFirst({
      where: { gradeId: grade.id }
    });
    
    if (existingTx) {
      console.log(`该成绩已经上链，交易哈希: ${existingTx.transactionHash}`);
      console.log('跳过上链步骤');
    } else {
      // 准备上链数据
      console.log('\n4. 准备上链数据');
      const blockchainData = {
        id: grade.id,
        studentId: grade.studentId,
        courseId: grade.courseId,
        score: grade.score,
        semester: grade.course.semester,
        teacherId: grade.teacherId,
        metadata: JSON.stringify({
          status: grade.status,
          createdAt: new Date().toISOString()
        })
      };
      
      console.log('上链数据:');
      console.log(blockchainData);
      
      // 格式化上链数据
      const formattedData = {
        ...blockchainData,
        score: parseInt(blockchainData.score.toString()),
        studentId: String(blockchainData.studentId),
        courseId: String(blockchainData.courseId),
        semester: String(blockchainData.semester || ''),
        teacherId: String(blockchainData.teacherId || ''),
        metadata: String(blockchainData.metadata || '')
      };
      
      // 执行上链操作
      console.log('\n5. 执行上链操作');
      console.log('提交到区块链...');
      const txResult = await ethereumService.addGrade(formattedData);
      console.log('上链结果:');
      console.log(txResult);
      
      if (txResult.success) {
        // 记录区块链交易
        console.log('\n6. 记录区块链交易');
        const blockchainTransaction = await prisma.blockchainTransaction.create({
          data: {
            transactionHash: txResult.transactionHash,
            blockNumber: txResult.blockNumber || 0,
            gradeId: grade.id,
            studentId: grade.studentId,
            courseId: grade.courseId,
            teacherId: grade.teacherId,
            blockchainData: JSON.stringify({
              blockchainGradeId: txResult.blockchainGradeId,
              gradeData: formattedData
            }),
            blockTimestamp: new Date()
          }
        });
        
        console.log(`交易记录ID: ${blockchainTransaction.id}`);
        
        // 更新成绩状态
        await prisma.grade.update({
          where: { id: grade.id },
          data: { status: 'VERIFIED' }
        });
        
        console.log('成绩状态已更新为: VERIFIED');
      } else {
        console.error('上链失败:', txResult);
      }
    }
    
    // 验证成绩是否可以在区块链上查询
    console.log('\n7. 验证区块链上的成绩');
    const latestTx = await prisma.blockchainTransaction.findFirst({
      where: { gradeId: grade.id },
      orderBy: { createdAt: 'desc' }
    });
    
    if (latestTx) {
      const verifyResult = await ethereumService.verifyGrade(latestTx.transactionHash);
      console.log('验证结果:');
      console.log(verifyResult);
      
      if (verifyResult.exists) {
        console.log('\n✅ 成功: 成绩已成功上链并可被验证');
      } else {
        console.log('\n❌ 错误: 成绩上链后无法验证');
      }
    } else {
      console.log('没有找到与该成绩相关的区块链交易记录');
    }
    
    console.log('\n===== 测试完成 =====');
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    // 关闭Prisma连接
    await prisma.$disconnect();
  }
}

// 运行测试
testBlockchainUpload(); 