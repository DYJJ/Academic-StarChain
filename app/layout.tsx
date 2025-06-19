import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ChatProvider from './components/ChatProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '学生成绩认证系统',
  description: '基于安全技术的学生成绩存储、管理与认证平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
