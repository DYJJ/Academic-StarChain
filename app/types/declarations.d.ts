// 添加对react-responsive-masonry模块的类型声明
declare module 'react-responsive-masonry' {
    import * as React from 'react';

    export interface MasonryProps {
        columnsCount?: number;
        gutter?: string | number;
        className?: string;
        children?: React.ReactNode;
        style?: React.CSSProperties;
    }

    export interface ResponsiveMasonryProps {
        columnsCountBreakPoints?: {
            [key: number]: number;
        };
        className?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    }

    export default class Masonry extends React.Component<MasonryProps> { }
    export class ResponsiveMasonry extends React.Component<ResponsiveMasonryProps> { }
} 