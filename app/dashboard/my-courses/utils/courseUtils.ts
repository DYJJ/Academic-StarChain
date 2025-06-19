import { Course, GradeData } from '../types';

// 获取学期标签颜色
export const getSemesterColor = (semester: string) => {
  const colors: Record<string, string> = {
    '2023-2024-1': 'magenta',
    '2023-2024-2': 'red',
    '2024-2025-1': 'volcano',
    '2024-2025-2': 'orange',
    '2025-2026-1': 'gold'
  };
  return colors[semester] || 'blue';
};

// 获取教学进度
export const getTeachingProgress = (course: Course) => {
  // 实际应用中可以从后端获取真实数据
  const semesterMap: { [key: string]: number } = {
    '2023-2024-1': 100,
    '2023-2024-2': 85,
    '2024-2025-1': 62,
    '2024-2025-2': 30,
    '2025-2026-1': 15
  };
  return semesterMap[course.semester] || 0;
};

// 获取学期名称
export const getSemesterName = (semester: string) => {
  const parts = semester.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1]}学年第${parts[2]}学期`;
  }
  return semester;
};

// 计算实际学生数量（去重）
export const getRealStudentCount = (courses: Course[]) => {
  // 创建一个Set存储所有唯一的学生ID
  const uniqueStudentIds = new Set<string>();
  
  // 遍历所有课程及其学生
  courses.forEach(course => {
    if (course.students && course.students.length > 0) {
      course.students.forEach(student => {
        if (student.id) {
          uniqueStudentIds.add(student.id);
        }
      });
    }
  });
  
  // 返回唯一学生ID的数量
  return uniqueStudentIds.size || 1; // 至少返回1，避免无学生时显示0
};

// 计算平均成绩
export const calculateAverageGrade = (gradeData: GradeData[]) => {
  const totalStudents = gradeData.reduce((sum, item) => sum + item.count, 0);
  
  if (totalStudents === 0) return "0.0";
  
  return (
    gradeData.reduce((sum, item) => {
      const midpoint = item.range === '< 60' ? 55 : parseInt(item.range.split('-')[0]) + 5;
      return sum + midpoint * item.count;
    }, 0) / totalStudents
  ).toFixed(1);
};

// 计算通过率
export const calculatePassRate = (gradeData: GradeData[]) => {
  const totalStudents = gradeData.reduce((sum, item) => sum + item.count, 0);
  const failCount = gradeData.find(item => item.range === '< 60')?.count || 0;
  
  if (totalStudents === 0) return 0;
  
  return Math.round((totalStudents - failCount) / totalStudents * 100);
}; 