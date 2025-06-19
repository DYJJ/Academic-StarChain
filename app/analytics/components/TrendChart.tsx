'use client';

import React from 'react';
import { Card, Empty, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ResponsiveContainer, LineChart, XAxis, YAxis, CartesianGrid, Line as RechartsLine, Tooltip, Legend, ReferenceLine, Label } from 'recharts';
import { TrendDataPoint, ChartDataPoint, CourseChangeRate } from '../utils/types';
import { COLORS } from '../utils/constants';
import { formatDate } from '../utils/chartUtils';
import CustomTooltip from './CustomTooltip';
import CourseChangeAnalysis from './CourseChangeAnalysis';

interface TrendChartProps {
  trendData: TrendDataPoint[];
  uniqueCourses: string[];
  courseChangeRates: Record<string, CourseChangeRate>;
  avgScore: number;
  onRefresh: () => void;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  trendData, 
  uniqueCourses, 
  courseChangeRates,
  avgScore,
  onRefresh
}) => {
  if (trendData.length === 0) {
    return <Empty description="暂无数据" />;
  }

  // 获取所有课程的实际数据点（非隐藏）
  const visibleData = trendData.filter(item => item.status !== 'hidden');
  
  // 将数据按课程分组
  const courseDataMap: Record<string, TrendDataPoint[]> = {};
  uniqueCourses.forEach(course => {
    courseDataMap[course] = visibleData.filter(item => item.course === course);
  });
  
  // 获取包含所有日期的数组，并按时间排序
  const allDates = Array.from(new Set(visibleData.map(point => point.date)))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // 为图表创建一个统一的数据集，每个日期一个数据点
  const chartData: ChartDataPoint[] = allDates.map(date => {
    const dataPoint: ChartDataPoint = { date };
    
    // 为每个日期点添加每门课程的成绩
    uniqueCourses.forEach(course => {
      const coursePoints = courseDataMap[course] || [];
      const point = coursePoints.find(p => p.date === date);
      
      if (point) {
        dataPoint[course] = point.score;
        // 添加日期的格式化版本
        dataPoint.formattedDate = point.formattedDate;
      }
    });
    
    return dataPoint;
  });

  return (
    <Card 
      title="成绩变化趋势" 
      style={{ marginBottom: 24 }}
      extra={
        <Button 
          type="link" 
          icon={<ReloadOutlined />} 
          onClick={onRefresh}
        >
          刷新数据
        </Button>
      }
    >
      {/* 成绩趋势主图表 */}
      <div style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={date => formatDate(date).split(' ')[0]} // 只显示日期部分
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              type="number"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 12 }}
            >
              <Label
                value="分数"
                position="insideLeft"
                angle={-90}
                style={{ textAnchor: 'middle', fill: 'rgba(0, 0, 0, 0.65)', fontSize: 14 }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            
            {/* 及格线参考线 */}
            <ReferenceLine 
              y={60} 
              stroke="#f5222d" 
              strokeDasharray="3 3"
              label={{ value: '及格线: 60分', position: 'insideBottomRight', fill: '#f5222d', fontSize: 12 }}
            />
            
            {/* 平均分参考线 */}
            <ReferenceLine 
              y={avgScore} 
              stroke="#40a9ff" 
              strokeDasharray="3 3"
              label={{ value: `平均分: ${avgScore.toFixed(1)}`, position: 'insideTopRight', fill: '#40a9ff', fontSize: 12 }}
            />
            
            {/* 每个课程的线图 */}
            {uniqueCourses.map((course, index) => {
              const points = courseDataMap[course] || [];
              if (points.length === 0) return null;
              
              const color = COLORS[index % COLORS.length];
              
              return (
                <RechartsLine
                  key={course}
                  type="monotone"
                  dataKey={course}
                  name={course}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: color }}
                  connectNulls={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 课程成绩变化率分析 */}
      {Object.keys(courseChangeRates).length > 0 && (
        <CourseChangeAnalysis 
          courseChangeRates={courseChangeRates} 
          uniqueCourses={uniqueCourses} 
        />
      )}
    </Card>
  );
};

export default TrendChart; 