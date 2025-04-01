const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始添加教师课程关联...');

  try {
    // 获取教师
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });

    if (!teacher) {
      console.log('未找到教师账号，请先运行seed脚本创建基础数据');
      return;
    }

    // 获取所有课程
    const courses = await prisma.course.findMany();

    if (courses.length === 0) {
      console.log('未找到课程数据，请先运行seed脚本创建基础数据');
      return;
    }

    // 获取一个学生账号
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });

    if (!student) {
      console.log('未找到学生账号，请先运行seed脚本创建基础数据');
      return;
    }

    // 为每个课程创建师生关系和成绩记录
    for (const course of courses) {
      // 检查是否已经存在记录
      const existingGrade = await prisma.grade.findFirst({
        where: {
          studentId: student.id,
          teacherId: teacher.id,
          courseId: course.id
        }
      });

      if (!existingGrade) {
        // 创建成绩记录，建立师生-课程关系
        await prisma.grade.create({
          data: {
            score: Math.floor(Math.random() * 30) + 70, // 70-100之间的随机分数
            studentId: student.id,
            teacherId: teacher.id,
            courseId: course.id,
            status: 'VERIFIED' // 已验证状态
          }
        });
        console.log(`已为课程 ${course.name} 创建了师生关系`);
      } else {
        console.log(`课程 ${course.name} 的师生关系已存在`);
      }
    }

    console.log('教师课程关联添加完成！');
  } catch (error) {
    console.error('添加教师课程关联时出错:', error);
  }
}

main()
  .catch(e => {
    console.error('执行脚本时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 