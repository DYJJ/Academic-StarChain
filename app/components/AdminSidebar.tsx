import {
    DashboardOutlined,
    UserOutlined,
    BookOutlined,
    SettingOutlined,
    TeamOutlined,
    BlockOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { Menu } from 'antd';

const menuItems = [
    {
        key: '1',
        icon: <DashboardOutlined />,
        label: <Link href="/dashboard">仪表盘</Link>,
    },
    {
        key: '2',
        icon: <UserOutlined />,
        label: <Link href="/dashboard/users">用户管理</Link>,
    },
    {
        key: '3',
        icon: <BookOutlined />,
        label: <Link href="/dashboard/grades">成绩管理</Link>,
    },
    {
        key: '4',
        icon: <TeamOutlined />,
        label: <Link href="/dashboard/classes">班级管理</Link>,
    },
    {
        key: '5',
        icon: <SettingOutlined />,
        label: <Link href="/settings">系统设置</Link>,
    },
    {
        key: '6',
        icon: <BlockOutlined />,
        label: <Link href="/dashboard/blockchain">区块链设置</Link>,
    },
];

const AdminSidebar = () => {
    return (
        <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['1']}
            items={menuItems}
        />
    );
};

export default AdminSidebar; 