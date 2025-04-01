# 学生成绩可信存证系统

## 项目简介

学生成绩可信存证系统是一个基于Next.js和Node.js构建的Web应用，旨在为教育机构提供一个安全可靠的成绩管理和验证平台。系统利用加密哈希技术确保成绩记录不可篡改，同时提供完整的验证历史记录，使成绩数据具有可追溯性和可信度。

## 系统特点

- **防篡改**: 利用加密哈希技术确保成绩记录不可篡改
- **可追溯**: 记录每次验证操作，完整追溯成绩历史
- **易验证**: 简单快捷的验证流程，确保成绩真实可信
- **角色权限**: 支持学生、教师、管理员不同角色权限管理
- **安全认证**: 基于JWT的身份验证机制

## 技术栈

- **前端**: Next.js 13 (App Router), React, TailwindCSS
- **后端**: Node.js, Next.js API Routes
- **数据库**: MySQL
- **认证**: JWT, bcryptjs
- **加密**: crypto-js

## 安装和运行

### 前提条件

- Node.js 18+ 
- MySQL 数据库

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/student-grade-certification.git
cd student-grade-certification
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量

在项目根目录创建`.env`文件，添加以下配置：
```
# 数据库连接
DATABASE_URL="mysql://用户名:密码@localhost:3306/student_grade_cert"

# JWT密钥
JWT_SECRET="your_super_secret_key_for_student_grade_certification"

# 应用设置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. 初始化数据库
```bash
npm run init-db
```

5. 启动开发服务器
```bash
npm run dev
```

6. 在浏览器中访问 http://localhost:3000

## 使用说明

### 默认账号

系统初始化后将创建以下默认账号：

- **管理员**
  - 邮箱: admin@example.com
  - 密码: admin123

- **教师**
  - 邮箱: teacher@example.com
  - 密码: teacher123

- **学生**
  - 邮箱: student@example.com
  - 密码: student123

### 主要功能

- **学生**
  - 查看个人成绩
  - 验证成绩真实性
  - 查看验证历史

- **教师**
  - 创建新成绩
  - 查看已创建的成绩
  - 验证任意成绩

- **管理员**
  - 管理用户和成绩
  - 查看系统日志和验证记录

## 架构设计

### 数据库结构

系统包含三个主要数据表：

1. **users** - 用户信息
2. **grades** - 成绩记录
3. **certifications** - 验证历史

### 安全机制

- 密码使用bcrypt加密存储
- 成绩数据使用SHA-256哈希算法生成唯一标识
- API接口使用JWT进行身份验证和授权

## 开发说明

### 项目结构

```
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API路由
│   │   ├── dashboard/   # 仪表板页面
│   │   ├── login/       # 登录页面
│   │   ├── register/    # 注册页面
│   ├── lib/             # 工具库
│   │   ├── auth.ts      # 认证相关功能
│   │   ├── db.ts        # 数据库连接和操作
│   │   ├── grades.ts    # 成绩管理功能
│   ├── middleware.ts    # 中间件(用户验证等)
│   ├── scripts/         # 脚本(如数据库初始化)
├── .env                 # 环境变量
├── package.json         # 依赖配置
├── README.md            # 项目说明
└── tsconfig.json        # TypeScript配置
```

## 贡献指南

1. Fork仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

[MIT](LICENSE) © [Your Name] 