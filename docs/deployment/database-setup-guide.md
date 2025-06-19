# 数据库配置详细指南

本文档提供了为学生成绩认证系统设置MySQL数据库的详细步骤。

## 目录

- [安装MySQL](#安装mysql)
- [创建数据库](#创建数据库)
- [配置数据库连接](#配置数据库连接)
- [初始化数据库表](#初始化数据库表)
- [添加测试数据](#添加测试数据)
- [常见问题排查](#常见问题排查)

## 安装MySQL

### Windows系统

1. 访问[MySQL官网下载页面](https://dev.mysql.com/downloads/mysql/)
2. 下载适用于Windows的MySQL安装包
3. 运行安装程序，按照向导进行安装
4. 选择"Developer Default"安装类型
5. 在安装过程中，会要求设置root用户密码，请记住此密码
6. 完成安装后，MySQL服务应自动启动

### macOS系统

1. 访问[MySQL官网下载页面](https://dev.mysql.com/downloads/mysql/)
2. 下载适用于macOS的DMG文件
3. 打开DMG文件并运行安装包
4. 按照安装向导完成安装
5. 安装过程中会提供一个临时root密码，请保存此密码
6. 可以使用MySQL偏好设置面板启动或停止MySQL服务

### Linux系统(Ubuntu)

1. 打开终端，更新包索引：
   ```bash
   sudo apt update
   ```

2. 安装MySQL服务器：
   ```bash
   sudo apt install mysql-server
   ```

3. 安装完成后，启动MySQL服务：
   ```bash
   sudo systemctl start mysql
   ```

4. 设置MySQL开机启动：
   ```bash
   sudo systemctl enable mysql
   ```

5. 运行安全配置脚本：
   ```bash
   sudo mysql_secure_installation
   ```

6. 根据提示设置root密码和其他安全选项

## 创建数据库

### 使用GUI工具(Navicat Premium/MySQL Workbench)

#### Navicat Premium

1. 安装[Navicat Premium](https://www.navicat.com/)
2. 打开Navicat并创建新的MySQL连接：
   - 点击左上角的"连接" → "MySQL"
   - 填写连接信息：
     - 连接名：任意名称（例如"学生成绩系统"）
     - 主机：localhost（如果MySQL在本地）
     - 端口：3306（MySQL默认端口）
     - 用户名：root（或你创建的其他用户）
     - 密码：你的MySQL密码
   - 点击"测试连接"确保连接成功
   - 点击"确定"保存连接

3. 创建新数据库：
   - 右键点击你创建的连接
   - 选择"新建数据库"
   - 在对话框中填写：
     - 数据库名：`student_grade_cert`
     - 字符集：`utf8mb4`
     - 排序规则：`utf8mb4_unicode_ci`
   - 点击"确定"创建数据库

#### MySQL Workbench

1. 安装[MySQL Workbench](https://www.mysql.com/products/workbench/)
2. 打开MySQL Workbench并连接到你的MySQL服务器
3. 在查询窗口执行以下SQL语句创建数据库：
   ```sql
   CREATE DATABASE student_grade_cert
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```

### 使用命令行

1. 打开终端或命令提示符
2. 使用以下命令登录MySQL：
   ```bash
   mysql -u root -p
   ```
   输入你的MySQL root密码

3. 创建数据库：
   ```sql
   CREATE DATABASE student_grade_cert
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```

4. 确认数据库已创建：
   ```sql
   SHOW DATABASES;
   ```

5. 退出MySQL命令行：
   ```sql
   EXIT;
   ```

## 配置数据库连接

1. 在项目根目录找到`.env.example`文件
2. 复制此文件并将其重命名为`.env`：
   ```bash
   cp .env.example .env
   ```

3. 编辑`.env`文件，配置DATABASE_URL变量：
   ```
   DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名?charset=utf8mb4"
   ```

   例如，本地MySQL连接：
   ```
   DATABASE_URL="mysql://root:your_password@localhost:3306/student_grade_cert?charset=utf8mb4"
   ```

   请将`your_password`替换为你的实际MySQL密码

4. 注意事项：
   - 如果密码中包含特殊字符，需要进行URL编码
   - 如果密码中包含`@`符号，需要进行URL编码，例如`@`应替换为`%40`
   - 如果使用远程数据库，需要确保MySQL服务器允许远程连接

## 初始化数据库表

在项目根目录下运行以下命令，使用Prisma创建数据库表：

1. 安装项目依赖（如果尚未安装）：
   ```bash
   npm install
   ```

2. 运行Prisma迁移命令：
   ```bash
   npx prisma migrate dev
   ```

3. 此命令会在数据库中创建所有必要的表结构

4. 可以使用`npx prisma studio`命令启动Prisma Studio，以可视化方式查看和编辑数据库内容

## 添加测试数据

1. 确保`package.json`文件中包含`db:seed`脚本：
   ```json
   "scripts": {
     "db:seed": "node prisma/seed.js"
   }
   ```

2. 确保安装了所需依赖：
   ```bash
   npm install dotenv @prisma/client bcryptjs
   ```

3. 运行种子脚本添加测试数据：
   ```bash
   npm run db:seed
   ```

4. 种子脚本会创建默认用户账号：
   - 管理员: admin@example.com (密码: 123456)
   - 教师: teacher@example.com (密码: 123456)
   - 学生: student@example.com (密码: 123456)

## 常见问题排查

### 连接错误

**问题**: 无法连接到MySQL数据库

**解决方案**:
- 确保MySQL服务正在运行
- 检查用户名和密码是否正确
- 确保.env文件中的连接字符串格式正确
- 检查数据库名称是否存在
- 尝试使用MySQL客户端手动连接数据库验证连接信息

### 权限问题

**问题**: 操作数据库时出现权限错误

**解决方案**:
- 确保用户拥有操作数据库的权限
- 在MySQL中执行以下命令授予权限：
  ```sql
  GRANT ALL PRIVILEGES ON student_grade_cert.* TO 'your_username'@'localhost';
  FLUSH PRIVILEGES;
  ```

### 字符集问题

**问题**: 显示中文时出现乱码

**解决方案**:
- 确保数据库和表使用`utf8mb4`字符集
- 确保连接字符串中包含`charset=utf8mb4`参数
- 检查应用程序代码中的字符集设置

### Prisma迁移失败

**问题**: 运行`npx prisma migrate dev`时出错

**解决方案**:
- 检查错误消息，了解具体问题
- 确保DATABASE_URL环境变量配置正确
- 尝试重置数据库：`npx prisma migrate reset`（注意：这会删除所有数据）
- 查看Prisma日志获取更多信息

### 种子脚本失败

**问题**: 运行`npm run db:seed`时出错

**解决方案**:
- 确保种子脚本文件存在于正确位置
- 检查脚本中是否有语法错误
- 确保已安装所有必要的依赖
- 检查Prisma客户端版本是否与schema兼容 