import { PrismaClient } from '@prisma/client';

// 全局声明，避免在开发环境中创建多个实例
declare global {
  var prisma: PrismaClient | undefined;
}

// 使用全局的prisma实例来避免在热重载时创建多个实例
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma; 