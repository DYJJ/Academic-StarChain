'use client';

import React from 'react';
import { Layout } from 'antd';
import Navbar from '../components/Navbar';

const { Content } = Layout;

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Navbar />
            <Content style={{ padding: '0', backgroundColor: '#f0f2f5' }}>
                {children}
            </Content>
        </Layout>
    );
} 