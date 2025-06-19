'use client';

import { NextRequest } from 'next/server';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/auth/session`);
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('获取用户会话失败:', error);
        return null;
    }
} 