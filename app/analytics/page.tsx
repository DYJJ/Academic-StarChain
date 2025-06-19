'use client';

import { useState, useEffect } from 'react';
import { Layout, Typography, Spin, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import BackButton from '../components/BackButton';

// 导入拆分的组件
import FilterSection from './components/FilterSection';
import StatsCards from './components/StatsCards';
import TrendChart from './components/TrendChart';
import DistributionCharts from './components/DistributionCharts';
import GradeDetails from './components/GradeDetails';
import AIAnalysis from './components/AIAnalysis';

// 导入工具函数和类型
import { GradeData, TrendDataPoint, AppealData, CourseChangeRate } from './utils/types';
import { 
  calculateStats, 
  processGradesData, 
  extractCourseOptions, 
  extractSemesterOptions,
  filterGradesBySelection
} from './utils/chartUtils';

const { Content } = Layout;
const { Title } = Typography;

export default function GradeAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [courseOptions, setCourseOptions] = useState<{value: string, label: string}[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<{value: string, label: string}[]>([]);
  
  // 申诉相关状态
  const [appeals, setAppeals] = useState<AppealData[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  
  // 图表数据
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  
  // 课程变化率数据
  const [courseChangeRates, setCourseChangeRates] = useState<Record<string, CourseChangeRate>>({});

  useEffect(() => {
    fetchGradesData();
  }, [router]);

  // 获取成绩数据
  const fetchGradesData = async () => {
    try {
      setLoading(true);
      // 先获取用户信息
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        setError('获取用户信息失败');
        setLoading(false);
        return;
      }
      
      const userData = await userResponse.json();
      if (!userData || !userData.user) {
        setError('用户未登录');
        setLoading(false);
        return;
      }
      
      // 带上用户身份信息请求成绩数据
      const response = await fetch('/api/student/grades/analytics', {
        headers: {
          'x-user-id': userData.user.id,
          'x-user-role': userData.user.role
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('用户未授权');
          setLoading(false);
          return;
        }
        throw new Error('获取成绩数据失败');
      }

      const data = await response.json();
      // 确保数据是数组
      const gradesData = Array.isArray(data.grades) ? data.grades : [];
      
      // 处理日期格式
      const processedGrades = processGradesData(gradesData);
      setGrades(processedGrades);
      
      // 提取课程和学期选项
      setCourseOptions(extractCourseOptions(processedGrades));
      setSemesterOptions(extractSemesterOptions(processedGrades));
      
      // 获取申诉数据
      await fetchAppeals();
      
    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 当筛选条件或成绩数据变化时重新计算图表数据
  useEffect(() => {
    if (grades.length === 0) return;
    
    // 根据筛选条件过滤数据
    const filteredGrades = filterGradesBySelection(grades, selectedCourse, selectedSemester);
    
    // 先整理出所有课程和日期，确保数据连续性
    const allCourses = new Set<string>();
    const courseDataMap: Record<string, Record<string, any>> = {};
    
    // 收集所有课程
    filteredGrades.forEach(grade => {
      allCourses.add(grade.courseName);
      
      if (!courseDataMap[grade.courseName]) {
        courseDataMap[grade.courseName] = {};
      }
      
      // 使用日期作为键，存储成绩
      courseDataMap[grade.courseName][grade.date] = {
        score: grade.score,
        semester: grade.semester,
        date: grade.date,
        formattedDate: new Date(grade.date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: (grade as any).status
      };
    });
    
    // 获取所有日期
    const uniqueDates = Array.from(
      new Set(filteredGrades.map(g => g.date))
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // 生成多余日期确保图表延伸
    const extraDates: string[] = [];
    if (uniqueDates.length > 0) {
      const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
      const futureDate = new Date(lastDate);
      
      // 添加3个月的未来日期点，使图表右侧有足够空间
      for (let i = 1; i <= 3; i++) {
        futureDate.setMonth(futureDate.getMonth() + 1);
        extraDates.push(futureDate.toISOString().split('T')[0]);
      }
    }
    
    // 转换为数组格式
    const trend: TrendDataPoint[] = [];
    
    // 遍历每个课程
    allCourses.forEach(course => {
      const courseData = courseDataMap[course];
      
      // 获取该课程的所有日期并排序
      const dates = Object.keys(courseData).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
      
      // 为每个日期创建数据点
      dates.forEach(date => {
        const dataPoint = courseData[date];
        trend.push({
          course: course,
          date: date,
          score: dataPoint.score,
          semester: dataPoint.semester,
          formattedDate: dataPoint.formattedDate,
          status: dataPoint.status
        });
      });
      
      // 为每个额外日期添加隐藏的数据点，帮助延伸图表
      if (dates.length > 0) {
        const lastPoint = courseData[dates[dates.length - 1]];
        extraDates.forEach(date => {
          trend.push({
            course: course,
            date: date,
            score: 0, // 设为0但不会显示
            semester: lastPoint.semester,
            formattedDate: new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'short', 
              day: 'numeric'
            }),
            status: 'hidden' // 标记为隐藏
          });
        });
      }
    });
    
    setTrendData(trend);
    
    // 获取唯一的课程名称
    const uniqueCourseList = Array.from(allCourses);
    
    // 计算每门课程的平均分
    const courseScores: Record<string, {total: number, count: number}> = {};
    
    filteredGrades.forEach(grade => {
      if (!courseScores[grade.courseName]) {
        courseScores[grade.courseName] = {
          total: grade.score,
          count: 1
        };
      } else {
        courseScores[grade.courseName].total += grade.score;
        courseScores[grade.courseName].count += 1;
      }
    });
    
    // 计算每门课程的平均分
    const courseAvgs: Record<string, number> = {};
    Object.keys(courseScores).forEach(course => {
      courseAvgs[course] = courseScores[course].total / courseScores[course].count;
    });
    
    // 按平均分从高到低排序课程
    uniqueCourseList.sort((a, b) => courseAvgs[b as string] - courseAvgs[a as string]);
    
    setUniqueCourses(uniqueCourseList as string[]);
    
    // 准备课程分布图数据
    const distribution: { course: string; score: number; count: number }[] = [];
    
    Object.keys(courseScores).forEach(course => {
      const scores = courseScores[course];
      distribution.push({
        course,
        score: parseFloat((scores.total / scores.count).toFixed(1)),
        count: scores.count,
      });
    });
    
    // 按平均分从高到低排序
    distribution.sort((a, b) => b.score - a.score);
    setDistributionData(distribution);
    
    // 计算每门课程的变化率
    const newCourseChangeRates: Record<string, CourseChangeRate> = {};
    
    // 将数据按课程分组
    const courseDataPoints: Record<string, TrendDataPoint[]> = {};
    uniqueCourseList.forEach(course => {
      courseDataPoints[course] = trend.filter(item => item.course === course && item.status !== 'hidden');
    });
    
    uniqueCourseList.forEach(course => {
      const points = courseDataPoints[course] || [];
      
      if (points.length >= 2) {
        // 获取第一个和最后一个有效成绩点
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        // 计算变化百分比
        const startScore = firstPoint.score;
        const endScore = lastPoint.score;
        const change = endScore - startScore;
        
        // 计算时间跨度（天数）
        const daysDiff = Math.max(1, 
          (new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        
        // 计算每30天的平均变化率
        const rate = (change / daysDiff) * 30;
        
        newCourseChangeRates[course] = {
          change,
          rate,
          startDate: firstPoint.date,
          endDate: lastPoint.date,
          startScore,
          endScore
        };
      }
    });
    
    setCourseChangeRates(newCourseChangeRates);
    
  }, [grades, selectedCourse, selectedSemester]);

  // 获取已提交的申诉
  const fetchAppeals = async () => {
    try {
      setLoadingAppeals(true);
      const response = await fetch('/api/grades/appeals');
      
      if (!response.ok) {
        throw new Error('获取申诉列表失败');
      }
      
      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (err) {
      console.error('获取申诉列表出错:', err);
    } finally {
      setLoadingAppeals(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navbar />
        <Content style={{ padding: '24px' }}>
          <Alert message="错误" description={error} type="error" showIcon />
        </Content>
      </Layout>
    );
  }

  const stats = calculateStats(distributionData);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <BackButton />
            <Title level={3} style={{ margin: 0, marginLeft: 16 }}>成绩分析</Title>
          </div>

          {/* 筛选条件 */}
          <FilterSection 
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            selectedSemester={selectedSemester}
            setSelectedSemester={setSelectedSemester}
            courseOptions={courseOptions}
            semesterOptions={semesterOptions}
          />

          {/* 统计信息 */}
          <StatsCards stats={stats} />

          {/* 成绩趋势图 */}
          <TrendChart 
            trendData={trendData}
            uniqueCourses={uniqueCourses}
            courseChangeRates={courseChangeRates}
            avgScore={stats.avg}
            onRefresh={fetchGradesData}
          />

          {/* 课程成绩分布 */}
          <DistributionCharts distributionData={distributionData} />

          {/* AI分析与建议 */}
          <AIAnalysis 
            grades={grades}
            selectedCourse={selectedCourse}
            selectedSemester={selectedSemester}
          />

          {/* 成绩明细和申诉 */}
          <GradeDetails 
            grades={grades}
            appeals={appeals}
            selectedCourse={selectedCourse}
            selectedSemester={selectedSemester}
          />
        </div>
      </Content>
    </Layout>
  );
} 