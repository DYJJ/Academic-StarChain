'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Select, Button, Typography, Tabs, Table, Tag, Divider, Alert, Spin } from 'antd';
import { PieChartOutlined, BarChartOutlined, FileExcelOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 定义统计数据类型
type CourseStatistics = {
  id: string;
  name: string;
  code: string;
  semester: string;
  totalStudents: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  passCount: number;
  failCount: number;
};

type StudentStatistics = {
  id: string;
  name: string;
  email: string;
  totalCourses: number;
  averageScore: number;
  totalCredits: number;
  passedCredits: number;
  gpa: number;
  courseScores: {
    courseId: string;
    courseName: string;
    courseCode: string;
    score: number;
    credit: number;
  }[];
};

type SemesterStatistics = {
  semester: string;
  totalCourses: number;
  totalStudents: number;
  totalRecords: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
};

type OverviewStatistics = {
  totalStudents: number;
  totalCourses: number;
  totalRecords: number;
  totalPassedRecords: number;
  failedRecords: number;
  passRate: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    pass: number;
    fail: number;
  };
};

interface GradeStatisticsProps {
  grades: any[];
}

export default function GradeStatistics({ grades = [] }: GradeStatisticsProps) {
  // 统计类型
  const [statType, setStatType] = useState<'course' | 'student' | 'semester' | 'overview'>('overview');
<<<<<<< HEAD

=======
  
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
  // 筛选条件
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [semester, setSemester] = useState('');
<<<<<<< HEAD

=======
  
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
  // 统计数据
  const [courseStats, setCourseStats] = useState<CourseStatistics[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStatistics[]>([]);
  const [semesterStats, setSemesterStats] = useState<SemesterStatistics[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStatistics | null>(null);
<<<<<<< HEAD

  // 加载状态和错误信息
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 课程和学生列表（用于筛选）
  const [courses, setCourses] = useState<{ id: string; name: string; code: string; semester: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);

=======
  
  // 加载状态和错误信息
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 课程和学生列表（用于筛选）
  const [courses, setCourses] = useState<{ id: string; name: string; code: string; semester: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; email: string }[]>([]);
  
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
  // 获取筛选选项的唯一学期列表
  const [semesters, setSemesters] = useState<string[]>([]);

  // 加载筛选选项
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        // 加载课程列表
        const coursesResponse = await fetch('/api/courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData.courses || []);
<<<<<<< HEAD

=======
          
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
          // 提取唯一的学期
          const uniqueSemesters = Array.from(new Set(coursesData.courses.map((c: any) => c.semester))) as string[];
          setSemesters(uniqueSemesters.sort().reverse());
        }
<<<<<<< HEAD

=======
        
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        // 加载学生列表
        const studentsResponse = await fetch('/api/users?role=STUDENT');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData.users || []);
        }
      } catch (err) {
        console.error('加载筛选选项时出错:', err);
      }
    }
<<<<<<< HEAD

=======
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    loadFilterOptions();
  }, []);

  // 获取统计数据
  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoading(true);
        setError('');
<<<<<<< HEAD

        // 构建查询参数
        const params = new URLSearchParams();
        params.append('type', statType);

        if (courseId) params.append('courseId', courseId);
        if (studentId) params.append('studentId', studentId);
        if (semester) params.append('semester', semester);

        const response = await fetch(`/api/grades/statistics?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`获取统计数据失败: ${response.status}`);
        }

        const data = await response.json();

=======
        
        // 构建查询参数
        const params = new URLSearchParams();
        params.append('type', statType);
        
        if (courseId) params.append('courseId', courseId);
        if (studentId) params.append('studentId', studentId);
        if (semester) params.append('semester', semester);
        
        const response = await fetch(`/api/grades/statistics?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`获取统计数据失败: ${response.status}`);
        }
        
        const data = await response.json();
        
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        // 根据统计类型设置相应的状态
        if (statType === 'course') {
          setCourseStats(data.statistics || []);
        } else if (statType === 'student') {
          setStudentStats(data.statistics || []);
        } else if (statType === 'semester') {
          setSemesterStats(data.statistics || []);
        } else if (statType === 'overview') {
          setOverviewStats(data.statistics || null);
        }
<<<<<<< HEAD

=======
        
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
        setLoading(false);
      } catch (err: any) {
        console.error('获取统计数据时出错:', err);
        setError(`获取统计数据失败: ${err.message}`);
        setLoading(false);
      }
    }
<<<<<<< HEAD

=======
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    fetchStatistics();
  }, [statType, courseId, studentId, semester]);

  // 使用传入的成绩计算简单统计数据
  const calculateSummaryStats = () => {
    if (!grades || grades.length === 0) {
      return {
        totalCount: 0,
        averageScore: 0,
        passCount: 0,
        failCount: 0,
        passRate: 0,
        distribution: {
          excellent: 0,
          good: 0,
          average: 0,
          pass: 0,
          fail: 0
        }
      };
    }

    // 计算总数和平均分
    const totalCount = grades.length;
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const averageScore = totalCount > 0 ? totalScore / totalCount : 0;

    // 计算通过率
    const passCount = grades.filter(grade => grade.score >= 60).length;
    const failCount = totalCount - passCount;
    const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 0;

    // 计算分数分布
    const distribution = {
      excellent: grades.filter(grade => grade.score >= 90).length,
      good: grades.filter(grade => grade.score >= 80 && grade.score < 90).length,
      average: grades.filter(grade => grade.score >= 70 && grade.score < 80).length,
      pass: grades.filter(grade => grade.score >= 60 && grade.score < 70).length,
      fail: grades.filter(grade => grade.score < 60).length
    };

    return {
      totalCount,
      averageScore,
      passCount,
      failCount,
      passRate,
      distribution
    };
  };

  const summaryStats = calculateSummaryStats();

  // 导出CSV函数
  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
<<<<<<< HEAD

=======
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    // 根据不同的统计类型生成CSV内容
    if (statType === 'course' && courseStats.length > 0) {
      // 课程统计的CSV表头
      csvContent = '课程ID,课程代码,课程名称,学期,学生总数,平均分,最高分,最低分,优秀人数,良好人数,中等人数,及格人数,不及格人数\n';
<<<<<<< HEAD

=======
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      // 添加每行数据
      courseStats.forEach(stat => {
        const row = [
          stat.id,
          stat.code,
          stat.name,
          stat.semester,
          stat.totalStudents,
          stat.averageScore,
          stat.maxScore,
          stat.minScore,
          stat.excellentCount,
          stat.goodCount,
          stat.averageCount,
          stat.passCount,
          stat.failCount
        ].join(',');
<<<<<<< HEAD

        csvContent += row + '\n';
      });

=======
        
        csvContent += row + '\n';
      });
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      filename = `课程成绩统计_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (statType === 'student' && studentStats.length > 0) {
      // 学生统计的CSV表头
      csvContent = '学生ID,学生姓名,邮箱,课程总数,平均分,总学分,已通过学分,GPA\n';
<<<<<<< HEAD

=======
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      // 添加每行数据
      studentStats.forEach(stat => {
        const row = [
          stat.id,
          stat.name,
          stat.email,
          stat.totalCourses,
          stat.averageScore,
          stat.totalCredits,
          stat.passedCredits,
          stat.gpa
        ].join(',');
<<<<<<< HEAD

        csvContent += row + '\n';
      });

=======
        
        csvContent += row + '\n';
      });
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      filename = `学生成绩统计_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (statType === 'semester' && semesterStats.length > 0) {
      // 学期统计的CSV表头
      csvContent = '学期,课程总数,学生总数,成绩记录数,平均分,优秀人数,良好人数,中等人数,及格人数,不及格人数\n';
<<<<<<< HEAD

=======
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      // 添加每行数据
      semesterStats.forEach(stat => {
        const row = [
          stat.semester,
          stat.totalCourses,
          stat.totalStudents,
          stat.totalRecords,
          stat.averageScore,
          stat.excellentCount,
          stat.goodCount,
          stat.averageCount,
          stat.passCount,
          stat.failCount
        ].join(',');
<<<<<<< HEAD

        csvContent += row + '\n';
      });

=======
        
        csvContent += row + '\n';
      });
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      filename = `学期成绩统计_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (statType === 'overview' && overviewStats) {
      // 总览统计的CSV表头
      csvContent = '学生总数,课程总数,成绩记录总数,通过记录数,不及格记录数,通过率,平均分,优秀人数,良好人数,中等人数,及格人数,不及格人数\n';
<<<<<<< HEAD

=======
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      // 添加数据
      const row = [
        overviewStats.totalStudents,
        overviewStats.totalCourses,
        overviewStats.totalRecords,
        overviewStats.totalPassedRecords,
        overviewStats.failedRecords,
        overviewStats.passRate + '%',
        overviewStats.averageScore,
        overviewStats.distribution.excellent,
        overviewStats.distribution.good,
        overviewStats.distribution.average,
        overviewStats.distribution.pass,
        overviewStats.distribution.fail
      ].join(',');
<<<<<<< HEAD

      csvContent += row + '\n';

=======
      
      csvContent += row + '\n';
      
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
      filename = `成绩总览统计_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      setError('没有可导出的数据');
      return;
    }
<<<<<<< HEAD

    // 创建Blob对象
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

=======
    
    // 创建Blob对象
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    // 创建下载链接
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
<<<<<<< HEAD

    // 触发下载
    link.click();

=======
    
    // 触发下载
    link.click();
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    // 清理
    document.body.removeChild(link);
  };

  // 渲染分布图表
  const renderDistributionChart = (data: { [key: string]: number } | null, labels: { [key: string]: string }) => {
    if (!data) return null;
<<<<<<< HEAD

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return <p className="text-gray-500 text-center py-4">暂无数据</p>;

=======
    
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return <p className="text-gray-500 text-center py-4">暂无数据</p>;
    
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    return (
      <div className="flex items-end h-40 mt-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex-1 flex flex-col items-center">
<<<<<<< HEAD
            <div
              className="w-full bg-blue-500 rounded-t"
              style={{
                height: `${Math.max((value / total) * 100, 5)}%`,
                backgroundColor:
                  key === 'excellent' ? '#10B981' : // 绿色
                    key === 'good' ? '#3B82F6' :      // 蓝色
                      key === 'average' ? '#6366F1' :   // 靛蓝色
                        key === 'pass' ? '#F59E0B' :      // 黄色
                          '#EF4444'                         // 红色
=======
            <div 
              className="w-full bg-blue-500 rounded-t"
              style={{ 
                height: `${Math.max((value / total) * 100, 5)}%`,
                backgroundColor: 
                  key === 'excellent' ? '#10B981' : // 绿色
                  key === 'good' ? '#3B82F6' :      // 蓝色
                  key === 'average' ? '#6366F1' :   // 靛蓝色
                  key === 'pass' ? '#F59E0B' :      // 黄色
                  '#EF4444'                         // 红色
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
              }}
            ></div>
            <span className="text-xs mt-1">{labels[key]}</span>
            <span className="text-xs font-medium">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-6 py-5">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={4}>成绩统计分析</Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="成绩总数"
              value={summaryStats.totalCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="平均分"
              value={summaryStats.averageScore.toFixed(1)}
              precision={1}
              valueStyle={{ color: summaryStats.averageScore >= 80 ? '#3f8600' : summaryStats.averageScore >= 60 ? '#faad14' : '#ff4d4f' }}
              suffix="分"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic
              title="通过率"
              value={summaryStats.passRate}
              precision={2}
              valueStyle={{ color: summaryStats.passRate >= 80 ? '#3f8600' : '#faad14' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="通过"
                  value={summaryStats.passCount}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="不及格"
                  value={summaryStats.failCount}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="分数分布" size="small">
            <Row gutter={8}>
              <Col span={4}>
                <Statistic
                  title="优秀(>=90)"
                  value={summaryStats.distribution.excellent}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="良好(80-89)"
                  value={summaryStats.distribution.good}
                  valueStyle={{ color: '#7cb305' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="中等(70-79)"
                  value={summaryStats.distribution.average}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="及格(60-69)"
                  value={summaryStats.distribution.pass}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="不及格(<60)"
                  value={summaryStats.distribution.fail}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 更多高级统计内容可以根据需要添加 */}

      {error && (
        <Alert
          message="获取统计数据失败"
          description={error}
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
} 