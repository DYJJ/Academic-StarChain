'use client';

import { useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface BackgroundWallpaperProps {
    children?: React.ReactNode;
}

const BackgroundWallpaper: React.FC<BackgroundWallpaperProps> = ({ children }) => {
    const [wallpaperUrl, setWallpaperUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    // 获取随机壁纸
    const fetchRandomWallpaper = async () => {
        setLoading(true);
        try {
            // 使用随机参数确保每次请求都是新的壁纸
            const timestamp = new Date().getTime();
            // 使用自己的代理API
            const url = `/api/wallpaper?t=${timestamp}`;
            setWallpaperUrl(url);
        } catch (error) {
            console.error('获取壁纸失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 初始化时获取壁纸
    useEffect(() => {
        fetchRandomWallpaper();
    }, []);

    // 处理壁纸加载完成事件
    const handleImageLoad = () => {
        setLoading(false);
    };

    // 处理刷新按钮点击
    const handleRefresh = () => {
        fetchRandomWallpaper();
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '100vh',
                overflow: 'hidden',
            }}
        >
            {/* 背景图片 */}
            {wallpaperUrl && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: -1,
                        backgroundColor: '#f0f2f5',
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: loading ? 0 : 1,
                    }}
                >
                    <img
                        src={wallpaperUrl}
                        alt="背景壁纸"
                        onLoad={handleImageLoad}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: 'brightness(0.95)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(2px)',
                        }}
                    />
                </div>
            )}

            {/* 刷新按钮 */}
            <Tooltip title="更换背景壁纸">
                <Button
                    type="primary"
                    shape="circle"
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={handleRefresh}
                    style={{
                        position: 'fixed',
                        top: '80px',
                        right: '20px',
                        zIndex: 99,
                        opacity: 0.8,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                />
            </Tooltip>

            {/* 内容 */}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

export default BackgroundWallpaper; 