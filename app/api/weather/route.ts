import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 从服务器端发起请求，避开浏览器的CORS限制
        const response = await fetch('https://whyta.cn/api/tianqi?key=36de5db81215&city=%E5%8D%97%E6%98%8C%E5%B8%82', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // 下一行确保请求在服务器端完成，不是在浏览器
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('天气API请求失败');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('获取天气数据失败:', error);
        return NextResponse.json(
            { error: '获取天气数据失败' },
            { status: 500 }
        );
    }
} 