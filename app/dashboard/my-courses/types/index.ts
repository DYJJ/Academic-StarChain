// 课程相关类型定义

export interface Teacher {
  id: string;
  name: string;
  email?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  credit: number;
  description?: string;
  studentCount?: number;
  teachers?: Teacher[];
  progress?: number; // 课程进度，0-100
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  grade?: number;
}

export interface GradeData {
  range: string;
  count: number;
  color: string;
}

export interface CourseUpdateParams {
  id?: string;
  [key: string]: any;
} 