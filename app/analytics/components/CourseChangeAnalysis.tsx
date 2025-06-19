'use client';

import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { CourseChangeRate } from '../utils/types';
import { COLORS } from '../utils/constants';

const { Title, Text } = Typography;

interface CourseChangeAnalysisProps {
  courseChangeRates: Record<string, CourseChangeRate>;
  uniqueCourses: string[];
}

const CourseChangeAnalysis: React.FC<CourseChangeAnalysisProps> = ({
  courseChangeRates,
  uniqueCourses
}) => {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>成绩变化分析</Title>
      <Row gutter={[16, 16]}>
        {uniqueCourses.map((course, index) => {
          const rateData = courseChangeRates[course];
          if (!rateData) return null;
          
          const color = COLORS[index % COLORS.length];
          const { change, rate, startScore, endScore } = rateData;
          const isPositive = change >= 0;
          
          return (
            <Col xs={24} sm={12} md={8} key={course}>
              <Card size="small" bodyStyle={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: color,
                    marginRight: 8
                  }} />
                  <Text strong>{course}</Text>
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: isPositive ? '#52c41a' : '#f5222d' }}>
                  {isPositive ? '+' : ''}{change.toFixed(1)}分
                  <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                    ({startScore.toFixed(1)} → {endScore.toFixed(1)})
                  </Text>
                </div>
                <Text type="secondary">
                  平均每月{isPositive ? '提高' : '下降'}{Math.abs(rate).toFixed(1)}分
                </Text>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default CourseChangeAnalysis; 