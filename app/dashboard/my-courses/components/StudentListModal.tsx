import React from 'react';
import { Modal, List, Avatar, Button, Typography, Spin, Empty, message } from 'antd';
import { TeamOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import { Course, Student } from '../types';

const { Text } = Typography;

interface StudentListModalProps {
  visible: boolean;
  onCancel: () => void;
  course: Course | null;
  students: Student[];
  loading: boolean;
  onShowGrades?: (courseId: string, studentId: string) => void;
}

const StudentListModal: React.FC<StudentListModalProps> = ({
  visible,
  onCancel,
  course,
  students,
  loading,
  onShowGrades
}) => {
  // 处理查看学生成绩
  const handleViewGrades = (studentId: string) => {
    if (onShowGrades && course) {
      onShowGrades(course.id, studentId);
    } else {
      message.info('成绩查看功能正在开发中');
    }
  };

  return (
    <Modal
      title={
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TeamOutlined style={{ fontSize: '20px', color: '#4d7cfe', marginRight: '12px' }} />
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#2e4355' }}>
              {`${course?.name || ''} - 学生列表`}
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '20px', color: '#8c9aa9' }}>加载学生数据中...</div>
        </div>
      ) : (
        students.length > 0 ? (
          <List
            dataSource={students}
            renderItem={(student) => (
              <List.Item style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                background: '#f7f9fc', 
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                border: 'none'
              }}>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      src={student.avatar || student.avatarUrl} 
                      size={64} 
                      icon={(!student.avatar && !student.avatarUrl) && <UserOutlined />}
                      style={{ 
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        backgroundColor: (!student.avatar && !student.avatarUrl) ? '#4d7cfe' : undefined
                      }}
                    />
                  }
                  title={
                    <Text strong style={{ fontSize: '18px', color: '#2e4355' }}>
                      {student.name}
                    </Text>
                  }
                  description={
                    <div style={{ fontSize: '14px', color: '#6b7a8a', lineHeight: '1.8', marginTop: '4px' }}>
                      <div>
                        <span style={{ fontWeight: 500, marginRight: '6px' }}>学号:</span>
                        {student.studentId}
                      </div>
                      <div>
                        <span style={{ fontWeight: 500, marginRight: '6px' }}>邮箱:</span>
                        {student.email}
                      </div>
                    </div>
                  }
                />
                <div>
                  <Button 
                    type="primary" 
                    icon={<BarChartOutlined />} 
                    onClick={() => handleViewGrades(student.id)}
                    style={{
                      backgroundColor: '#4d7cfe',
                      borderColor: '#4d7cfe',
                      borderRadius: '8px',
                      padding: '0 16px',
                      height: '36px',
                      boxShadow: '0 4px 8px rgba(77, 124, 254, 0.18)',
                    }}
                  >
                    查看成绩
                  </Button>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={
              <Text style={{ color: '#8c9aa9', fontSize: '16px' }}>
                暂无学生选修此课程
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '60px 0' }}
          />
        )
      )}
    </Modal>
  );
};

export default StudentListModal; 