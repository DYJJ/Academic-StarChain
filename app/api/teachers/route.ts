import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { logApiAction, logApiSuccess, logApiError } from '../../../lib/logMiddleware';

// 创建 Prisma 客户端实例
const prisma = new PrismaClient();

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
    const cookieStore = cookies();
    const userSession = cookieStore.get('user_session')?.value;

    if (!userSession) {
        return null;
    }

    try {
        return JSON.parse(userSession);
    } catch (error) {
        console.error('解析用户会话失败:', error);
        return null;
    }
}

// 检查用户是否为学生身份
function isStudent(user: any) {
    return user && user.role === 'STUDENT';
}

// 获取教师列表
export async function GET(request: NextRequest) {
    try {
        console.log('GET /api/teachers 被调用');
        console.log('开始查询教师数据');

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const sortField = searchParams.get('sortField') || 'comprehensive';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // 检查排序字段是否有效
        const validSortFields = ['name', 'email', 'teachergrade', 'like', 'comprehensive'];
        if (!validSortFields.includes(sortField)) {
            return NextResponse.json(
                { error: 'Invalid sortField. Allowed values are: ' + validSortFields.join(', ') },
                { status: 400 }
            );
        }

        let orderBy = {};
        
        // 如果是综合评分排序，先获取所有教师数据并手动排序
        if (sortField === 'comprehensive') {
            // 使用 Prisma 查询 user 表，筛选 role 为 teacher 的用户
            let allTeachers = await prisma.user.findMany({
                where: {
                    role: 'TEACHER'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    teachergrade: true,
                    comment: true,
                    like: true,
                    avatarUrl: true
                }
            });
            
            // 计算综合评分并排序
            allTeachers = allTeachers.map(teacher => ({
                ...teacher,
                comprehensiveScore: Number((teacher.teachergrade * 0.7 + teacher.like * 0.3).toFixed(1))
            })).sort((a, b) => {
                return sortOrder === 'desc' 
                    ? b.comprehensiveScore - a.comprehensiveScore
                    : a.comprehensiveScore - b.comprehensiveScore;
            });
            
            // 分页处理
            const startIndex = (page - 1) * limit;
            const teachers = allTeachers.slice(startIndex, startIndex + limit);
            const totalCount = allTeachers.length;
            const totalPages = Math.ceil(totalCount / limit);

            console.log(`查询到 ${teachers.length} 位教师`);

            // 记录查询日志
            const currentUser = getCurrentUser(request);
            if (currentUser) {
                await logApiAction(
                    request,
                    '查询教师列表',
                    `查询了 ${teachers.length} 位教师，页码: ${page}，每页数量: ${limit}`
                );
            }

            return NextResponse.json({
                teachers,
                totalPages,
                currentPage: page,
                totalCount
            }, { status: 200 });
        } else {
            // 普通字段排序
            orderBy = {
                [sortField]: sortOrder
            };
            
            // 使用 Prisma 查询 user 表，筛选 role 为 teacher 的用户
            const teachers = await prisma.user.findMany({
                where: {
                    role: 'TEACHER'
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    teachergrade: true,
                    comment: true,
                    like: true,
                    avatarUrl: true
                }
            });

            const totalCount = await prisma.user.count({
                where: {
                    role: 'TEACHER'
                }
            });
            const totalPages = Math.ceil(totalCount / limit);

            console.log(`查询到 ${teachers.length} 位教师`);

            // 记录查询日志
            const currentUser = getCurrentUser(request);
            if (currentUser) {
                await logApiAction(
                    request,
                    '查询教师列表',
                    `查询了 ${teachers.length} 位教师，页码: ${page}，每页数量: ${limit}`
                );
            }

            return NextResponse.json({
                teachers,
                totalPages,
                currentPage: page,
                totalCount
            }, { status: 200 });
        }
    } catch (dbError) {
        console.error('数据库查询错误:', dbError);

        // 记录错误日志
        const currentUser = getCurrentUser(request);
        if (currentUser) {
            await logApiError(
                request,
                '查询教师列表',
                dbError
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

// 更新教师信息（分数、评论或点赞）
export async function PUT(request: NextRequest) {
    try {
        const { id, action, comment, teachergrade } = await request.json();
        const currentUser = getCurrentUser(request);

        if (!id) {
            return NextResponse.json({ error: 'Missing teacher ID' }, { status: 400 });
        }

        // 权限检查：只有学生可以评价和点赞
        if (!currentUser) {
            return NextResponse.json({ error: '请先登录' }, { status: 401 });
        }
        
        if (!isStudent(currentUser)) {
            return NextResponse.json({ 
                error: '权限不足，只有学生可以对教师进行评价和点赞' 
            }, { status: 403 });
        }

        let updatedTeacher;
        let actionName = '';
        let actionDescription = '';

        if (action === 'like') {
            // 点赞操作，增加 like 字段的值
            updatedTeacher = await prisma.user.update({
                where: { id },
                data: {
                    like: {
                        increment: 1
                    }
                }
            });

            actionName = '点赞教师';
            actionDescription = `给教师 ${id} 点赞，当前点赞数为 ${updatedTeacher.like}`;
        } else if (action === 'unlike') {
            // 取消点赞操作，减少 like 字段的值
            updatedTeacher = await prisma.user.update({
                where: { id },
                data: {
                    like: {
                        decrement: 1
                    }
                }
            });

            actionName = '取消点赞教师';
            actionDescription = `取消对教师 ${id} 的点赞，当前点赞数为 ${updatedTeacher.like}`;
        } else if (action === 'comment') {
            // 验证评价内容
            if (!comment || comment.trim() === '') {
                return NextResponse.json({ 
                    error: '评价内容不能为空' 
                }, { status: 400 });
            }
            
            // 评价内容长度限制
            if (comment.length > 200) {
                return NextResponse.json({ 
                    error: '评价内容不能超过200个字符' 
                }, { status: 400 });
            }
            
            // 更新评论
            updatedTeacher = await prisma.user.update({
                where: { id },
                data: {
                    comment
                }
            });

            actionName = '更新教师评论';
            actionDescription = `更新教师 ${id} 的评论为 ${comment}`;
        } else if (action === 'grade') {
            // 评分范围检查：1-10分
            if (teachergrade < 1 || teachergrade > 10) {
                return NextResponse.json({ 
                    error: '评分范围应为1-10分' 
                }, { status: 400 });
            }
            
            // 更新评分
            updatedTeacher = await prisma.user.update({
                where: { id },
                data: {
                    teachergrade
                }
            });

            actionName = '更新教师评分';
            actionDescription = `更新教师 ${id} 的评分为 ${teachergrade}`;
        } else {
            return NextResponse.json({ error: 'Missing action or invalid action type' }, { status: 400 });
        }

        if (currentUser) {
            await logApiAction(
                request,
                actionName,
                actionDescription
            );
        }

        // 计算综合评分并返回
        const comprehensiveScore = Number((updatedTeacher.teachergrade * 0.7 + updatedTeacher.like * 0.3).toFixed(1));

        return NextResponse.json({
            message: `${actionName}成功`,
            teacher: {
                ...updatedTeacher,
                comprehensiveScore
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating teacher:', error);
        const currentUser = getCurrentUser(request);
        if (currentUser) {
            await logApiError(
                request,
                '更新教师信息',
                error
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// 处理 OPTIONS 请求（CORS 预检请求）
export async function OPTIONS(request: NextRequest) {
    const response = NextResponse.json({}, { status: 200 });

    // 设置 CORS 头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 预检请求缓存 24 小时

    return response;
}