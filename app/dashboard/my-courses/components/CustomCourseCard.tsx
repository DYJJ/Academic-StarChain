import { Button, Typography, Tag, Tooltip, Avatar, Divider } from 'antd';
import {
  ReadOutlined, TeamOutlined, CalendarOutlined,
  ClockCircleOutlined, CheckCircleOutlined, BarChartOutlined,
  EditOutlined, RightOutlined
} from '@ant-design/icons';
import { Course } from '../types';
import { COLORS, SHADOWS } from '../styles/constants';

const { Title, Text } = Typography;

interface CustomCourseCardProps {
  course: Course;
  gradient: string;
  onViewDetails: () => void;
  onShowStudents: () => void;
  onShowGrades: () => void;
  onEditCourse: () => void;
}

const CustomCourseCard = ({
  course,
  gradient,
  onViewDetails,
  onShowStudents,
  onShowGrades,
  onEditCourse
}: CustomCourseCardProps) => {
  return (
    <div style={{
      height: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: SHADOWS.sm,
      transition: 'all 0.3s ease',
      background: COLORS.cardBg,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部图片区域 */}
      <div style={{
        height: '120px',
        background: gradient,
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.2)',
          zIndex: 1
        }}></div>
        
        <div style={{
          zIndex: 2,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <ReadOutlined style={{ fontSize: '24px', color: 'white' }} />
          </div>
          
          <div style={{ flexGrow: 1 }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 600,
              marginBottom: '4px' 
            }}>
              {course.code}
            </div>
            <div style={{ 
              fontSize: '13px', 
              opacity: 0.9 
            }}>
              {course.semester}
            </div>
          </div>
        </div>
      </div>
      
      {/* 中间内容区域 */}
      <div style={{
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Title level={4} style={{
          margin: '0 0 16px 0',
          color: COLORS.textPrimary,
          fontWeight: 600,
          height: '52px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textOverflow: 'ellipsis'
        }}>
          {course.name}
        </Title>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '16px',
            marginBottom: '8px',
            color: COLORS.textSecondary,
            fontSize: '13px'
          }}>
            <CalendarOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <span>{course.semester}</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '16px',
            marginBottom: '8px',
            color: COLORS.textSecondary,
            fontSize: '13px'
          }}>
            <ClockCircleOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <span>{course.credit} 学分</span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            color: COLORS.textSecondary,
            fontSize: '13px'
          }}>
            <TeamOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <span>{course.studentCount || 0} 名学生</span>
          </div>
        </div>
        
        <Divider style={{ margin: '0 0 12px 0' }} />
        
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ fontSize: '13px', color: COLORS.textMuted, marginRight: '8px', display: 'block', marginBottom: '6px' }}>
            授课教师：
          </Text>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {(course.teachers || []).length > 0 ? (
              (course.teachers || []).map((teacher, idx) => (
                <Tooltip key={teacher.id} title={teacher.name}>
                  <Avatar 
                    style={{
                      marginRight: '8px',
                      backgroundColor: ['#f56a00', '#7265e6', '#00a2ae', '#ffbf00'][idx % 4],
                      fontSize: '12px'
                    }}
                    size="small"
                  >
                    {teacher.name.substring(0, 1)}
                  </Avatar>
                </Tooltip>
              ))
            ) : (
              <Text style={{ fontSize: '12px', color: COLORS.textMuted }}>暂无教师信息</Text>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <Tag color="processing" style={{ fontSize: '12px' }}>
            <CheckCircleOutlined /> 进行中
          </Tag>
        </div>
      </div>
      
      {/* 底部按钮区域 */}
      <div style={{
        padding: '12px 20px',
        borderTop: `1px solid ${COLORS.borderColor}`,
        background: '#f9fafc',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Button 
          type="text" 
          size="small"
          icon={<TeamOutlined />}
          onClick={onShowStudents}
          style={{ fontSize: '13px' }}
        >
          学生列表
        </Button>
        
        <Button 
          type="text" 
          size="small"
          icon={<BarChartOutlined />}
          onClick={onShowGrades}
          style={{ fontSize: '13px' }}
        >
          成绩分析
        </Button>
        
        <Button 
          type="text" 
          size="small"
          icon={<EditOutlined />}
          onClick={onEditCourse}
          style={{ fontSize: '13px' }}
        >
          编辑
        </Button>
        
        <Button 
          type="primary" 
          size="small"
          icon={<RightOutlined />}
          onClick={onViewDetails}
          style={{ 
            fontSize: '13px',
            background: COLORS.primary,
            borderColor: COLORS.primary
          }}
        >
          详情
        </Button>
      </div>
    </div>
  );
};

export default CustomCourseCard; 