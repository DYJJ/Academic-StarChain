'use client';

import { ReactNode } from 'react';
import BackgroundWallpaper from '../components/BackgroundWallpaper';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <BackgroundWallpaper>
            {children}
        </BackgroundWallpaper>
    );
} 