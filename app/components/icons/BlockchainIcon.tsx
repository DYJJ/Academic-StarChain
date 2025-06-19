import React from 'react';
import Icon from '@ant-design/icons';

// 自定义区块链SVG图标
const BlockchainSvg = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68c-17.7 0-32 14.3-32 32v384c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V496c0-17.7-14.3-32-32-32zM332 240c0-30.9 25.1-56 56-56h248c30.9 0 56 25.1 56 56v224H332V240zm460 600H232V536h560v304zM512 420c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96z m-16 96c0 8.8 7.2 16 16 16s16-7.2 16-16-7.2-16-16-16-16 7.2-16 16z" />
        <path d="M432 648c0 4.4 3.6 8 8 8h144c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H440c-4.4 0-8 3.6-8 8v48z" />
    </svg>
);

// 创建自定义图标组件
const BlockchainIcon = (props) => <Icon component={BlockchainSvg} {...props} />;

export default BlockchainIcon; 