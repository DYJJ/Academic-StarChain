'use client';

import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { StatsData } from '../utils/types';

interface StatsCardsProps {
  stats: StatsData;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic 
            title="平均分" 
            value={stats.avg} 
            precision={1} 
            valueStyle={{ color: '#3f8600' }}
            suffix="分"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic 
            title="最高分" 
            value={stats.highest}
            precision={1} 
            valueStyle={{ color: '#cf1322' }}
            suffix="分"
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic 
            title="最低分" 
            value={stats.lowest} 
            precision={1}
            suffix="分"
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards; 