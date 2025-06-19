'use client';

import React from 'react';
import { CustomTooltipProps } from '../utils/types';
import { formatDate } from '../utils/chartUtils';

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>
          {payload[0].payload.formattedDate || formatDate(label || '')}
        </p>
        {payload.map((entry, index) => {
          // 只显示有值的课程
          if (typeof entry.value !== 'number') return null;
          
          return (
            <p key={index} style={{ 
              margin: '2px 0',
              color: entry.color
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: entry.color,
                marginRight: '5px'
              }} />
              {entry.name}: {entry.value.toFixed(1)}分
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default CustomTooltip; 