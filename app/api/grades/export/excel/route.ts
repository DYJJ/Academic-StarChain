import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../../lib/prisma';
import { LogAction, logAction } from '../../../../utils/logger';
import ExcelJS from 'exceljs';

// 获取当前用户信息
function getCurrentUser(request: NextRequest) {
  const cookieStore = cookies();
  const userSession = cookieStore.get('user_session')?.value;

  if (!userSession) {
    console.log('未找到用户会话');
    return null;
  }

  try {
    const user = JSON.parse(userSession);
    console.log('当前用户:', user);
    return user;
  } catch (error) {
    console.error('解析用户会话失败:', error);
    return null;
  }
}

// 导出Excel成绩
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/grades/export/excel 被调用');

    // 获取当前用户
    const currentUser = getCurrentUser(request);

    // 检查是否登录
    if (!currentUser) {
      console.log('用户未登录');
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('查询参数:', { courseId, startDate, endDate });

    try {
      // 记录日志 - 使用新的logAction接口
      await logAction(LogAction.EXPORT_GRADE, `用户导出Excel成绩数据`, currentUser.id);
    } catch (logError) {
      console.error('日志记录失败:', logError);
      // 继续执行，不让日志错误影响主要功能
    }

    // 构建查询条件
    const where: any = {};

    if (currentUser.role === 'STUDENT') {
      where.studentId = currentUser.id;
    } else if (currentUser.role === 'TEACHER') {
      where.teacherId = currentUser.id;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    console.log('查询条件:', where);

    // 查询成绩
    const grades = await prisma.grade.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            semester: true,
            credit: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`查询到 ${grades.length} 条成绩记录`);

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '成绩管理系统';
    workbook.lastModifiedBy = currentUser.name;
    workbook.created = new Date();
    workbook.modified = new Date();

    // 添加工作表
    const worksheet = workbook.addWorksheet('成绩单');
    worksheet.columns = [
      { header: '课程名称', key: 'courseName', width: 20 },
      { header: '课程代码', key: 'courseCode', width: 15 },
      { header: '学期', key: 'semester', width: 20 },
      { header: '学分', key: 'credit', width: 10 },
      { header: '项目', key: 'name', width: 20 },
      { header: '成绩', key: 'score', width: 10 },
      { header: '教师', key: 'teacherName', width: 15 },
      { header: '日期', key: 'createdAt', width: 15 }
    ];

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 添加数据
    grades.forEach(grade => {
      worksheet.addRow({
        courseName: grade.course?.name || '未知课程',
        courseCode: grade.course?.code || '',
        semester: grade.course?.semester || '',
        credit: grade.course?.credit || 0,
        name: grade.name || '未命名',
        score: grade.score || 0,
        teacherName: grade.teacher?.name || '未知',
        createdAt: grade.createdAt ? new Date(grade.createdAt).toLocaleDateString() : '未知'
      });
    });

    // 添加用户信息工作表
    const userSheet = workbook.addWorksheet('用户信息');
    userSheet.columns = [
      { header: '项目', key: 'item', width: 15 },
      { header: '内容', key: 'value', width: 30 }
    ];

    // 设置表头样式
    userSheet.getRow(1).font = { bold: true };
    userSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 添加用户信息
    userSheet.addRow({ item: '姓名', value: currentUser.name });
    userSheet.addRow({ item: '角色', value: currentUser.role === 'STUDENT' ? '学生' : '教师' });
    userSheet.addRow({ item: '邮箱', value: currentUser.email });
    userSheet.addRow({ item: '导出日期', value: new Date().toLocaleDateString() });

    try {
      // 生成Excel文件
      console.log('正在生成Excel文件...');

      // 检查是否有数据
      if (grades.length === 0) {
        console.log('没有找到成绩数据');
        return NextResponse.json(
          { error: '没有找到可导出的成绩数据' },
          { status: 404 }
        );
      }

      // 确保所有数据都是有效的
      grades.forEach((grade, index) => {
        if (!grade.course) {
          console.warn(`警告: 第${index + 1}条成绩记录缺少课程信息`);
        }
        if (!grade.teacher) {
          console.warn(`警告: 第${index + 1}条成绩记录缺少教师信息`);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      console.log('Excel文件生成成功，大小:', buffer.length);

      // 生成文件名并进行URL编码
      const fileName = `${currentUser.name}-成绩单-${new Date().toISOString().split('T')[0]}.xlsx`;
      const encodedFileName = encodeURIComponent(fileName)
        .replace(/['()]/g, escape) // 编码特殊字符
        .replace(/\*/g, '%2A')
        .replace(/%(?:7C|60|5E)/g, unescape);

      // 返回Excel文件
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        },
      });
    } catch (excelError) {
      console.error('生成Excel文件失败:', excelError);
      return NextResponse.json(
        {
          error: '生成Excel文件失败',
          details: excelError instanceof Error ? excelError.message : String(excelError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('导出Excel成绩失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 