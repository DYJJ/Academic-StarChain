# MySQL数据库配置详细图文教程

本教程专为不熟悉数据库的用户提供，详细介绍如何使用Navicat Premium连接MySQL数据库并配置项目。

## 目录

- [第一步：安装MySQL](#第一步安装mysql)
- [第二步：安装Navicat Premium](#第二步安装navicat-premium)
- [第三步：使用Navicat连接MySQL](#第三步使用navicat连接mysql)
- [第四步：创建数据库](#第四步创建数据库)
- [第五步：配置项目环境变量](#第五步配置项目环境变量)
- [第六步：初始化数据库](#第六步初始化数据库)
- [常见问题与解决方案](#常见问题与解决方案)

## 第一步：安装MySQL

1. 访问MySQL官方网站：https://dev.mysql.com/downloads/mysql/
2. 下载适合您操作系统的MySQL版本
3. 安装过程中的重要设置：
   - 选择"Developer Default"安装类型
   - 记住设置的root用户密码（非常重要！）
   - 其他选项可保持默认值

> 注意：安装过程中设置的root密码将用于连接数据库，请务必记住！

## 第二步：安装Navicat Premium

Navicat Premium是一个可视化的数据库管理工具，使数据库操作变得简单。

1. 下载并安装Navicat Premium：https://www.navicat.com/en/download/navicat-premium
2. 完成安装后启动Navicat Premium

## 第三步：使用Navicat连接MySQL

1. 在Navicat Premium中创建新连接：
   - 点击窗口左上角的"连接"按钮
   - 选择"MySQL"选项

   ![创建新连接](https://i.imgur.com/example1.png)

2. 填写连接信息：
   - 连接名：自定义一个名称（如"学生成绩系统"）
   - 主机：localhost（如果MySQL安装在当前计算机上）
   - 端口：3306（MySQL默认端口）
   - 用户名：root（或您创建的其他用户）
   - 密码：您在MySQL安装时设置的密码

   ![填写连接信息](https://i.imgur.com/example2.png)

3. 点击"测试连接"按钮，确保能够成功连接到MySQL
4. 测试成功后，点击"保存"按钮

## 第四步：创建数据库

1. 在Navicat中右键点击左侧已创建的MySQL连接
2. 选择"新建数据库"选项

   ![新建数据库](https://i.imgur.com/example3.png)

3. 配置数据库：
   - 数据库名：输入`student_grade_cert`（务必使用此名称）
   - 字符集：选择`utf8mb4`
   - 排序规则：选择`utf8mb4_unicode_ci`

   ![配置数据库](https://i.imgur.com/example4.png)

4. 点击"确定"创建数据库
5. 在左侧导航栏中应该能看到新创建的`student_grade_cert`数据库

## 第五步：配置项目环境变量

1. 在项目根目录找到`.env.example`文件
2. 复制此文件并重命名为`.env`
3. 使用文本编辑器（如记事本、VS Code等）打开`.env`文件
4. 修改`DATABASE_URL`变量：

```
DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"
```

例如，使用默认设置：

```
DATABASE_URL="mysql://root:yourpassword@localhost:3306/student_grade_cert"
```

将`yourpassword`替换为您的MySQL root密码。

> 注意：如果您的密码中包含特殊字符（如@、#、%等），需要进行URL编码。

## 第六步：初始化数据库

1. 打开命令行终端（CMD或PowerShell）
2. 切换到项目根目录
3. 执行以下命令创建数据库表：

```bash
npx prisma migrate dev
```

4. 执行以下命令添加初始数据：

```bash
npm run db:seed
```

> 注意：如果执行`npm run db:seed`出现错误，请确保您已经安装了必要的依赖：

```bash
npm install dotenv
```

5. 如果一切顺利，您应该会看到成功创建了三个用户（管理员、教师和学生）以及5门课程

6. 现在您可以使用以下账户登录系统：

   - **管理员账号**: admin@example.com / 密码: 123456
   - **教师账号**: teacher@example.com / 密码: 123456
   - **学生账号**: student@example.com / 密码: 123456

## 常见问题与解决方案

### 问题1：连接到MySQL失败

**症状**：Navicat显示"连接失败"错误

**解决方案**：
- 确认MySQL服务是否正在运行
- 检查用户名和密码是否正确
- 确认端口号是否正确（默认是3306）
- 检查防火墙设置是否阻止了MySQL连接

### 问题2：初始化数据库命令失败

**症状**：执行`npx prisma migrate dev`命令时出错

**解决方案**：
- 确认DATABASE_URL配置正确
- 检查数据库用户是否有足够权限创建表
- 确认MySQL服务正在运行

### 问题3：密码包含特殊字符

**症状**：连接字符串解析错误

**解决方案**：
- 对密码中的特殊字符进行URL编码
- 最好的办法是修改MySQL密码，使用不含特殊字符的新密码

例如，如果密码是`pass@word`，URL编码后应为：`pass%40word`

### 问题4：数据库表已存在

**症状**：初始化数据库时提示表已存在

**解决方案**：
- 如果您想重新创建所有表，可以在Navicat中右键点击数据库，选择"删除数据库"并重新创建
- 然后重新执行初始化命令

### 问题5：npm run db:seed 命令不可用

**症状**：执行命令时提示找不到脚本

**解决方案**：
- 确保您使用的是最新版本的代码
- 检查package.json文件中是否包含"db:seed"脚本
- 如果没有，可以手动编辑package.json文件，在"scripts"部分添加：
  ```json
  "db:seed": "node seed.js"
  ```

## 附录：远程数据库连接

如果您的MySQL数据库部署在远程服务器上，配置稍有不同：

1. 确保远程服务器的MySQL配置允许远程连接（修改my.cnf的bind-address）
2. 确认远程服务器的防火墙开放了3306端口
3. 在连接字符串中使用服务器IP地址（而非localhost）

例如：

```
DATABASE_URL="mysql://user:password@server_ip:3306/student_grade_cert"
```

---

如果您在配置过程中遇到任何问题，请查看项目GitHub页面提交issue或联系开发团队获取支持。 