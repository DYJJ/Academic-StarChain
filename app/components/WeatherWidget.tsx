'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Space, Tag, Button, Spin, Collapse, Tooltip } from 'antd';
import { CloudOutlined, EnvironmentOutlined, ArrowUpOutlined, ArrowDownOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

type WeatherData = {
    province: string;
    city: string;
    weather: string;
    temperature: string;
    winddirection: string;
    windpower: string;
    humidity: string;
    reporttime: string;
};

const WeatherWidget = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchWeatherData();
    }, []);

    const fetchWeatherData = async () => {
        try {
            setLoading(true);
            setRefreshing(true);
            const response = await fetch('/api/weather');
            if (!response.ok) {
                throw new Error('获取天气信息失败');
            }
            const data = await response.json();
            if (data.status === '1' && data.lives && data.lives.length > 0) {
                setWeather(data.lives[0]);
            } else {
                throw new Error('获取天气数据失败');
            }
        } catch (err: any) {
            setError(err.message || '获取天气信息失败');
            console.error('天气数据获取失败:', err);
        } finally {
            setLoading(false);
            setTimeout(() => setRefreshing(false), 600);
        }
    };

    const getWeatherIcon = (weather: string) => {
        // 根据天气状况返回相应的图标
        const weatherIcons: { [key: string]: string } = {
            '晴': '☀️',
            '多云': '⛅',
            '阴': '☁️',
            '小雨': '🌧️',
            '中雨': '🌧️',
            '大雨': '🌧️',
            '暴雨': '⛈️',
            '雷阵雨': '⛈️',
            '小雪': '❄️',
            '中雪': '❄️',
            '大雪': '❄️',
            '雾': '🌫️',
            '霾': '🌫️',
        };

        return weatherIcons[weather] || '🌈';
    };

    const getWindDirectionChinese = (direction: string) => {
        const directions: { [key: string]: string } = {
            '东': '东风',
            '南': '南风',
            '西': '西风',
            '北': '北风',
            '东北': '东北风',
            '东南': '东南风',
            '西北': '西北风',
            '西南': '西南风',
        };

        return directions[direction] || direction;
    };

    const getWeatherColor = (weather: string) => {
        const colors: { [key: string]: string } = {
            '晴': '#FDB813',
            '多云': '#B5C4D0',
            '阴': '#8091A5',
            '小雨': '#6FB0E0',
            '中雨': '#4A90E2',
            '大雨': '#3672BE',
            '暴雨': '#235A97',
            '雷阵雨': '#1D4F88',
            '小雪': '#D6E4F0',
            '中雪': '#C7D9E8',
            '大雪': '#B8CEDE',
        };

        return colors[weather] || '#1890ff';
    };

    const getWeatherEmoji = (weather: string) => {
        // 返回与天气相关的小表情，用于增加趣味性
        const emojis: { [key: string]: string } = {
            '晴': '😎',
            '多云': '🙂',
            '阴': '😐',
            '小雨': '😕',
            '中雨': '😔',
            '大雨': '😥',
            '暴雨': '😰',
            '雷阵雨': '😱',
            '小雪': '😊',
            '中雪': '😄',
            '大雪': '😃',
            '雾': '😶',
            '霾': '😷',
        };

        return emojis[weather] || '🤔';
    };

    const getWeatherTip = (weather: string, temperature: string) => {
        const temp = parseInt(temperature);
        let tip = '';

        if (weather.includes('雨')) {
            tip = '出门记得带伞哦！';
        } else if (weather.includes('雪')) {
            tip = '注意保暖，小心路滑！';
        } else if (weather === '晴' && temp > 30) {
            tip = '天气炎热，注意防晒！';
        } else if (weather === '晴' && temp < 10) {
            tip = '天气寒冷，注意保暖！';
        } else if (weather === '多云') {
            tip = '天气不错，适合出行！';
        } else if (weather === '阴') {
            tip = '天气阴沉，记得带伞以防下雨！';
        } else if (weather.includes('雾') || weather.includes('霾')) {
            tip = '空气质量不佳，注意防护！';
        } else {
            tip = '祝您有个愉快的一天！';
        }

        return tip;
    };

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    if (loading && !weather) {
        return (
            <Card
                className="weather-widget"
                style={{
                    position: 'fixed',
                    left: '24px',
                    bottom: '24px',
                    zIndex: 999,
                    width: '300px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    background: 'linear-gradient(to bottom right, #f6fafd, #e6f7ff)',
                }}
            >
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <Spin tip="获取天气信息中..." />
                </div>
            </Card>
        );
    }

    if (error && !weather) {
        return (
            <Card
                className="weather-widget"
                style={{
                    position: 'fixed',
                    left: '24px',
                    bottom: '24px',
                    zIndex: 999,
                    width: '300px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    background: 'linear-gradient(to bottom right, #fff1f0, #ffccc7)',
                }}
            >
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <Text type="danger" style={{ fontSize: '16px' }}>{error}</Text>
                    <Button type="primary" onClick={fetchWeatherData} style={{ marginTop: '12px' }}>
                        重试
                    </Button>
                </div>
            </Card>
        );
    }

    if (!weather) {
        return null;
    }

    const collapsedStyle = {
        position: 'fixed' as 'fixed',
        left: '24px',
        bottom: '24px',
        zIndex: 999,
        width: collapsed ? '95px' : '320px',
        borderRadius: '16px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        cursor: 'pointer',
        border: 'none',
        background: collapsed
            ? `linear-gradient(135deg, ${getWeatherColor(weather.weather)}, #ffffff)`
            : `linear-gradient(135deg, ${getWeatherColor(weather.weather)}33, #ffffff)`,
    };

    const getProgressStyle = (value: number) => {
        const percent = Math.min(value, 100);
        return {
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden',
            position: 'relative' as 'relative',
            '&:after': {
                content: '""',
                position: 'absolute' as 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${percent}%`,
                background: '#1890ff',
                borderRadius: '2px',
            }
        };
    };

    if (collapsed) {
        return (
            <Card
                className="weather-widget-collapsed"
                onClick={toggleCollapse}
                style={collapsedStyle}
                bodyStyle={{ padding: '12px', textAlign: 'center' }}
                bordered={false}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    }}
                >
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>{getWeatherIcon(weather.weather)}</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{weather.temperature}°C</div>
                </div>
            </Card>
        );
    }

    return (
        <Card
            className="weather-widget-expanded"
            style={collapsedStyle}
            headStyle={{
                borderBottom: 'none',
                padding: '12px 16px',
                background: `linear-gradient(135deg, ${getWeatherColor(weather.weather)}22, #ffffff00)`,
            }}
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space align="center">
                        <CloudOutlined style={{ color: getWeatherColor(weather.weather), fontSize: '20px' }} />
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>南昌市天气</span>
                    </Space>
                    <Space>
                        <Tooltip title="刷新">
                            <Button
                                type="text"
                                size="small"
                                icon={<ReloadOutlined spin={refreshing} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchWeatherData();
                                }}
                                style={{ color: getWeatherColor(weather.weather) }}
                            />
                        </Tooltip>
                        <Tooltip title="收起">
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCollapse();
                                }}
                                style={{ color: getWeatherColor(weather.weather) }}
                            />
                        </Tooltip>
                    </Space>
                </div>
            }
            bodyStyle={{
                padding: '0 16px 16px',
                background: `linear-gradient(135deg, ${getWeatherColor(weather.weather)}11, #ffffff)`,
            }}
            bordered={false}
        >
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                    animation: refreshing ? 'fadeIn 0.5s ease-in-out' : 'none',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '8px',
                    }}
                >
                    <span style={{
                        fontSize: '48px',
                        marginRight: '16px',
                        display: 'inline-block',
                        animation: 'float 3s ease-in-out infinite',
                    }}>{getWeatherIcon(weather.weather)}</span>
                    <div style={{ textAlign: 'left' }}>
                        <span style={{
                            fontSize: '42px',
                            fontWeight: 'bold',
                            lineHeight: '1',
                            background: `linear-gradient(135deg, ${getWeatherColor(weather.weather)}, #333)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>{weather.temperature}°</span>
                        <div style={{ fontSize: '18px', color: '#666' }}>{weather.weather} {getWeatherEmoji(weather.weather)}</div>
                    </div>
                </div>
                <Text style={{ fontSize: '14px', color: '#666' }}>
                    {getWeatherTip(weather.weather, weather.temperature)}
                </Text>
            </div>

            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <Text style={{ color: '#666' }}>湿度</Text>
                            <Text strong style={{ color: '#333' }}>{weather.humidity}%</Text>
                        </div>
                        <div style={{
                            height: '4px',
                            background: '#f0f0f0',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${weather.humidity}%`,
                                background: '#1890ff',
                                borderRadius: '2px',
                            }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#666' }}>风向</Text>
                        <Tag color={getWeatherColor(weather.weather)}>{getWindDirectionChinese(weather.winddirection)}</Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#666' }}>风力</Text>
                        <Tag color="cyan">{weather.windpower}</Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: '#666' }}>更新时间</Text>
                        <Text type="secondary">{weather.reporttime.substring(11, 19)}</Text>
                    </div>
                </Space>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0.6; }
                    to { opacity: 1; }
                }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </Card>
    );
};

export default WeatherWidget; 