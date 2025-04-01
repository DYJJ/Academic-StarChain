const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 从.env文件加载数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('缺少必要的环境变量 DATABASE_URL，请检查.env文件');
    process.exit(1);
}

// 从 DATABASE_URL 解析数据库连接参数
// 格式: mysql://username:password@host:port/database
function parseConnectionString(connectionString) {
    try {
        // 匹配 URL 结构
        const matches = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

        if (!matches || matches.length < 6) {
            throw new Error('数据库连接字符串格式不正确');
        }

        return {
            user: matches[1],
            password: matches[2],
            host: matches[3],
            port: parseInt(matches[4]),
            database: matches[5]
        };
    } catch (error) {
        console.error('解析数据库连接字符串失败:', error);
        process.exit(1);
    }
}

async function main() {
    const dbConfig = parseConnectionString(DATABASE_URL);

    // 连接到数据库
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port
    });

    console.log('开始填充数据...');

    try {
        // 创建管理员用户
        const adminId = uuidv4();
        const adminPassword = await bcrypt.hash('123456', 10);
        await connection.execute(
            'INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [adminId, 'admin@example.com', adminPassword, '系统管理员', 'ADMIN']
        );
        console.log('创建了管理员用户');

        // 创建教师用户
        const teacherId = uuidv4();
        const teacherPassword = await bcrypt.hash('123456', 10);
        await connection.execute(
            'INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [teacherId, 'teacher@example.com', teacherPassword, '张教授', 'TEACHER']
        );
        console.log('创建了教师用户');

        // 创建学生用户
        const studentId = uuidv4();
        const studentPassword = await bcrypt.hash('123456', 10);
        await connection.execute(
            'INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [studentId, 'student@example.com', studentPassword, '李同学', 'STUDENT']
        );
        console.log('创建了学生用户');

        // 创建课程数据
        const courses = [
            {
                id: uuidv4(),
                code: 'CS101',
                name: '计算机科学导论',
                description: '这是一门计算机科学的入门课程，涵盖了计算机科学的基本概念和原理。本课程将介绍计算机硬件、软件、网络、算法和编程等方面的基础知识。',
                credit: 3,
                semester: '2023-2024-1'
            },
            {
                id: uuidv4(),
                code: 'CS201',
                name: '数据结构与算法',
                description: '本课程详细讲解了常见的数据结构（如数组、链表、栈、队列、树、图等）以及算法设计与分析技术。学生将学习如何选择合适的数据结构来解决特定问题，并分析算法的时间和空间复杂度。',
                credit: 4,
                semester: '2023-2024-1'
            },
            {
                id: uuidv4(),
                code: 'CS301',
                name: '数据库系统',
                description: '本课程介绍数据库系统的设计和实现原理，包括关系数据库理论、SQL语言、事务处理、并发控制和恢复技术等内容。学生将学习如何设计有效的数据库模式并使用SQL进行查询和管理。',
                credit: 3,
                semester: '2023-2024-2'
            },
            {
                id: uuidv4(),
                code: 'MATH101',
                name: '高等数学',
                description: '本课程涵盖微积分、多变量函数、级数、微分方程等高等数学概念。这些数学工具对于理解和应用计算机科学中的许多概念都是必不可少的。',
                credit: 5,
                semester: '2023-2024-1'
            },
            {
                id: uuidv4(),
                code: 'MATH201',
                name: '线性代数',
                description: '本课程介绍线性代数的基本概念，包括向量空间、线性变换、矩阵运算、特征值和特征向量等。线性代数在计算机图形学、机器学习和数据分析等领域有广泛应用。',
                credit: 4,
                semester: '2023-2024-2'
            }
        ];

        for (const course of courses) {
            await connection.execute(
                'INSERT INTO courses (id, code, name, description, credit, semester, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [course.id, course.code, course.name, course.description, course.credit, course.semester]
            );
            console.log(`创建了课程: ${course.name}`);
        }

        console.log('数据填充完成！');
    } catch (error) {
        console.error('填充数据时出错:', error);
    } finally {
        await connection.end();
    }
}

main(); 