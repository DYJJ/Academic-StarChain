'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Layout,
    Table,
    Button,
    Input,
    Card,
    Space,
    Tag,
    Typography,
    Row,
    Col,
    Modal,
    message,
    Form,
    Tabs,
    Avatar,
    Tooltip,
    Badge,
    Popconfirm,
    Divider,
    Select
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserAddOutlined,
    UserDeleteOutlined,
    TeamOutlined,
    SearchOutlined,
    BookOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BackButton from '../../components/BackButton';
import { LogAction, logAction } from '../../utils/logger';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 定义班级类型
type Class = {
    id: string;
    name: string;
    grade: string;
    department: string;
    studentCount: number;
    teacher: string;
    courses: string[];
};

// 定义用户类型
type User = {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    avatarUrl?: string;
    classId?: string;
};

export default function ClassManagement() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [classes, setClasses] = useState<Class[]>([]);
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // 模态框状态
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

    // 表单
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();

    useEffect(() => {
        fetchCurrentUser();
        fetchClasses();
        fetchAllStudents();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    return;
                }
                throw new Error(`获取用户信息失败: ${response.status}`);
            }
            const data = await response.json();
            setCurrentUser(data.user);
        } catch (err: any) {
            console.error('获取用户信息时出错:', err);
            message.error(`获取用户信息失败: ${err.message}`);
        }
    };

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/classes?withStudents=true');
            if (!response.ok) {
                throw new Error(`获取班级列表失败: ${response.status}`);
            }
            const data = await response.json();
            setClasses(data.classes || []);
        } catch (err: any) {
            console.error('加载班级列表时出错:', err);
            message.error(`加载班级列表失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const response = await fetch('/api/users?role=STUDENT');
            if (!response.ok) {
                throw new Error(`获取学生列表失败: ${response.status}`);
            }
            const data = await response.json();
            setAllStudents(data.users || []);
        } catch (err: any) {
            console.error('加载学生列表时出错:', err);
            message.error(`加载学生列表失败: ${err.message}`);
        }
    };

    const handleAddClass = async (values: any) => {
        try {
            setLoading(true);
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error(`添加班级失败: ${response.status}`);
            }

            const data = await response.json();
            setClasses([...classes, data.class]);
            setIsAddModalOpen(false);
            addForm.resetFields();
            message.success('班级添加成功');
            if (currentUser?.id) {
                logAction(LogAction.CREATE_COURSE, `创建新班级: ${values.name}`, currentUser.id);
            }
        } catch (err: any) {
            console.error('添加班级时出错:', err);
            message.error(`添加班级失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClass = async (values: any) => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            const response = await fetch('/api/classes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedClass.id,
                    ...values
                }),
            });

            if (!response.ok) {
                throw new Error(`编辑班级失败: ${response.status}`);
            }

            const data = await response.json();
            setClasses(classes.map(c => c.id === data.class.id ? data.class : c));
            setIsEditModalOpen(false);
            message.success('班级更新成功');
            if (currentUser?.id) {
                logAction(LogAction.UPDATE_COURSE, `更新班级信息: ${values.name}`, currentUser.id);
            }
        } catch (err: any) {
            console.error('编辑班级时出错:', err);
            message.error(`编辑班级失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClass = async () => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/classes?id=${selectedClass.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `删除班级失败: ${response.status}`);
            }

            setClasses(classes.filter(c => c.id !== selectedClass.id));
            setIsDeleteModalOpen(false);
            message.success('班级删除成功');
            if (currentUser?.id) {
                logAction(LogAction.DELETE_COURSE, `删除班级: ${selectedClass.name}`, currentUser.id);
            }
        } catch (err: any) {
            console.error('删除班级时出错:', err);
            message.error(err.message || '删除班级失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudentToClass = async (studentId: string) => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            const response = await fetch('/api/classes/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    classId: selectedClass.id,
                    studentId
                }),
            });

            if (!response.ok) {
                throw new Error(`添加学生到班级失败: ${response.status}`);
            }

            // 刷新班级列表和学生
            await fetchClasses();
            await fetchAllStudents();

            message.success('添加学生到班级成功');
        } catch (err: any) {
            console.error('添加学生到班级时出错:', err);
            message.error(`添加学生到班级失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudentFromClass = async (studentId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/classes/students?studentId=${studentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`从班级移除学生失败: ${response.status}`);
            }

            // 刷新班级列表和学生
            await fetchClasses();
            await fetchAllStudents();

            message.success('从班级移除学生成功');
        } catch (err: any) {
            console.error('从班级移除学生时出错:', err);
            message.error(`从班级移除学生失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 过滤班级列表
    const filteredClasses = classes.filter(classItem => {
        const searchLower = searchTerm.toLowerCase();
        return (
            classItem.name.toLowerCase().includes(searchLower) ||
            classItem.grade.toLowerCase().includes(searchLower) ||
            classItem.department.toLowerCase().includes(searchLower)
        );
    });

    // 班级列表的表格列定义
    const classColumns = [
        {
            title: '班级名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Class) => (
                <Space>
                    <TeamOutlined />
                    <span>{text}</span>
                </Space>
            ),
        },
        {
            title: '年级',
            dataIndex: 'grade',
            key: 'grade',
        },
        {
            title: '所属院系',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: '学生人数',
            key: 'studentCount',
            render: (text: string, record: Class) => (
                <Badge count={record.studentCount} showZero color="#108ee9" />
            )
        },
        {
            title: '班主任',
            dataIndex: 'teacher',
            key: 'teacher',
        },
        {
            title: '关联课程',
            dataIndex: 'courses',
            key: 'courses',
            render: (courses: string[]) => (
                <div>
                    {courses.length > 0 ? (
                        courses.slice(0, 2).map((course, index) => (
                            <Tag color="green" key={index} style={{ marginBottom: '4px' }}>
                                {course}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">暂无课程</Text>
                    )}
                    {courses.length > 2 && <Tag color="blue">+{courses.length - 2}门</Tag>}
                </div>
            )
        },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: Class) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<TeamOutlined />}
                        onClick={() => {
                            setSelectedClass(record);
                            setIsStudentsModalOpen(true);
                        }}
                        title="管理学生"
                    />
                    <Button
                        type="text"
                        icon={<BookOutlined />}
                        onClick={() => router.push(`/dashboard/classes/${record.id}/courses`)}
                        title="关联课程"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelectedClass(record);
                            editForm.setFieldsValue({
                                name: record.name,
                                grade: record.grade,
                                department: record.department,
                                teacher: record.teacher,
                                courses: record.courses
                            });
                            setIsEditModalOpen(true);
                        }}
                        title="编辑班级"
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            setSelectedClass(record);
                            setIsDeleteModalOpen(true);
                        }}
                        title="删除班级"
                    />
                </Space>
            ),
        },
    ];

    // 获取可添加到班级的学生列表（未分配班级的学生）
    const getAvailableStudents = () => {
        return allStudents.filter(student => !student.classId);
    };

    // 获取当前选择班级的学生
    const getClassStudents = () => {
        if (!selectedClass) return [];
        return selectedClass.students || [];
    };

    // 学生列表的表格列定义
    const studentColumns = [
        {
            title: '姓名',
            key: 'name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar
                        size="small"
                        src={record.avatarUrl}
                        icon={<UserOutlined />}
                    >
                        {record.name[0]}
                    </Avatar>
                    <span>{record.name}</span>
                </Space>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: User) => (
                <Popconfirm
                    title="确定要从班级中移除此学生吗？"
                    onConfirm={() => handleRemoveStudentFromClass(record.id)}
                    okText="确定"
                    cancelText="取消"
                >
                    <Button
                        type="text"
                        danger
                        icon={<UserDeleteOutlined />}
                        title="从班级移除"
                    />
                </Popconfirm>
            ),
        },
    ];

    // 可添加学生列表的表格列定义
    const availableStudentColumns = [
        {
            title: '姓名',
            key: 'name',
            render: (text: string, record: User) => (
                <Space>
                    <Avatar
                        size="small"
                        src={record.avatarUrl}
                        icon={<UserOutlined />}
                    >
                        {record.name[0]}
                    </Avatar>
                    <span>{record.name}</span>
                </Space>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: User) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<UserAddOutlined />}
                    onClick={() => handleAddStudentToClass(record.id)}
                    title="添加到班级"
                >
                    添加
                </Button>
            ),
        },
    ];

    return (
        <Layout className="min-h-screen bg-gray-50">
            <Navbar />

            <Content className="p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <BackButton />
                                <Title level={2} className="inline-block ml-4">班级管理</Title>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddModalOpen(true)}
                            >
                                添加班级
                            </Button>
                        </div>

                        <div className="mb-4">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Input
                                        placeholder="搜索班级名称、年级或院系"
                                        prefix={<SearchOutlined />}
                                        allowClear
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </div>

                        <Table
                            columns={classColumns}
                            dataSource={filteredClasses}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条记录`
                            }}
                        />
                    </Card>
                </div>

                {/* 添加班级模态框 */}
                <Modal
                    title="添加班级"
                    open={isAddModalOpen}
                    onCancel={() => setIsAddModalOpen(false)}
                    footer={null}
                >
                    <Form
                        form={addForm}
                        layout="vertical"
                        onFinish={handleAddClass}
                    >
                        <Form.Item
                            name="name"
                            label="班级名称"
                            rules={[{ required: true, message: '请输入班级名称' }]}
                        >
                            <Input placeholder="例如：计算机科学1班" />
                        </Form.Item>

                        <Form.Item
                            name="grade"
                            label="年级"
                            rules={[{ required: true, message: '请输入年级' }]}
                        >
                            <Input placeholder="例如：2023级" />
                        </Form.Item>

                        <Form.Item
                            name="department"
                            label="所属院系"
                            rules={[{ required: true, message: '请选择所属院系' }]}
                        >
                            <Select placeholder="选择院系">
                                <Option value="计算机科学与技术学院">计算机科学与技术学院</Option>
                                <Option value="软件学院">软件学院</Option>
                                <Option value="人工智能学院">人工智能学院</Option>
                                <Option value="数学学院">数学学院</Option>
                                <Option value="物理学院">物理学院</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="teacher"
                            label="班主任"
                        >
                            <Select placeholder="选择教师作为班主任">
                                <Option value="张教授">张教授</Option>
                                <Option value="李教授">李教授</Option>
                                <Option value="王教授">王教授</Option>
                                <Option value="刘教授">刘教授</Option>
                                <Option value="陈教授">陈教授</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item className="text-right">
                            <Button
                                type="default"
                                onClick={() => setIsAddModalOpen(false)}
                                className="mr-2"
                            >
                                取消
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                添加
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 编辑班级模态框 */}
                <Modal
                    title="编辑班级"
                    open={isEditModalOpen}
                    onCancel={() => setIsEditModalOpen(false)}
                    footer={null}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleEditClass}
                    >
                        <Form.Item
                            name="name"
                            label="班级名称"
                            rules={[{ required: true, message: '请输入班级名称' }]}
                        >
                            <Input placeholder="例如：计算机科学1班" />
                        </Form.Item>

                        <Form.Item
                            name="grade"
                            label="年级"
                            rules={[{ required: true, message: '请输入年级' }]}
                        >
                            <Input placeholder="例如：2023级" />
                        </Form.Item>

                        <Form.Item
                            name="department"
                            label="所属院系"
                            rules={[{ required: true, message: '请选择所属院系' }]}
                        >
                            <Select placeholder="选择院系">
                                <Option value="计算机科学与技术学院">计算机科学与技术学院</Option>
                                <Option value="软件学院">软件学院</Option>
                                <Option value="人工智能学院">人工智能学院</Option>
                                <Option value="数学学院">数学学院</Option>
                                <Option value="物理学院">物理学院</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="teacher"
                            label="班主任"
                        >
                            <Select placeholder="选择教师作为班主任">
                                <Option value="张教授">张教授</Option>
                                <Option value="李教授">李教授</Option>
                                <Option value="王教授">王教授</Option>
                                <Option value="刘教授">刘教授</Option>
                                <Option value="陈教授">陈教授</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item className="text-right">
                            <Button
                                type="default"
                                onClick={() => setIsEditModalOpen(false)}
                                className="mr-2"
                            >
                                取消
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                保存
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 删除班级确认模态框 */}
                <Modal
                    title="确认删除"
                    open={isDeleteModalOpen}
                    onOk={handleDeleteClass}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true, loading: loading }}
                >
                    <p>确定要删除此班级吗？此操作不可撤销。</p>
                    {selectedClass && (
                        <div>
                            <p>班级名称: {selectedClass.name}</p>
                            <p>年级: {selectedClass.grade}</p>
                            {selectedClass.students && selectedClass.students.length > 0 && (
                                <p className="text-red-500">警告：此班级有{selectedClass.students.length}名学生，不能删除。</p>
                            )}
                        </div>
                    )}
                </Modal>

                {/* 管理班级学生模态框 */}
                <Modal
                    title={selectedClass ? `管理班级学生 - ${selectedClass.name}` : '管理班级学生'}
                    open={isStudentsModalOpen}
                    onCancel={() => setIsStudentsModalOpen(false)}
                    footer={null}
                    width={800}
                >
                    <Tabs defaultActiveKey="current">
                        <TabPane tab="班级学生" key="current">
                            <Table
                                columns={studentColumns}
                                dataSource={getClassStudents()}
                                rowKey="id"
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: false
                                }}
                                locale={{
                                    emptyText: '班级中没有学生'
                                }}
                            />
                        </TabPane>
                        <TabPane tab="添加学生" key="available">
                            <Table
                                columns={availableStudentColumns}
                                dataSource={getAvailableStudents()}
                                rowKey="id"
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: false
                                }}
                                locale={{
                                    emptyText: '没有可添加的学生'
                                }}
                            />
                        </TabPane>
                    </Tabs>
                </Modal>
            </Content>
        </Layout>
    );
} 