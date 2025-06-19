import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const userSession = cookieStore.get('user_session')?.value;

        if (!userSession) {
            return NextResponse.json({ user: null });
        }

        const user = JSON.parse(userSession);
        return NextResponse.json({ user });
    } catch (error) {
        console.error('解析用户会话失败:', error);
        return NextResponse.json({ user: null });
    }
} 