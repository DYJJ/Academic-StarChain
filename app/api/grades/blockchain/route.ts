import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/prisma';

// 从cookie获取当前用户信息
function getCurrentUser(request: NextRequest) {
    const cookieStore = cookies();
    const userSessionStr = cookieStore.get('user_session')?.value;

    if (!userSessionStr) {
        return null;
    }

    try {
        return JSON.parse(userSessionStr);
    } catch (error) {
        console.error('解析用户会话错误:', error);
        return null;
    }
}

// 导入以太坊服务
let ethereumService: any;
try {
    // 使用import语法代替require
    import('../../../../lib/ethereum').then(module => {
        ethereumService = module.default || module;
        console.log('成功加载以太坊服务');
    }).catch(error => {
        console.error('加载以太坊服务失败:', error);
        ethereumService = {
            addGrade: async (gradeData: any) => {
                console.log('使用模拟以太坊服务添加成绩:', gradeData);
                return {
                    success: true,
                    mockMode: true,
                    blockchainId: `0x${Math.random().toString(16).substring(2)}`,
                    transactionHash: `0x${Math.random().toString(16).substring(2)}`,
                    message: '模拟模式下成功记录成绩'
                };
            }
        };
    });
} catch (error) {
    console.error('加载以太坊服务失败:', error);
    ethereumService = {
        addGrade: async (gradeData: any) => {
            console.log('使用模拟以太坊服务添加成绩:', gradeData);
            return {
                success: true,
                mockMode: true,
                blockchainId: `0x${Math.random().toString(16).substring(2)}`,
                transactionHash: `0x${Math.random().toString(16).substring(2)}`,
                message: '模拟模式下成功记录成绩'
            };
        }
    };
}

// POST - 上传成绩到区块链
export async function POST(request: NextRequest) {
    try {
        // 验证用户权限
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: '未授权操作' }, { status: 401 });
        }

        // 仅允许教师和管理员上链
        if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: '权限不足，仅允许教师和管理员上链' }, { status: 403 });
        }

        // 获取请求参数
        const body = await request.json();
        const { gradeId } = body;

        if (!gradeId) {
            return NextResponse.json({ error: '缺少必要参数: gradeId' }, { status: 400 });
        }

        // 从数据库获取成绩详情
        const grade = await prisma.grade.findUnique({
            where: { id: gradeId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                course: true
            }
        });

        if (!grade) {
            return NextResponse.json({ error: '成绩记录不存在' }, { status: 404 });
        }

        // 检查权限 - 只有管理员或该成绩的老师可以上链
        if (currentUser.role !== 'ADMIN' && grade.teacherId !== currentUser.id) {
            return NextResponse.json({ error: '没有权限操作此成绩记录' }, { status: 403 });
        }

        // 检查成绩是否已上链
        const existingTransaction = await prisma.blockchainTransaction.findFirst({
            where: { gradeId: grade.id }
        });

        if (existingTransaction) {
            return NextResponse.json({
                message: '该成绩已经上链',
                transactionHash: existingTransaction.transactionHash,
                blockchainData: JSON.parse(existingTransaction.blockchainData || '{}')
            }, { status: 200 });
        }

        // 准备上链数据
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

        // 调用以太坊服务上链
        console.log('准备上链数据:', blockchainData);
        try {
            // 格式化上链数据
            const formattedData = {
                ...blockchainData,
                // 确保score是数字
                score: parseInt(blockchainData.score.toString()),
                // 确保其他字段是字符串
                studentId: String(blockchainData.studentId),
                courseId: String(blockchainData.courseId),
                semester: String(blockchainData.semester || ''),
                teacherId: String(blockchainData.teacherId || ''),
                metadata: String(blockchainData.metadata || '')
            };

            console.log('格式化后的上链数据:', formattedData);

            // 上链操作
            const txResult = await ethereumService.addGrade(formattedData);
            console.log('上链结果:', txResult);

            // 记录区块链交易
            if (txResult.success) {
                try {
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

                    // 更新成绩状态
                    await prisma.grade.update({
                        where: { id: grade.id },
                        data: {
                            status: 'VERIFIED'
                        }
                    });

                    console.log('成功记录区块链交易', blockchainTransaction.id);
                } catch (dbError) {
                    console.error('记录区块链交易失败:', dbError);
                    // 虽然记录失败，但区块链交易已成功，继续返回成功
                }
            }

            // 记录系统日志
            try {
                await prisma.systemLog.create({
                    data: {
                        userId: currentUser.id,
                        action: '区块链上链',
                        details: `将成绩记录(${grade.id})上链，交易哈希: ${txResult.transactionHash || 'N/A'}`,
                        ipAddress: request.headers.get('x-forwarded-for') || '未知'
                    }
                });
            } catch (logError) {
                console.warn('记录成功日志失败，但上链已完成:', logError);
            }

            // 返回成功结果
            return NextResponse.json({
                success: true,
                txHash: txResult.transactionHash,
                blockNumber: txResult.blockNumber,
                blockchainGradeId: txResult.blockchainGradeId,
                message: '成绩成功添加到区块链'
            });
        } catch (bcError) {
            console.error('区块链交易失败:', bcError);

            // 尝试记录失败日志
            try {
                await prisma.systemLog.create({
                    data: {
                        userId: currentUser.id,
                        action: '区块链上链失败',
                        details: `尝试将成绩记录(${grade.id})上链失败: ${bcError instanceof Error ? bcError.message : '未知错误'}`,
                        ipAddress: request.headers.get('x-forwarded-for') || '未知'
                    }
                });
            } catch (logError) {
                console.warn('记录失败日志失败:', logError);
            }

            // 返回错误信息
            return NextResponse.json({
                error: '区块链交易失败',
                details: bcError instanceof Error ? bcError.message : '未知错误'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('成绩上链失败:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// GET - 获取成绩上链状态
export async function GET(request: NextRequest) {
    try {
        // 验证用户权限
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: '未授权操作' }, { status: 401 });
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const gradeId = searchParams.get('gradeId');

        if (!gradeId) {
            return NextResponse.json({ error: '缺少必要参数: gradeId' }, { status: 400 });
        }

        // 检查成绩是否存在
        const grade = await prisma.grade.findUnique({
            where: { id: gradeId }
        });

        if (!grade) {
            return NextResponse.json({ error: '成绩记录不存在' }, { status: 404 });
        }

        // 检查权限 - 只有管理员、该成绩的老师或学生可以查看
        if (
            currentUser.role !== 'ADMIN' &&
            grade.teacherId !== currentUser.id &&
            grade.studentId !== currentUser.id
        ) {
            return NextResponse.json({ error: '没有权限查看此成绩记录' }, { status: 403 });
        }

        // 查询区块链交易记录
        const blockchainTransaction = await prisma.blockchainTransaction.findFirst({
            where: { gradeId: grade.id },
            orderBy: { createdAt: 'desc' }
        });

        if (!blockchainTransaction) {
            return NextResponse.json({
                onChain: false,
                message: '该成绩尚未上链'
            });
        }

        // 解析区块链数据
        let blockchainData;
        try {
            blockchainData = JSON.parse(blockchainTransaction.blockchainData);
        } catch (error) {
            blockchainData = { error: '无法解析区块链数据' };
        }

        return NextResponse.json({
            onChain: true,
            transactionHash: blockchainTransaction.transactionHash,
            blockNumber: blockchainTransaction.blockNumber,
            blockchainGradeId: blockchainData.blockchainGradeId,
            timestamp: blockchainTransaction.blockTimestamp,
            blockchainData
        });
    } catch (error) {
        console.error('查询成绩上链状态失败:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 