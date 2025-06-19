'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Tag, Empty } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { GradeData, AppealData } from '../utils/types';

interface GradeDetailsProps {
  grades: GradeData[];
  appeals: AppealData[];
  selectedCourse: string;
  selectedSemester: string;
}

const GradeDetails: React.FC<GradeDetailsProps> = ({
  grades,
  appeals,
  selectedCourse,
  selectedSemester
}) => {
  const router = useRouter();

  // 判断这个成绩是否已申诉
  const hasAppealedGrade = (gradeId: string): boolean => {
    return appeals.some(appeal => 
      appeal.gradeId === gradeId && 
      ['PENDING', 'REVIEWING'].includes(appeal.status)
    );
  };

  // 过滤成绩数据
  const filteredGrades = grades.filter(grade => {
    const courseMatch = selectedCourse === 'all' || grade.courseId === selectedCourse;
    const semesterMatch = selectedSemester === 'all' || grade.semester === selectedSemester;
    return courseMatch && semesterMatch;
  });

  if (filteredGrades.length === 0) {
    return (
      <Card title="成绩明细" style={{ marginTop: 24 }}>
        <Empty description="暂无成绩数据" />
      </Card>
    );
  }

  return (
    <Card title="成绩明细" style={{ marginTop: 24 }}>
      <Row gutter={[16, 16]}>
        {filteredGrades.map(grade => {
          // 判断这个成绩是否已经有待处理的申诉
          const hasAppeal = hasAppealedGrade(grade.id);
          // 找到相关的申诉
          const relatedAppeal = appeals.find(a => a.gradeId === grade.id);
          
          return (
            <Col xs={24} sm={12} md={8} key={grade.id}>
              <Card 
                size="small" 
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span>{grade.courseName}</span>
                    {hasAppeal && (
                      <Tag color="orange" style={{ marginLeft: 8 }}>
                        已申诉
                      </Tag>
                    )}
                  </div>
                }
                style={{ 
                  borderLeft: `4px solid ${grade.score >= 60 ? '#52c41a' : '#f5222d'}`,
                  height: '100%'
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                  {grade.score.toFixed(1)}
                  <small style={{ fontSize: 14, marginLeft: 4, color: 'rgba(0, 0, 0, 0.45)' }}>分</small>
                </div>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8 }}>
                  学期: {grade.semester}
                </div>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 16 }}>
                  日期: {new Date(grade.date).toLocaleDateString('zh-CN')}
                </div>
                
                {relatedAppeal ? (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={
                        relatedAppeal.status === 'PENDING' ? 'blue' : 
                        relatedAppeal.status === 'REVIEWING' ? 'orange' :
                        relatedAppeal.status === 'RESOLVED' ? 'green' : 'red'
                      }>
                        {relatedAppeal.status === 'PENDING' ? '待处理' : 
                        relatedAppeal.status === 'REVIEWING' ? '审核中' :
                        relatedAppeal.status === 'RESOLVED' ? '已解决' : '已拒绝'}
                      </Tag>
                    </div>
                    <Button 
                      type="link" 
                      size="small" 
                      style={{ paddingLeft: 0 }}
                      onClick={() => router.push(`/grades/appeals/${relatedAppeal.id}`)}
                    >
                      查看申诉详情
                    </Button>
                  </div>
                ) : (
                  <Button 
                    type="primary" 
                    size="small"
                    danger={grade.score < 60}
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => {
                      console.log('点击成绩复核按钮，成绩ID:', grade.id);
                      router.push(`/grades/appeals/new?gradeId=${grade.id}`);
                    }}
                  >
                    申请成绩复核
                  </Button>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
};

export default GradeDetails; 