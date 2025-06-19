import { StatsData, GradeData, TrendDataPoint } from './types';

// 计算统计数据
export const calculateStats = (distributionData: any[]): StatsData => {
  if (!distributionData.length) return { avg: 0, highest: 0, lowest: 0 };
  
  let totalScore = 0;
  let totalCount = 0;
  let highest = 0;
  let lowest = 100;
  
  for (const item of distributionData) {
    totalScore += item.score * item.count;
    totalCount += item.count;
    highest = Math.max(highest, item.score);
    lowest = Math.min(lowest, item.score);
  }
  
  return { 
    avg: totalCount ? totalScore / totalCount : 0, 
    highest, 
    lowest 
  };
};

// 格式化日期显示
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

// 处理成绩数据
export const processGradesData = (grades: any[]): GradeData[] => {
  return grades.map((grade: any) => ({
    ...grade,
    // 确保日期是字符串
    date: typeof grade.date === 'string' 
      ? grade.date.split('T')[0] 
      : new Date(grade.date).toISOString().split('T')[0]
  }));
};

// 提取课程选项
export const extractCourseOptions = (grades: GradeData[]) => {
  const courses = [];
  const courseMap = new Map();
  
  for (const grade of grades) {
    if (!courseMap.has(grade.courseId)) {
      courseMap.set(grade.courseId, grade.courseName);
      courses.push(grade.courseId);
    }
  }
  
  const courseOpts = courses.map(courseId => {
    return { value: courseId, label: courseMap.get(courseId) };
  });
  
  return [{value: 'all', label: '所有课程'}, ...courseOpts];
};

// 提取学期选项
export const extractSemesterOptions = (grades: GradeData[]) => {
  const semesters = [];
  const semesterSet = new Map();
  
  for (const grade of grades) {
    if (!semesterSet.has(grade.semester)) {
      semesterSet.set(grade.semester, true);
      semesters.push(grade.semester);
    }
  }
  
  const semesterOpts = semesters.map(sem => ({value: sem, label: sem}));
  return [{value: 'all', label: '所有学期'}, ...semesterOpts];
};

// 筛选成绩数据
export const filterGradesBySelection = (
  grades: GradeData[], 
  selectedCourse: string, 
  selectedSemester: string
): GradeData[] => {
  return grades.filter(grade => {
    const courseMatch = selectedCourse === 'all' || grade.courseId === selectedCourse;
    const semesterMatch = selectedSemester === 'all' || grade.semester === selectedSemester;
    return courseMatch && semesterMatch;
  });
}; 