// 图表颜色 - 使用更现代的配色方案
export const COLORS = [
  '#1890ff', '#52c41a', '#fa8c16', '#722ed1', 
  '#eb2f96', '#13c2c2', '#faad14', '#a0d911'
];

// 申诉类型映射
export const appealTypeMap = {
  'SCORE_ERROR': '分数错误',
  'CALCULATION_ERROR': '计算错误',
  'MISSING_POINTS': '漏计分数',
  'OTHER': '其他原因'
};

// 申诉状态映射
export const appealStatusMap = {
  'PENDING': { text: '待处理', color: 'blue' },
  'REVIEWING': { text: '审核中', color: 'orange' },
  'RESOLVED': { text: '已解决', color: 'green' },
  'REJECTED': { text: '已拒绝', color: 'red' }
}; 