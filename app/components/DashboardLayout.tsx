'use client';

import React, { ReactNode } from 'react';
import { Layout } from 'antd';
import Navbar from './Navbar';
import WeatherWidget from './WeatherWidget';
import BackButton from './BackButton';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <Content style={{ padding: '24px', margin: '0 auto', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', marginBottom: '16px' }}>
          <BackButton />
        </div>
        {children}
      </Content>
      <WeatherWidget />
    </Layout>
  );
};

export default DashboardLayout; 