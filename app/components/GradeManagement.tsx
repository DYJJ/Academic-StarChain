'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Tag, message, Typography } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { LogAction, logAction } from '../utils/logger';

const { Title } = Typography;

interface Grade {
    id: string;
    score: number;
    studentId: string;
    teacherId: string;
    courseId: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    student: {
        name: string;
    };
    course: {
        name: string;
        code: string;
    };
    teacher: {
        name: string;
    };
}

interface Course {
    id: string;
    code: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

export default function GradeManagement() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        // 获取当前用户信息
        const userSession = document.cookie
            .split('; ')
            .find(row => row.startsWith('user_session='));

        if (userSession) {
            const userData = JSON.parse(decodeURIComponent(userSession.split('=')[1]));
            setCurrentUser(userData);
        }

        // 加载成绩数据
        fetchGrades();
        fetchCourses();
        fetchStudents();
    }, []);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/grades');
            const data = await response.json();
            setGrades(data.grades || []);
        } catch (error) {
            console.error('获取成绩失败:', error);
            message.error('获取成绩失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('获取课程失败:', error);
            message.error('获取课程失败');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch('/api/users?role=STUDENT');
            const data = await response.json();
            setStudents(data.users || []);
        } catch (error) {
            console.error('获取学生列表失败:', error);
            message.error('获取学生列表失败');
        }
    };

    const handleAddGrade = async (values: any) => {
        try {
            setLoading(true);
            const response = await fetch('/api/grades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...values,
                    teacherId: currentUser?.id,
                }),
            });

            if (response.ok) {
                setModalVisible(false);
                form.resetFields();
                fetchGrades();
                message.success('成绩添加成功');

                // 记录添加成绩操作
                const studentName = students.find(s => s.id === values.studentId)?.name || '';
                const courseName = courses.find(c => c.id === values.courseId)?.name || '';
                const courseCode = courses.find(c => c.id === values.courseId)?.code || '';

                logAction(LogAction.CREATE_GRADE,
                    `添加成绩: 学生 ${studentName}, 课程 ${courseName}(${courseCode}), 分数 ${values.score}`
                );
            } else {
                const error = await response.json();
                message.error(error.error || '添加成绩失败');
            }
        } catch (error) {
            console.error('添加成绩失败:', error);
            message.error('添加成绩失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyGrade = async (gradeId: string, status: 'VERIFIED' | 'REJECTED') => {
        try {
            setLoading(true);
            const response = await fetch(`/api/grades/${gradeId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                fetchGrades();
                message.success(`成绩${status === 'VERIFIED' ? '通过' : '拒绝'}成功`);

                // 获取成绩信息用于记录日志
                const grade = grades.find(g => g.id === gradeId);
                if (grade) {
                    logAction(LogAction.VERIFY_GRADE,
                        `${status === 'VERIFIED' ? '通过' : '拒绝'}成绩: 学生 ${grade.student.name}, 课程 ${grade.course.name}(${grade.course.code}), 分数 ${grade.score}`
                    );
                }
            } else {
                const error = await response.json();
                message.error(error.error || '验证成绩失败');
            }
        } catch (error) {
            console.error('验证成绩失败:', error);
            message.error('验证成绩失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 表格列配置
    const columns = [
        {
            title: '学生',
            dataIndex: ['student', 'name'],
            key: 'student',
        },
        {
            title: '课程',
            key: 'course',
            render: (record: Grade) => (
                <>
                    <div>{record.course.name}</div>
                    <div style={{ color: '#999', fontSize: '12px' }}>{record.course.code}</div>
                </>
            ),
        },
        {
            title: '分数',
            dataIndex: 'score',
            key: 'score',
        },
        {
            title: '状态',
            key: 'status',
            render: (record: Grade) => {
                let color = 'default';
                let text = '未知';

                if (record.status === 'VERIFIED') {
                    color = 'success';
                    text = '已认证';
                } else if (record.status === 'REJECTED') {
                    color = 'error';
                    text = '已拒绝';
                } else if (record.status === 'PENDING') {
                    color = 'warning';
                    text = '待认证';
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: '操作',
            key: 'action',
            render: (record: Grade) => {
                if (currentUser?.role === 'ADMIN' && record.status === 'PENDING') {
                    return (
                        <Space>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                size="small"
                                onClick={() => handleVerifyGrade(record.id, 'VERIFIED')}
                            />
                            <Button
                                danger
                                icon={<CloseOutlined />}
                                size="small"
                                onClick={() => handleVerifyGrade(record.id, 'REJECTED')}
                            />
                        </Space>
                    );
                }
                return null;
            },
        },
    ];

    return (
        <div style={{ padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>成绩管理</Title>
                {currentUser?.role === 'TEACHER' && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                    >
                        添加成绩
                    </Button>
                )}
            </div>

            <Table
                columns={columns}
                dataSource={grades}
                rowKey="id"
                loading={loading}
                bordered
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: '暂无成绩记录' }}
            />

            <Modal
                title="添加成绩"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddGrade}
                    preserve={false}
                >
                    <Form.Item
                        name="studentId"
                        label="学生"
                        rules={[{ required: true, message: '请选择学生' }]}
                    >
                        <Select placeholder="选择学生">
                            {students.map(student => (
                                <Select.Option key={student.id} value={student.id}>
                                    {student.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="courseId"
                        label="课程"
                        rules={[{ required: true, message: '请选择课程' }]}
                    >
                        <Select placeholder="选择课程">
                            {courses.map(course => (
                                <Select.Option key={course.id} value={course.id}>
                                    {course.name} ({course.code})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="score"
                        label="分数"
                        rules={[
                            { required: true, message: '请输入分数' },
                            { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间' }
                        ]}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            step={0.1}
                            style={{ width: '100%' }}
                            placeholder="0-100"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>取消</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                保存
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
} 