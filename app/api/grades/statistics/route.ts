import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

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

// 获取成绩统计数据
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/grades/statistics 被调用');
    
    // 获取查询参数
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'course'; // 默认按课程统计
    const courseId = url.searchParams.get('courseId');
    const studentId = url.searchParams.get('studentId');
    const semester = url.searchParams.get('semester');
    
    // 获取当前用户
    const currentUser = getCurrentUser(request);
    
    // 检查是否登录
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权 - 请先登录' },
        { status: 401 }
      );
    }
    
    // 构建查询条件
    const where: any = {};
    
    // 根据角色设置不同的查询范围
    if (currentUser.role === 'STUDENT') {
      // 学生只能查看自己的成绩统计
      where.studentId = currentUser.id;
    } else if (currentUser.role === 'TEACHER') {
      // 教师只能查看自己添加的成绩统计
      where.teacherId = currentUser.id;
    }
    
    // 根据参数添加筛选条件
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (studentId && (currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER')) {
      where.studentId = studentId;
    }
    
    if (semester) {
      where.course = {
        semester
      };
    }
    
    // 获取符合条件的所有成绩
    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credit: true,
            semester: true
          }
        }
      }
    });
    
    // 根据统计类型返回不同的数据
    let statistics: any = {};
    
    if (type === 'course') {
      // 按课程统计
      const courseStats = new Map();
      
      grades.forEach(grade => {
        const courseId = grade.courseId;
        const courseName = grade.course.name;
        
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            id: courseId,
            name: courseName,
            code: grade.course.code,
            semester: grade.course.semester,
            totalStudents: 0,
            averageScore: 0,
            maxScore: 0,
            minScore: 100,
            passedCount: 0,
            excellentCount: 0, // 优秀(90分以上)
            goodCount: 0,      // 良好(80-89分)
            averageCount: 0,   // 中等(70-79分)
            passCount: 0,      // 及格(60-69分)
            failCount: 0,      // 不及格(60分以下)
            scores: []
          });
        }
        
        const stat = courseStats.get(courseId);
        stat.totalStudents++;
        
        const score = grade.score;
        stat.scores.push(score);
        
        stat.maxScore = Math.max(stat.maxScore, score);
        stat.minScore = Math.min(stat.minScore, score);
        
        if (score >= 90) {
          stat.excellentCount++;
        } else if (score >= 80) {
          stat.goodCount++;
        } else if (score >= 70) {
          stat.averageCount++;
        } else if (score >= 60) {
          stat.passCount++;
        } else {
          stat.failCount++;
        }
      });
      
      // 计算平均分
      courseStats.forEach(stat => {
        if (stat.totalStudents > 0) {
          const sum = stat.scores.reduce((a: number, b: number) => a + b, 0);
          stat.averageScore = parseFloat((sum / stat.totalStudents).toFixed(2));
        }
        delete stat.scores; // 删除原始分数数组
      });
      
      statistics = Array.from(courseStats.values());
    } else if (type === 'student') {
      // 按学生统计
      const studentStats = new Map();
      
      grades.forEach(grade => {
        const studentId = grade.studentId;
        const studentName = grade.student.name;
        
        if (!studentStats.has(studentId)) {
          studentStats.set(studentId, {
            id: studentId,
            name: studentName,
            email: grade.student.email,
            totalCourses: 0,
            averageScore: 0,
            totalCredits: 0,
            passedCredits: 0,
            gpa: 0, // 学分绩点
            courseScores: []
          });
        }
        
        const stat = studentStats.get(studentId);
        stat.totalCourses++;
        
        const score = grade.score;
        const credit = grade.course.credit;
        
        stat.courseScores.push({
          courseId: grade.courseId,
          courseName: grade.course.name,
          courseCode: grade.course.code,
          score,
          credit
        });
        
        stat.totalCredits += credit;
        
        if (score >= 60) {
          stat.passedCredits += credit;
        }
      });
      
      // 计算平均分和GPA
      studentStats.forEach(stat => {
        if (stat.totalCourses > 0) {
          // 计算平均分
          let totalScore = 0;
          let totalGradePoints = 0;
          
          stat.courseScores.forEach((course: any) => {
            totalScore += course.score;
            
            // 计算绩点 (假设4.0制)
            let gradePoint = 0;
            if (course.score >= 90) gradePoint = 4.0;
            else if (course.score >= 85) gradePoint = 3.7;
            else if (course.score >= 80) gradePoint = 3.3;
            else if (course.score >= 75) gradePoint = 3.0;
            else if (course.score >= 70) gradePoint = 2.7;
            else if (course.score >= 65) gradePoint = 2.3;
            else if (course.score >= 60) gradePoint = 2.0;
            else gradePoint = 0;
            
            totalGradePoints += gradePoint * course.credit;
          });
          
          stat.averageScore = parseFloat((totalScore / stat.totalCourses).toFixed(2));
          stat.gpa = parseFloat((totalGradePoints / stat.totalCredits).toFixed(2));
        }
      });
      
      statistics = Array.from(studentStats.values());
    } else if (type === 'semester') {
      // 按学期统计
      const semesterStats = new Map();
      
      grades.forEach(grade => {
        const semester = grade.course.semester;
        
        if (!semesterStats.has(semester)) {
          semesterStats.set(semester, {
            semester,
            totalCourses: new Set(),
            totalStudents: new Set(),
            totalRecords: 0,
            averageScore: 0,
            passCount: 0,
            failCount: 0,
            excellentCount: 0,
            goodCount: 0,
            averageCount: 0,
            scores: []
          });
        }
        
        const stat = semesterStats.get(semester);
        stat.totalCourses.add(grade.courseId);
        stat.totalStudents.add(grade.studentId);
        stat.totalRecords++;
        
        const score = grade.score;
        stat.scores.push(score);
        
        if (score >= 90) {
          stat.excellentCount++;
        } else if (score >= 80) {
          stat.goodCount++;
        } else if (score >= 70) {
          stat.averageCount++;
        } else if (score >= 60) {
          stat.passCount++;
        } else {
          stat.failCount++;
        }
      });
      
      // 处理结果
      semesterStats.forEach(stat => {
        if (stat.totalRecords > 0) {
          const sum = stat.scores.reduce((a: number, b: number) => a + b, 0);
          stat.averageScore = parseFloat((sum / stat.totalRecords).toFixed(2));
        }
        
        // 转换Set为数量
        stat.totalCourses = stat.totalCourses.size;
        stat.totalStudents = stat.totalStudents.size;
        
        delete stat.scores;
      });
      
      statistics = Array.from(semesterStats.values()).sort((a, b) => {
        // 按学期排序，假设格式为 "2023-春"
        return b.semester.localeCompare(a.semester);
      });
    } else if (type === 'overview') {
      // 全局统计概览
      let totalStudents = 0;
      let totalCourses = 0;
      let totalRecords = grades.length;
      let totalPassedRecords = 0;
      let totalScore = 0;
      let excellentCount = 0;
      let goodCount = 0;
      let averageCount = 0;
      let passCount = 0;
      let failCount = 0;
      
      const uniqueStudents = new Set();
      const uniqueCourses = new Set();
      
      grades.forEach(grade => {
        uniqueStudents.add(grade.studentId);
        uniqueCourses.add(grade.courseId);
        
        totalScore += grade.score;
        
        if (grade.score >= 90) {
          excellentCount++;
          totalPassedRecords++;
        } else if (grade.score >= 80) {
          goodCount++;
          totalPassedRecords++;
        } else if (grade.score >= 70) {
          averageCount++;
          totalPassedRecords++;
        } else if (grade.score >= 60) {
          passCount++;
          totalPassedRecords++;
        } else {
          failCount++;
        }
      });
      
      totalStudents = uniqueStudents.size;
      totalCourses = uniqueCourses.size;
      
      statistics = {
        totalStudents,
        totalCourses,
        totalRecords,
        totalPassedRecords,
        failedRecords: totalRecords - totalPassedRecords,
        passRate: totalRecords > 0 ? parseFloat(((totalPassedRecords / totalRecords) * 100).toFixed(2)) : 0,
        averageScore: totalRecords > 0 ? parseFloat((totalScore / totalRecords).toFixed(2)) : 0,
        distribution: {
          excellent: excellentCount,
          good: goodCount,
          average: averageCount,
          pass: passCount,
          fail: failCount
        }
      };
    }
    
    return NextResponse.json({ statistics }, { status: 200 });
  } catch (error) {
    console.error('获取成绩统计失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 