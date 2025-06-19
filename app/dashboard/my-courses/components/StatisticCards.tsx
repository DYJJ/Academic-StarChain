import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  BookOutlined, CalendarOutlined, TeamOutlined, TrophyOutlined
} from '@ant-design/icons';
import { Course } from '../types';
import { getRealStudentCount } from '../utils/courseUtils';

interface StatisticCardsProps {
  courses: Course[];
  userRole: string;
}

const StatisticCards: React.FC<StatisticCardsProps> = ({ courses, userRole }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: '36px' }}>
      {userRole === 'STUDENT' ? (
        <>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #4d7cfe 0%, #7eb6ff 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>我的课程数</span>}
                value={courses.length}
                valueStyle={{ color: '#4d7cfe', fontSize: '30px', fontWeight: 600 }}
                prefix={<BookOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #36b37e 0%, #57d9a3 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>本学期课程</span>}
                value={courses.filter(c => c.semester === '2023-2024-2').length}
                valueStyle={{ color: '#36b37e', fontSize: '30px', fontWeight: 600 }}
                prefix={<CalendarOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #f76707 0%, #ff9d4c 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>总学分</span>}
                value={courses.reduce((sum, course) => sum + (course.credit || 0), 0)}
                valueStyle={{ color: '#f76707', fontSize: '30px', fontWeight: 600 }}
                prefix={<TrophyOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
                suffix={<span style={{ fontSize: '16px' }}>分</span>}
              />
            </Card>
          </Col>
        </>
      ) : (
        <>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #4d7cfe 0%, #7eb6ff 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>教授课程数</span>}
                value={courses.length}
                valueStyle={{ color: '#4d7cfe', fontSize: '30px', fontWeight: 600 }}
                prefix={<BookOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #36b37e 0%, #57d9a3 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>本学期课程</span>}
                value={courses.filter(c => c.semester === '2023-2024-2').length}
                valueStyle={{ color: '#36b37e', fontSize: '30px', fontWeight: 600 }}
                prefix={<CalendarOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                height: '100%',
                border: 'none',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '30px' } }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '4px',
                background: 'linear-gradient(90deg, #f76707 0%, #ff9d4c 100%)'
              }}></div>
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>学生人数</span>}
                value={getRealStudentCount(courses)}
                valueStyle={{ color: '#f76707', fontSize: '30px', fontWeight: 600 }}
                prefix={<TeamOutlined style={{ fontSize: '20px', marginRight: '8px' }} />}
                suffix={<span style={{ fontSize: '16px' }}>人</span>}
              />
            </Card>
          </Col>
        </>
      )}
    </Row>
  );
};

export default StatisticCards; 