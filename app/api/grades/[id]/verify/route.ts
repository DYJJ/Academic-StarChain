// 更新成绩状态并创建验证记录
const updatedGrade = await prisma.$transaction(async (prisma) => {
    // 更新成绩状态
    const updatedGrade = await prisma.grade.update({
        where: { id },
        data: { status },
        include: {
            student: {
                select: {
                    name: true,
                },
            },
            teacher: {
                select: {
                    name: true,
                },
            },
            course: {
                select: {
                    name: true,
                    code: true,
                },
            },
        },
    });

    // 创建验证记录
    await prisma.verification.create({
        data: {
            gradeId: id,
            userId: currentUser.id,
            message: status === 'VERIFIED' ? '成绩已通过验证' : '成绩未通过验证',
        },
    });

    // 记录验证操作
    await prisma.systemLog.create({
        data: {
            userId: currentUser.id,
            action: '验证成绩',
            details: `${status === 'VERIFIED' ? '通过' : '拒绝'}了学生 ${updatedGrade.student.name} 的课程 ${updatedGrade.course.name}(${updatedGrade.course.code}) 成绩: ${updatedGrade.score}分`,
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '未知IP'
        }
    });

    return updatedGrade;
}); 