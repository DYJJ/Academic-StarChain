import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { cookies } from 'next/headers';

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
    import('../../../../../lib/ethereum').then(module => {
        ethereumService = module.default || module;
        console.log('成功加载以太坊验证服务');
    }).catch(error => {
        console.error('加载以太坊服务失败:', error);

        // 创建一个模拟版本
        ethereumService = {
            verifyGrade: async (blockchainGradeId: string) => {
                console.log('使用API验证模拟以太坊服务验证成绩:', blockchainGradeId);

                try {
                    let transaction;
                    try {
                        // 从数据库查询交易记录
                        // @ts-ignore
                        transaction = await prisma.blockchainTransaction.findFirst({
                            where: {
                                OR: [
                                    { blockchainData: { contains: blockchainGradeId } },
                                    { transactionHash: blockchainGradeId },
                                    { gradeId: blockchainGradeId }
                                ]
                            }
                        });
                    } catch (dbError) {
                        console.error('验证时查询交易记录失败:', dbError);
                        return { exists: false, gradeData: null, error: '数据库查询失败' };
                    }

                    if (!transaction) {
                        return { exists: false, gradeData: null };
                    }

                    try {
                        // 解析区块链数据
                        const blockchainData = JSON.parse(transaction.blockchainData);

                        return {
                            exists: true,
                            transactionHash: transaction.transactionHash,
                            blockNumber: transaction.blockNumber,
                            blockTimestamp: transaction.blockTimestamp,
                            gradeData: blockchainData.gradeData || blockchainData
                        };
                    } catch (parseError) {
                        console.error('解析区块链数据失败:', parseError);
                        return {
                            exists: true,
                            transactionHash: transaction.transactionHash,
                            blockNumber: transaction.blockNumber,
                            blockTimestamp: transaction.blockTimestamp,
                            gradeData: null,
                            error: '数据格式错误'
                        };
                    }
                } catch (error) {
                    console.error('验证成绩时出错:', error);
                    return { exists: false, gradeData: null, error: '验证失败' };
                }
            }
        };
    });
} catch (error) {
    console.error('加载以太坊服务失败:', error);

    // 创建一个模拟版本
    ethereumService = {
        verifyGrade: async (blockchainGradeId: string) => {
            console.log('使用API验证模拟以太坊服务验证成绩:', blockchainGradeId);

            try {
                let transaction;
                try {
                    // 从数据库查询交易记录
                    // @ts-ignore
                    transaction = await prisma.blockchainTransaction.findFirst({
                        where: {
                            OR: [
                                { blockchainData: { contains: blockchainGradeId } },
                                { transactionHash: blockchainGradeId },
                                { gradeId: blockchainGradeId }
                            ]
                        }
                    });
                } catch (dbError) {
                    console.error('验证时查询交易记录失败:', dbError);
                    return { exists: false, gradeData: null, error: '数据库查询失败' };
                }

                if (!transaction) {
                    return { exists: false, gradeData: null };
                }

                try {
                    // 解析区块链数据
                    const blockchainData = JSON.parse(transaction.blockchainData);

                    return {
                        exists: true,
                        transactionHash: transaction.transactionHash,
                        blockNumber: transaction.blockNumber,
                        blockTimestamp: transaction.blockTimestamp,
                        gradeData: blockchainData.gradeData || blockchainData
                    };
                } catch (parseError) {
                    console.error('解析区块链数据失败:', parseError);
                    return {
                        exists: true,
                        transactionHash: transaction.transactionHash,
                        blockNumber: transaction.blockNumber,
                        blockTimestamp: transaction.blockTimestamp,
                        gradeData: null,
                        error: '数据格式错误'
                    };
                }
            } catch (error) {
                console.error('验证成绩时出错:', error);
                return { exists: false, gradeData: null, error: '验证失败' };
            }
        }
    };
}

// GET方法 - 验证区块链上的成绩
export async function GET(request: NextRequest) {
    try {
        // 获取当前用户
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: '未授权操作' }, { status: 401 });
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const transactionHash = searchParams.get('txHash');
        const gradeId = searchParams.get('gradeId');
        const blockchainGradeId = searchParams.get('blockchainGradeId');

        if (!transactionHash && !gradeId && !blockchainGradeId) {
            return NextResponse.json(
                { error: '请提供交易哈希、成绩ID或区块链成绩ID' },
                { status: 400 }
            );
        }

        let blockchainTransaction;
        let verificationResult;

        // 首先尝试直接从数据库查询交易记录
        try {
            const where: any = {};

            if (transactionHash) {
                where.transactionHash = transactionHash;
            } else if (blockchainGradeId) {
                where.blockchainData = { contains: blockchainGradeId };
            } else if (gradeId) {
                where.gradeId = gradeId;
            }

            // @ts-ignore
            blockchainTransaction = await prisma.blockchainTransaction.findFirst({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    grade: {
                        include: {
                            course: true,
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
                            }
                        }
                    }
                }
            });

            console.log('查询到交易记录:', blockchainTransaction ? blockchainTransaction.id : '未找到');
        } catch (dbError) {
            console.error('查询数据库失败:', dbError);
            // 继续尝试区块链验证
        }

        // 如果找到了交易记录，进行验证
        if (blockchainTransaction) {
            let queryId;

            try {
                // 解析区块链数据
                const blockchainData = JSON.parse(blockchainTransaction.blockchainData || '{}');
                queryId = blockchainData.blockchainGradeId || transactionHash || blockchainGradeId || blockchainTransaction.transactionHash;
            } catch (parseError) {
                console.error('解析区块链数据失败:', parseError);
                queryId = transactionHash || blockchainGradeId || blockchainTransaction.transactionHash;
            }

            // 验证区块链数据
            try {
                verificationResult = await ethereumService.verifyGrade(queryId);
            } catch (vError) {
                console.warn('区块链验证失败，但已找到数据库记录:', vError);
                // 如果区块链验证失败，但有数据库记录，则返回数据库记录
                verificationResult = {
                    exists: true,
                    blockchainGradeId: queryId,
                    transactionHash: blockchainTransaction.transactionHash,
                    blockNumber: blockchainTransaction.blockNumber,
                    blockTimestamp: blockchainTransaction.blockTimestamp,
                    data: null,
                    warning: '区块链验证失败，显示数据库记录'
                };
            }
        } else if (blockchainGradeId) {
            // 直接使用区块链ID验证
            try {
                verificationResult = await ethereumService.verifyGrade(blockchainGradeId);
            } catch (vError) {
                console.error('区块链验证失败:', vError);
                return NextResponse.json({
                    error: '区块链验证失败',
                    details: vError instanceof Error ? vError.message : '未知区块链错误'
                }, { status: 500 });
            }

            // 如果验证成功，尝试查找关联的交易记录
            if (verificationResult && verificationResult.exists) {
                try {
                    // @ts-ignore
                    blockchainTransaction = await prisma.blockchainTransaction.findFirst({
                        where: {
                            OR: [
                                { blockchainData: { contains: blockchainGradeId } },
                                { transactionHash: verificationResult.transactionHash }
                            ]
                        },
                        include: {
                            grade: {
                                include: {
                                    course: true,
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
                                    }
                                }
                            }
                        }
                    });
                } catch (dbError) {
                    console.warn('查询关联交易记录失败，但验证已完成:', dbError);
                }
            }
        } else if (transactionHash) {
            // 使用交易哈希直接验证
            try {
                verificationResult = await ethereumService.verifyGrade(transactionHash);
            } catch (vError) {
                console.error('区块链验证失败:', vError);
                return NextResponse.json({
                    error: '区块链验证失败',
                    details: vError instanceof Error ? vError.message : '未知区块链错误'
                }, { status: 500 });
            }
        } else if (gradeId) {
            // 尝试查找成绩的区块链记录
            return NextResponse.json({
                error: '未找到关联的区块链交易记录',
                verified: false
            }, { status: 404 });
        }

        // 如果没有查询到任何数据，返回未找到
        if (!verificationResult && !blockchainTransaction) {
            return NextResponse.json(
                { error: '未找到区块链交易记录', verified: false },
                { status: 404 }
            );
        }

        // 记录系统日志
        try {
            await prisma.systemLog.create({
                data: {
                    userId: currentUser.id,
                    action: '区块链验证',
                    details: `用户${currentUser.name}验证了区块链上的成绩记录(${blockchainTransaction?.transactionHash ||
                        blockchainGradeId ||
                        transactionHash ||
                        gradeId
                        })`,
                    ipAddress: request.headers.get('x-forwarded-for') || '未知'
                }
            });
        } catch (logError) {
            console.warn('记录系统日志失败，但验证已完成:', logError);
        }

        return NextResponse.json({
            verified: verificationResult?.exists || (blockchainTransaction != null),
            blockchainData: verificationResult?.data || null,
            databaseRecord: blockchainTransaction ? {
                id: blockchainTransaction.id,
                transactionHash: blockchainTransaction.transactionHash,
                blockNumber: blockchainTransaction.blockNumber,
                timestamp: blockchainTransaction.blockTimestamp,
                grade: blockchainTransaction.grade,
                blockchainGradeId: verificationResult?.blockchainGradeId || null
            } : null,
            warning: verificationResult?.warning || null,
            message: verificationResult?.error || null
        });
    } catch (error) {
        console.error('验证区块链成绩失败:', error);
        return NextResponse.json(
            { error: '验证区块链成绩失败', details: error instanceof Error ? error.message : '未知错误', verified: false },
            { status: 500 }
        );
    }
} 