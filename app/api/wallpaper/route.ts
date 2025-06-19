import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 从服务器端发起请求，避开浏览器的CORS限制
        const timestamp = new Date().getTime();
        const response = await fetch(`https://t.alcy.cc/fj?t=${timestamp}`, {
            method: 'GET',
            // 设置无缓存，确保每次都获取新图片
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('壁纸API请求失败');
        }

        // 获取图片数据
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // 直接返回图片数据
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('获取壁纸数据失败:', error);
        return NextResponse.json(
            { error: '获取壁纸数据失败' },
            { status: 500 }
        );
    }
} 