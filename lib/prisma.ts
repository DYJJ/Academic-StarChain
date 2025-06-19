import { PrismaClient } from '@prisma/client';

// PrismaClient是一个提供数据库查询的类
// 为了防止在开发期间创建过多的连接，这里使用全局变量
// 在生产环境中，确保每个请求仅使用单个Prisma实例

// 添加声明以避免全局类型错误
declare global {
  // 允许全局变量是PrismaClient实例或undefined
  var prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const prisma = global.prisma || new PrismaClient();

// 在开发环境中将实例添加到全局变量中以防止热重载
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma; 