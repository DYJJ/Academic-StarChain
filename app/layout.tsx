import type { Metadata } from 'next';
<<<<<<< HEAD
import './globals.css';

=======
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
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
<<<<<<< HEAD
      <body>{children}</body>
=======
      <body className={inter.className}>{children}</body>
>>>>>>> 49b5edb54a73de8a79d0d5bdb403fee82a99512f
    </html>
  );
}
