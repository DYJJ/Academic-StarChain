import React from 'react';
import { Modal, Row, Col, Card, Button, Typography, Progress, Statistic } from 'antd';
import { BarChartOutlined, TrophyOutlined, LineChartOutlined } from '@ant-design/icons';
import { Course, GradeData } from '../types';
import { calculateAverageGrade, calculatePassRate } from '../utils/courseUtils';

const { Text } = Typography;

interface GradeAnalysisModalProps {
  visible: boolean;
  onCancel: () => void;
  course: Course | null;
  gradeData: GradeData[];
}

const GradeAnalysisModal: React.FC<GradeAnalysisModalProps> = ({
  visible,
  onCancel,
  course,
  gradeData
}) => {
  const totalStudents = gradeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Modal
      title={
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ fontSize: '20px', color: '#4d7cfe', marginRight: '12px' }} />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#2e4355' }}>
              {`${course?.name || ''} - 成绩分析`}
            </span>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} style={{
          borderRadius: '8px',
          height: '40px',
          padding: '0 20px',
          fontWeight: 500
        }}>
          关闭
        </Button>
      ]}
      width={720}
      style={{ top: 20 }}
      styles={{ body: { padding: '24px' } }}
      className="custom-modal"
    >
      <div style={{ padding: '20px 0' }}>
        {/* 班级选择 */}
        <div style={{ marginBottom: '28px' }}>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '16px', color: '#2e4355', fontWeight: 600 }}>选择班级:</Text>
            </div>
            <div>
              <Button type="primary" style={{
                marginRight: '12px',
                backgroundColor: '#4d7cfe',
                borderColor: '#4d7cfe',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(77, 124, 254, 0.18)',
              }}>
                计算机科学1班
              </Button>
              <Button style={{
                marginRight: '12px',
                borderRadius: '8px'
              }}>
                计算机科学2班
              </Button>
              <Button style={{
                borderRadius: '8px'
              }}>
                全部班级
              </Button>
            </div>
          </Card>
        </div>

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card
              title={
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '17px', fontWeight: 600, color: '#2e4355' }}>成绩分布</span>
                  </div>
                </div>
              }
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: 'none'
              }}
              styles={{ body: { padding: '24px' } }}
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
            >
              <Row gutter={16}>
                {gradeData.map((item) => (
                  <Col span={24} key={item.range}>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                        <Text style={{ color: '#2e4355', fontWeight: 500 }}>{item.range}</Text>
                        <Text style={{ color: '#2e4355', fontWeight: 600 }}>
                          {item.count}人 ({Math.round(item.count / totalStudents * 100)}%)
                        </Text>
                      </div>
                      <Progress
                        percent={Math.round(item.count / totalStudents * 100)}
                        strokeColor={item.color}
                        showInfo={false}
                        strokeWidth={14}
                        trailColor="#eef2f6"
                        style={{ borderRadius: '7px', overflow: 'hidden' }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          <Col span={12}>
            <Card style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: 'none',
              height: '100%'
            }}
            styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>平均分</span>}
                value={calculateAverageGrade(gradeData)}
                precision={1}
                valueStyle={{ color: '#36b37e', fontSize: '32px', fontWeight: 600 }}
                prefix={<TrophyOutlined style={{ fontSize: '22px', marginRight: '8px' }} />}
                suffix={<span style={{ fontSize: '18px' }}>分</span>}
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: 'none',
              height: '100%'
            }}
            styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#6b7a8a', fontWeight: 500 }}>通过率</span>}
                value={calculatePassRate(gradeData)}
                precision={0}
                valueStyle={{ color: '#4d7cfe', fontSize: '32px', fontWeight: 600 }}
                prefix={<LineChartOutlined style={{ fontSize: '22px', marginRight: '8px' }} />}
                suffix={<span style={{ fontSize: '18px' }}>%</span>}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default GradeAnalysisModal; 