'use client';

import { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title } = Typography;

export default function NotFound() {
    const [text, setText] = useState('404');
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let interval: NodeJS.Timeout;

        if (isHovered) {
            let iteration = 0;
            const originalText = '404';

            interval = setInterval(() => {
                setText(originalText
                    .split('')
                    .map((letter, index) => {
                        if (index < iteration) {
                            return originalText[index];
                        }
                        return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join(''));

                if (iteration >= originalText.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        }

        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* 动态背景 */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at center, transparent 0%, #000 70%)',
                opacity: 0.5,
                zIndex: 1
            }} />

            {/* 内容 */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center'
            }}>
                <h1
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        setText('404');
                    }}
                    style={{
                        fontSize: '180px',
                        margin: 0,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: '#fff',
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                        cursor: 'default',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {text}
                </h1>

                <Title level={2} style={{ color: '#fff', marginTop: 0 }}>
                    页面未找到
                </Title>

                <p style={{
                    fontSize: '18px',
                    color: '#aaa',
                    maxWidth: '500px',
                    margin: '20px auto'
                }}>
                    抱歉，您访问的页面不存在或已被移除。
                </p>

                <Link href="/dashboard">
                    <Button
                        type="primary"
                        size="large"
                        icon={<HomeOutlined />}
                        style={{
                            marginTop: '20px',
                            height: '48px',
                            padding: '0 32px',
                            fontSize: '16px',
                            background: 'rgba(255,255,255,0.1)',
                            borderColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        返回首页
                    </Button>
                </Link>
            </div>

            {/* 动态粒子效果 */}
            <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: float 3s infinite ease-in-out;
        }
      `}</style>

            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.2,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
    );
} 