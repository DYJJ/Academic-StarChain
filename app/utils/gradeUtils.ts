/**
 * 成绩相关工具函数
 */

/**
 * 将数字分数转换为字母等级
 * @param score 数字分数
 * @returns 字母等级
 */
export function getGradeFromScore(score?: number | null): string | null {
  if (score === undefined || score === null) return null;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 获取成绩等级的颜色
 * @param grade 成绩等级
 * @returns 颜色代码
 */
export function getGradeColor(grade?: string | null): string {
  if (!grade) return '#d9d9d9';
  
  switch (grade) {
    case 'A': return '#52c41a'; // 绿色
    case 'B': return '#1890ff'; // 蓝色
    case 'C': return '#faad14'; // 黄色
    case 'D': return '#fa8c16'; // 橙色
    case 'F': return '#f5222d'; // 红色
    default: return '#d9d9d9'; // 灰色
  }
}

/**
 * 获取成绩状态文本
 * @param status 成绩状态代码
 * @returns 状态文本
 */
export function getStatusText(status?: string): string {
  switch (status) {
    case 'enrolled': return '在修';
    case 'completed': return '已完成';
    case 'dropped': return '已退课';
    default: return '未知';
  }
}

/**
 * 获取成绩状态颜色
 * @param status 成绩状态代码
 * @returns 颜色代码
 */
export function getStatusColor(status?: string): string {
  switch (status) {
    case 'enrolled': return 'blue';
    case 'completed': return 'green';
    case 'dropped': return 'red';
    default: return 'default';
  }
}

/**
 * 计算平均分
 * @param scores 分数数组
 * @returns 平均分
 */
export function calculateAverage(scores: (number | null | undefined)[]): number | null {
  const validScores = scores.filter(score => score !== null && score !== undefined) as number[];
  
  if (validScores.length === 0) return null;
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round((sum / validScores.length) * 10) / 10; // 保留一位小数
}

/**
 * 计算及格率
 * @param scores 分数数组
 * @returns 及格率（百分比）
 */
export function calculatePassRate(scores: (number | null | undefined)[]): number | null {
  const validScores = scores.filter(score => score !== null && score !== undefined) as number[];
  
  if (validScores.length === 0) return null;
  
  const passCount = validScores.filter(score => score >= 60).length;
  return Math.round((passCount / validScores.length) * 100);
}

/**
 * 计算各等级分布
 * @param scores 分数数组
 * @returns 各等级人数分布
 */
export function calculateGradeDistribution(scores: (number | null | undefined)[]): Record<string, number> {
  const validScores = scores.filter(score => score !== null && score !== undefined) as number[];
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  
  validScores.forEach(score => {
    const grade = getGradeFromScore(score);
    if (grade) {
      distribution[grade as keyof typeof distribution]++;
    }
  });
  
  return distribution;
}

// 默认导出
const gradeUtils = {
  getGradeFromScore,
  getGradeColor,
  getStatusText,
  getStatusColor,
  calculateAverage,
  calculatePassRate,
  calculateGradeDistribution
};

export default gradeUtils; 