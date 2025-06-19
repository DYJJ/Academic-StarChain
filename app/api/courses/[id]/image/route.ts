import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAction } from '@/utils/logger';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// 处理课程图片上传
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取课程ID
    const courseId = params.id;
    
    // 获取当前用户
    const currentUser = getCurrentUser(request);
    
    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }
    
    // 检查用户是否是教师或管理员
    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '禁止访问 - 只有教师或管理员可以上传课程图片' },
        { status: 403 }
      );
    }
    
    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        users: {
          where: { id: currentUser.id }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }
    
    // 检查当前用户是否是该课程的教师
    if (currentUser.role === 'TEACHER' && course.users.length === 0) {
      return NextResponse.json(
        { error: '您不是该课程的教师，无法上传图片' },
        { status: 403 }
      );
    }
    
    // 解析multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: '未提供图片文件' },
        { status: 400 }
      );
    }
    
    // 检查文件类型
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: '只能上传图片文件' },
        { status: 400 }
      );
    }
    
    // 生成唯一文件名
    const uniqueFilename = `course_${courseId}_${uuidv4()}.${fileType.split('/')[1]}`;
    
    // 设置图片保存路径
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'courses');
    const filePath = join(uploadDir, uniqueFilename);
    
    // 以Buffer形式读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    try {
      // 确保目录存在
      await import('fs').then(fs => {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      });
      
      // 写入文件
      await writeFile(filePath, fileBuffer);
      
      // 更新课程记录中的图片URL
      const imageUrl = `/uploads/courses/${uniqueFilename}`;
      await prisma.course.update({
        where: { id: courseId },
        data: { imageUrl }
      });
      
      // 记录操作日志
      await logAction(
        'UPDATE_COURSE',
        `更新课程图片: ${course.name} (${course.code})`,
        currentUser.id
      );
      
      return NextResponse.json({ 
        success: true,
        message: '课程图片上传成功',
        imageUrl
      });
    } catch (fileError) {
      console.error('文件处理错误:', fileError);
      return NextResponse.json(
        { error: '文件保存失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('上传课程图片失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除课程图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取课程ID
    const courseId = params.id;
    
    // 获取当前用户
    const currentUser = getCurrentUser(request);
    
    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }
    
    // 检查用户是否是教师或管理员
    if (currentUser.role !== 'TEACHER' && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '禁止访问 - 只有教师或管理员可以删除课程图片' },
        { status: 403 }
      );
    }
    
    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        users: {
          where: { id: currentUser.id }
        }
      }
    });
    
    if (!course) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }
    
    // 检查当前用户是否是该课程的教师
    if (currentUser.role === 'TEACHER' && course.users.length === 0) {
      return NextResponse.json(
        { error: '您不是该课程的教师，无法删除图片' },
        { status: 403 }
      );
    }
    
    // 如果课程没有图片，直接返回成功
    if (!course.imageUrl) {
      return NextResponse.json({
        success: true,
        message: '课程没有图片'
      });
    }
    
    try {
      // 获取文件路径
      const filePath = join(process.cwd(), 'public', course.imageUrl);
      
      // 检查文件是否存在
      await import('fs').then(fs => {
        if (fs.existsSync(filePath)) {
          // 删除文件
          fs.unlinkSync(filePath);
        }
      });
      
      // 更新课程记录，清空图片URL
      await prisma.course.update({
        where: { id: courseId },
        data: { imageUrl: null }
      });
      
      // 记录操作日志
      await logAction(
        'UPDATE_COURSE',
        `删除课程图片: ${course.name} (${course.code})`,
        currentUser.id
      );
      
      return NextResponse.json({
        success: true,
        message: '课程图片删除成功'
      });
    } catch (fileError) {
      console.error('文件删除错误:', fileError);
      return NextResponse.json(
        { error: '文件删除失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('删除课程图片失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 