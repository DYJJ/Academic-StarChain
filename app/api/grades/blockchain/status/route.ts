import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../../lib/prisma';

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

// POST - 批量查询成绩是否已上链
export async function POST(request: NextRequest) {
    try {
        // 验证用户权限
        const currentUser = getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: '未授权操作' }, { status: 401 });
        }

        // 获取请求体中的成绩ID列表
        const body = await request.json();
        const { gradeIds } = body;

        if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
            return NextResponse.json({ error: '请提供有效的成绩ID数组' }, { status: 400 });
        }

        // 查询已经上链的成绩
        const blockchainTransactions = await prisma.blockchainTransaction.findMany({
            where: {
                gradeId: {
                    in: gradeIds
                }
            },
            select: {
                gradeId: true
            }
        });

        // 提取已上链的成绩ID
        const onChainGradeIds = blockchainTransactions.map(tx => tx.gradeId);

        return NextResponse.json({
            success: true,
            onChainGradeIds,
            total: onChainGradeIds.length
        });
    } catch (error) {
        console.error('查询成绩上链状态失败:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// GET - 查询单个成绩是否已上链
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

        // 查询成绩是否已上链
        const blockchainTransaction = await prisma.blockchainTransaction.findFirst({
            where: { gradeId },
            select: {
                transactionHash: true,
                blockNumber: true,
                blockTimestamp: true,
                blockchainData: true
            }
        });

        return NextResponse.json({
            success: true,
            onChain: !!blockchainTransaction,
            transactionInfo: blockchainTransaction || null
        });
    } catch (error) {
        console.error('查询成绩上链状态失败:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 