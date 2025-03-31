const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('开始填充数据...');

  try {
    // 创建用户
    console.log('创建用户...');

    // 管理员用户
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: await bcrypt.hash('admin123', 10),
          name: '管理员',
          role: 'ADMIN'
        }
      });
      console.log('创建了管理员用户');
    }

    // 教师用户
    const teacherExists = await prisma.user.findUnique({
      where: { email: 'teacher@example.com' }
    });

    if (!teacherExists) {
      await prisma.user.create({
        data: {
          email: 'teacher@example.com',
          password: await bcrypt.hash('teacher123', 10),
          name: '张老师',
          role: 'TEACHER'
        }
      });
      console.log('创建了教师用户');
    }

    // 学生用户
    const studentExists = await prisma.user.findUnique({
      where: { email: 'student@example.com' }
    });

    if (!studentExists) {
      await prisma.user.create({
        data: {
          email: 'student@example.com',
          password: await bcrypt.hash('student123', 10),
          name: '李同学',
          role: 'STUDENT'
        }
      });
      console.log('创建了学生用户');
    }

    // 创建课程
    console.log('创建课程...');

    const courses = [
      {
        code: 'CS101',
        name: '计算机科学导论',
        description: '这是一门计算机科学的入门课程，涵盖了计算机科学的基本概念和原理。本课程将介绍计算机硬件、软件、网络、算法和编程等方面的基础知识。',
        credit: 3,
        semester: '2023-2024-1'
      },
      {
        code: 'CS201',
        name: '数据结构与算法',
        description: '本课程详细讲解了常见的数据结构（如数组、链表、栈、队列、树、图等）以及算法设计与分析技术。学生将学习如何选择合适的数据结构来解决特定问题，并分析算法的时间和空间复杂度。',
        credit: 4,
        semester: '2023-2024-1'
      },
      {
        code: 'CS301',
        name: '数据库系统',
        description: '本课程介绍数据库系统的设计和实现原理，包括关系数据库理论、SQL语言、事务处理、并发控制和恢复技术等内容。学生将学习如何设计有效的数据库模式并使用SQL进行查询和管理。',
        credit: 3,
        semester: '2023-2024-2'
      },
      {
        code: 'MATH101',
        name: '高等数学',
        description: '本课程涵盖微积分、多变量函数、级数、微分方程等高等数学概念。这些数学工具对于理解和应用计算机科学中的许多概念都是必不可少的。',
        credit: 5,
        semester: '2023-2024-1'
      },
      {
        code: 'MATH201',
        name: '线性代数',
        description: '本课程介绍线性代数的基本概念，包括向量空间、线性变换、矩阵运算、特征值和特征向量等。线性代数在计算机图形学、机器学习和数据分析等领域有广泛应用。',
        credit: 4,
        semester: '2023-2024-2'
      },
      {
        code: 'CS401',
        name: '操作系统',
        description: '本课程探讨操作系统的设计和实现原理，包括进程管理、内存管理、文件系统和I/O管理等主题。学生将理解现代操作系统如何管理计算机资源并提供用户接口。',
        credit: 4,
        semester: '2024-2025-1'
      },
      {
        code: 'CS501',
        name: '计算机网络',
        description: '本课程介绍计算机网络的基本原理和协议，包括网络体系结构、数据链路层、网络层、传输层和应用层等内容。学生将学习如何设计和实现计算机网络，以及如何评估网络性能。',
        credit: 3,
        semester: '2024-2025-1'
      },
      {
        code: 'CS601',
        name: '人工智能',
        description: '本课程介绍人工智能的基本概念和技术，包括搜索算法、知识表示、机器学习、自然语言处理和计算机视觉等。学生将了解AI系统的设计原则和应用方法。',
        credit: 4,
        semester: '2024-2025-2'
      }
    ];

    for (const course of courses) {
      const existingCourse = await prisma.course.findUnique({
        where: { code: course.code }
      });

      if (!existingCourse) {
        await prisma.course.create({
          data: course
        });
        console.log(`创建了课程: ${course.name}`);
      }
    }

    console.log('数据填充完成！');
  } catch (e) {
    console.error('填充数据时出错:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行主函数
main(); 