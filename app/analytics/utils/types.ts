// 成绩数据接口
export interface GradeData {
  id: string;
  courseId: string;
  courseName: string;
  score: number;
  semester: string;
  date: string;
  status?: string;
}

// 申诉类型枚举
export type AppealType = 'SCORE_ERROR' | 'CALCULATION_ERROR' | 'MISSING_POINTS' | 'OTHER';

// 申诉状态枚举
export type AppealStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

// 申诉数据接口
export interface AppealData {
  id: string;
  gradeId: string;
  type: AppealType;
  reason: string;
  expectedScore?: number;
  evidence?: string;
  status: AppealStatus;
  teacherComment?: string;
  meetingTime?: string;
  createdAt: string;
  updatedAt: string;
}

// 定义趋势数据类型
export interface TrendDataPoint {
  course: string;
  date: string;
  score: number;
  semester: string;
  formattedDate: string;
  status?: string;
}

// 用于图表数据点的接口
export interface ChartDataPoint {
  date: string;
  formattedDate?: string;
  [key: string]: any; // 允许动态添加课程名称作为属性
}

// 课程变化率数据接口
export interface CourseChangeRate {
  change: number;
  rate: number;
  startDate: string;
  endDate: string;
  startScore: number;
  endScore: number;
}

// 统计数据接口
export interface StatsData {
  avg: number;
  highest: number;
  lowest: number;
}

// Tooltip接口
export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
} 