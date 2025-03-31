#!/bin/bash

# 部署前准备脚本
# 此脚本在Vercel部署前执行，用于准备生产环境

echo "开始执行部署前准备..."

# 确保依赖已安装
echo "安装依赖..."
npm install

# 生成Prisma客户端
echo "生成Prisma客户端..."
npx prisma generate

# 应用数据库迁移
echo "应用数据库迁移..."
npx prisma migrate deploy

# 添加其他准备工作
# ...

echo "部署前准备完成!" 