import { useState } from 'react';
import { Card, Typography, Tag, Badge, Avatar, Button, Tooltip, Modal } from 'antd';
import { BookOutlined, ClockCircleOutlined, TeamOutlined, CalendarOutlined, 
         InfoCircleOutlined, UserOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

// 课程类型定义
export interface CourseType {
  id: string;
  code: string;
  name: string;
  description: string;
  credit: number;
  semester: string;
}

interface CourseCardProps {
  course: CourseType;
  hoverable?: boolean;
  className?: string;
}

export default function CourseCard({ course, hoverable = true, className = '' }: CourseCardProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 根据学期获取标签颜色
  const getTagColor = (semester: string) => {
    const currentYear = new Date().getFullYear();
    const [year] = semester.split('-');
    
    if (parseInt(year) === currentYear) {
      return 'green';
    } else if (parseInt(year) > currentYear) {
      return 'blue';
    } else {
      return 'orange';
    }
  };

  // 随机生成课程背景颜色
  const getRandomColor = (courseCode: string) => {
    // 使用课程代码生成一致的颜色
    const colors = [
      'linear-gradient(135deg, #1890ff 0%, #52c41a 100%)',
      'linear-gradient(135deg, #13c2c2 0%, #1890ff 100%)',
      'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
      'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)',
      'linear-gradient(135deg, #7cb305 0%, #52c41a 100%)',
      'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      'linear-gradient(135deg, #f759ab 0%, #eb2f96 100%)',
      'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)'
    ];
    
    // 使用课程代码的字符编码和来获取一个固定的索引
    const sum = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // 显示课程详情模态框
  const showCourseDetails = () => {
    setIsModalVisible(true);
  };
  
  return (
    <>
      <Badge.Ribbon 
        text={`${course.credit} 学分`} 
        color={course.credit > 3 ? 'red' : 'blue'}
      >
        <Card 
          hoverable={hoverable}
          className={`w-full transition-all duration-300 rounded-lg overflow-hidden ${className} ${
            isHovered ? 'shadow-xl transform -translate-y-1' : 'shadow-md'
          }`}
          style={{ border: '1px solid #f0f0f0' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          cover={
            <div 
              className="flex items-center justify-center h-32 text-white p-4 relative overflow-hidden"
              style={{ 
                background: getRandomColor(course.code),
                position: 'relative',
              }}
            >
              {/* 磨砂玻璃效果的背景 */}
              <div className="absolute inset-0" 
                style={{
                  background: `${getRandomColor(course.code)}`,
                  filter: 'blur(0px)',
                  opacity: isHovered ? 0.8 : 1,
                  transition: 'all 0.3s ease'
                }}
              />
              
              {/* 课程代码 */}
              <div className="absolute top-3 left-3 bg-white bg-opacity-30 px-2 py-1 rounded-md backdrop-blur-sm z-10">
                <Text strong className="text-white">{course.code}</Text>
              </div>
              
              {/* 课程名称 */}
              <h3 className="text-xl font-bold text-center text-white z-10 relative">
                {course.name}
              </h3>
              
              {/* 查看详情按钮 - 悬停时显示 */}
              <div 
                className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 z-20 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Button 
                  type="primary" 
                  ghost 
                  icon={<InfoCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    showCourseDetails();
                  }}
                >
                  查看详情
                </Button>
              </div>
            </div>
          }
          actions={[
            <Tooltip title="查看学生" key="students">
              <Button type="text" icon={<TeamOutlined />}>学生</Button>
            </Tooltip>,
            <Tooltip title="编辑课程" key="edit">
              <Button type="text" icon={<EditOutlined />}>编辑</Button>
            </Tooltip>,
            <Tooltip title="成绩管理" key="grades">
              <Button type="text" icon={<FileTextOutlined />}>成绩</Button>
            </Tooltip>
          ]}
        >
          <div className="flex flex-col space-y-3 pt-2">
            <div className="flex items-center">
              <CalendarOutlined className="mr-2 text-blue-500" />
              <Text>
                学期: 
                <Tag color={getTagColor(course.semester)} className="ml-1">
                  {course.semester}
                </Tag>
              </Text>
            </div>
            
            <Paragraph 
              ellipsis={{ rows: 3, expandable: true, symbol: '查看更多' }}
              className="text-gray-600"
            >
              {course.description}
            </Paragraph>
            
            <div className="flex justify-between items-center pt-2 mt-auto">
              <Avatar.Group maxCount={3}>
                <Tooltip title="张三">
                  <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                </Tooltip>
                <Tooltip title="李四">
                  <Avatar style={{ backgroundColor: '#52c41a' }} icon={<UserOutlined />} />
                </Tooltip>
                <Tooltip title="王五">
                  <Avatar style={{ backgroundColor: '#faad14' }} icon={<UserOutlined />} />
                </Tooltip>
                {Math.random() > 0.5 && (
                  <Tooltip title="赵六">
                    <Avatar style={{ backgroundColor: '#eb2f96' }} icon={<UserOutlined />} />
                  </Tooltip>
                )}
              </Avatar.Group>
              <Tag icon={<ClockCircleOutlined />} color="processing">
                进行中
              </Tag>
            </div>
          </div>
        </Card>
      </Badge.Ribbon>

      {/* 课程详情模态框 */}
      <Modal
        title={
          <div className="flex items-center">
            <BookOutlined className="mr-2 text-blue-500" />
            <span>{course.name}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary">
            编辑课程
          </Button>,
        ]}
        width={700}
      >
        <div className="p-4">
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <Text type="secondary">课程代码:</Text>
                <div>
                  <Tag color="blue" className="text-lg px-3 py-1">{course.code}</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">学分:</Text>
                <div>
                  <Tag color="red" className="text-lg px-3 py-1">{course.credit} 学分</Tag>
                </div>
              </div>
              <div>
                <Text type="secondary">学期:</Text>
                <div>
                  <Tag color={getTagColor(course.semester)} className="text-lg px-3 py-1">{course.semester}</Tag>
                </div>
              </div>
            </div>
            
            <Title level={5}>课程描述</Title>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Paragraph>{course.description}</Paragraph>
            </div>
          </div>
          
          <div className="mb-4">
            <Title level={5}>教学目标</Title>
            <ul className="list-disc pl-5">
              <li>理解{course.name}的基本概念和原理</li>
              <li>掌握相关技术的实际应用方法</li>
              <li>培养学生的实践能力和创新思维</li>
              <li>提高学生的团队协作和问题解决能力</li>
            </ul>
          </div>
          
          <div>
            <Title level={5}>选课学生</Title>
            <div className="flex flex-wrap gap-2">
              <Avatar.Group>
                <Tooltip title="张三">
                  <Avatar style={{ backgroundColor: '#1677ff' }}>张</Avatar>
                </Tooltip>
                <Tooltip title="李四">
                  <Avatar style={{ backgroundColor: '#52c41a' }}>李</Avatar>
                </Tooltip>
                <Tooltip title="王五">
                  <Avatar style={{ backgroundColor: '#faad14' }}>王</Avatar>
                </Tooltip>
                <Tooltip title="赵六">
                  <Avatar style={{ backgroundColor: '#eb2f96' }}>赵</Avatar>
                </Tooltip>
                <Tooltip title="更多学生">
                  <Avatar style={{ backgroundColor: '#f56a00' }}>+5</Avatar>
                </Tooltip>
              </Avatar.Group>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
} 