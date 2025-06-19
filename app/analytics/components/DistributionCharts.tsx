'use client';

import React from 'react';
import { Row, Col, Card, Empty } from 'antd';
import { BarChart, Bar, PieChart, Pie, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Label, Cell } from 'recharts';
import { COLORS } from '../utils/constants';

interface DistributionChartsProps {
  distributionData: { course: string; score: number; count: number }[];
}

const DistributionCharts: React.FC<DistributionChartsProps> = ({ distributionData }) => {
  if (distributionData.length === 0) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="课程平均分对比">
            <Empty description="暂无数据" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="各科成绩分布">
            <Empty description="暂无数据" />
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="课程平均分对比">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={distributionData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="course" type="category" width={80} />
              <Tooltip formatter={(value) => [`${value}分`]} />
              <Bar 
                dataKey="score" 
                name="平均分" 
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <ReferenceLine x={60} stroke="#f5222d" strokeDasharray="3 3">
                <Label value="及格线" position="insideTopRight" fill="#f5222d" />
              </ReferenceLine>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="各科成绩分布">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                innerRadius={30}
                fill="#8884d8"
                dataKey="score"
                nameKey="course"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                animationDuration={1500}
                animationEasing="ease-in-out"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}分`]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default DistributionCharts; 