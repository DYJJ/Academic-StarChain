/**
 * 数据库初始化脚本
 * 
 * 此脚本用于在应用首次部署时初始化数据库结构并添加测试数据
 * 适用于 Vercel 部署时的初始化
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('开始初始化数据库...');

    try {
        // 创建管理员用户
        const adminExists = await prisma.user.findUnique({
            where: {
                email: 'admin@example.com',
            },
        });

        if (!adminExists) {
            console.log('创建管理员用户...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    name: '管理员',
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            });
            console.log('管理员用户创建成功');
        }

        // 创建测试教师
        const teacherExists = await prisma.user.findUnique({
            where: {
                email: 'teacher@example.com',
            },
        });

        if (!teacherExists) {
            console.log('创建测试教师用户...');
            const hashedPassword = await bcrypt.hash('teacher123', 10);
            await prisma.user.create({
                data: {
                    email: 'teacher@example.com',
                    name: '张老师',
                    password: hashedPassword,
                    role: 'TEACHER',
                },
            });
            console.log('教师用户创建成功');
        }

        // 创建测试学生
        const studentExists = await prisma.user.findUnique({
            where: {
                email: 'student@example.com',
            },
        });

        if (!studentExists) {
            console.log('创建测试学生用户...');
            const hashedPassword = await bcrypt.hash('student123', 10);
            await prisma.user.create({
                data: {
                    email: 'student@example.com',
                    name: '李同学',
                    password: hashedPassword,
                    role: 'STUDENT',
                },
            });
            console.log('学生用户创建成功');
        }

        // 创建测试课程
        const courseExists = await prisma.course.findUnique({
            where: {
                code: 'CS101',
            },
        });

        if (!courseExists) {
            console.log('创建测试课程...');
            await prisma.course.create({
                data: {
                    code: 'CS101',
                    name: '计算机科学导论',
                    description: '本课程介绍计算机科学的基本概念和原理，包括算法、数据结构、计算机组成等内容。',
                    credit: 3.0,
                    semester: '2023-2024-1',
                },
            });

            await prisma.course.create({
                data: {
                    code: 'MATH101',
                    name: '高等数学',
                    description: '本课程介绍微积分、线性代数等高等数学基础知识，培养学生的数学思维和解决问题的能力。',
                    credit: 4.0,
                    semester: '2023-2024-1',
                },
            });
            console.log('测试课程创建成功');
        }

        console.log('数据库初始化完成！');
    } catch (error) {
        console.error('初始化过程中出错：', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// 执行主函数
main(); 