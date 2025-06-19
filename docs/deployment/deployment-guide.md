# 学生成绩认证系统部署指南

本文档提供了部署学生成绩认证系统到不同环境的详细步骤。

## 目录

- [本地开发环境部署](#本地开发环境部署)
- [生产环境部署](#生产环境部署)
  - [Vercel部署](#vercel部署)
  - [传统服务器部署](#传统服务器部署)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [SSL配置](#ssl配置)
- [性能优化](#性能优化)
- [维护与更新](#维护与更新)
- [常见问题排查](#常见问题排查)

## 本地开发环境部署

### 前提条件

- Node.js 18.x 或更高版本
- npm 8.x 或更高版本
- MySQL 8.x 或更高版本
- Git

### 步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/jwyismynane/Academic-performance-star-travel-chain2.git
   cd Academic-performance-star-travel-chain2
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，填入必要的配置（参考[环境变量配置](#环境变量配置)）

4. **初始化数据库**

   确保MySQL服务正在运行，并已创建数据库（参考[数据库配置指南](./database-setup-guide.md)）

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

5. **启动开发服务器**

   ```bash
   npm run dev
   ```

6. **访问应用**

   打开浏览器，访问 http://localhost:3000

## 生产环境部署

### Vercel部署

[Vercel](https://vercel.com) 是部署Next.js应用的理想平台，它提供了简单的部署流程和自动扩展能力。

#### 前提条件

- GitHub、GitLab或Bitbucket账号
- Vercel账号
- 远程MySQL数据库（可以使用AWS RDS、DigitalOcean等服务）

#### 步骤

1. **准备代码库**

   确保你的代码已推送到GitHub、GitLab或Bitbucket等Git仓库

2. **连接Vercel与代码仓库**

   - 登录[Vercel](https://vercel.com)
   - 点击"New Project"
   - 选择包含你代码的Git仓库
   - 授权Vercel访问该仓库

3. **配置项目**

   - 项目名称：输入你想要的项目名称
   - 框架预设：选择"Next.js"
   - 根目录：保持默认（如果你的Next.js应用在根目录）

4. **配置环境变量**

   点击"Environment Variables"部分，添加以下环境变量：
   
   - `DATABASE_URL`：你的MySQL数据库连接URL
   - `JWT_SECRET`：JWT认证的密钥
   - `NEXT_PUBLIC_APP_URL`：应用的URL（通常是Vercel分配的域名）

5. **部署**

   点击"Deploy"按钮开始部署

6. **运行数据库迁移**

   部署完成后，你需要运行数据库迁移。有两种方式：

   - **使用Vercel CLI**：
     ```bash
     npm install -g vercel
     vercel login
     vercel env pull
     npx prisma migrate deploy
     ```

   - **使用Vercel Dashboard中的Function执行**：
     在Vercel仪表板中创建一个一次性函数来运行迁移

7. **验证部署**

   访问Vercel提供的URL确认应用正常运行

### 传统服务器部署

如果你想在传统服务器（如AWS EC2、DigitalOcean Droplet等）上部署应用，可以按照以下步骤操作。

#### 前提条件

- Linux服务器（推荐Ubuntu 20.04 LTS或更高版本）
- Node.js 18.x或更高版本
- Nginx或Apache HTTP服务器
- MySQL数据库服务器
- PM2进程管理器

#### 步骤

1. **准备服务器**

   安装必要的软件：
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx mysql-server
   sudo npm install -g pm2
   ```

2. **克隆代码库**

   ```bash
   git clone https://github.com/jwyismynane/Academic-performance-star-travel-chain2.git
   cd Academic-performance-star-travel-chain2
   ```

3. **安装依赖**

   ```bash
   npm install
   ```

4. **配置环境变量**

   ```bash
   cp .env.example .env
   nano .env
   ```

   编辑`.env`文件，填入必要的配置信息

5. **构建应用**

   ```bash
   npm run build
   ```

6. **初始化数据库**

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

7. **配置PM2**

   创建PM2配置文件：
   ```bash
   nano ecosystem.config.js
   ```

   添加以下内容：
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'student-grade-system',
         script: 'node_modules/next/dist/bin/next',
         args: 'start',
         instances: 'max',
         exec_mode: 'cluster',
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
         env: {
           NODE_ENV: 'production',
           PORT: 3000
         }
       }
     ]
   };
   ```

   启动应用：
   ```bash
   pm2 start ecosystem.config.js
   ```

   设置开机自启：
   ```bash
   pm2 startup
   pm2 save
   ```

8. **配置Nginx**

   创建Nginx配置文件：
   ```bash
   sudo nano /etc/nginx/sites-available/student-grade-system
   ```

   添加以下内容：
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

   启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/student-grade-system /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **配置SSL（可选但推荐）**

   使用Let's Encrypt获取免费SSL证书：
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 环境变量配置

应用使用以下环境变量：

| 变量名 | 描述 | 示例 |
|---|---|---|
| `DATABASE_URL` | 数据库连接URL | `mysql://user:password@localhost:3306/student_grade_cert?charset=utf8mb4` |
| `JWT_SECRET` | JWT令牌加密密钥 | `your_super_secret_key_for_student_grade_certification` |
| `NEXT_PUBLIC_APP_URL` | 应用的公共URL | `http://localhost:3000`或`https://your-domain.com` |

## 数据库配置

详细的数据库配置步骤请参考[数据库配置指南](./database-setup-guide.md)。

## SSL配置

在生产环境中，强烈建议配置SSL以加密数据传输。

### Let's Encrypt (推荐)

Let's Encrypt提供免费的SSL证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 自签名证书

对于内部部署或测试环境，可以使用自签名证书：

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt
```

将生成的证书配置到Nginx或Apache中。

## 性能优化

### 应用性能

1. **启用生产模式**
   
   确保在`.env`文件中设置：
   ```
   NODE_ENV=production
   ```

2. **使用PM2集群模式**
   
   在`ecosystem.config.js`中配置：
   ```javascript
   {
     instances: 'max',
     exec_mode: 'cluster'
   }
   ```

3. **配置缓存**
   
   在Nginx中添加缓存配置：
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
     expires 1y;
     add_header Cache-Control "public, max-age=31536000";
   }
   ```

### 数据库性能

1. **索引优化**
   
   为常用查询字段添加索引：
   ```sql
   CREATE INDEX idx_user_email ON User(email);
   CREATE INDEX idx_course_code ON Course(code);
   ```

2. **连接池配置**
   
   在Prisma中配置连接池：
   ```
   connection_limit=20
   pool_timeout=10
   ```

## 维护与更新

### 定期备份

设置MySQL数据库的定期备份：

```bash
# 创建备份脚本
nano backup.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
MYSQL_USER="your_mysql_user"
MYSQL_PASSWORD="your_mysql_password"
DATABASE_NAME="student_grade_cert"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mysqldump -u$MYSQL_USER -p$MYSQL_PASSWORD $DATABASE_NAME | gzip > $BACKUP_DIR/$DATABASE_NAME-$TIMESTAMP.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +30 -delete
```

```bash
# 添加执行权限
chmod +x backup.sh

# 添加到crontab
crontab -e
```

添加以下行以每天凌晨3点执行备份：
```
0 3 * * * /path/to/backup.sh
```

### 应用更新

1. **拉取最新代码**

   ```bash
   cd /path/to/Academic-performance-star-travel-chain2
   git pull
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **更新数据库**

   ```bash
   npx prisma migrate deploy
   ```

4. **重新构建应用**

   ```bash
   npm run build
   ```

5. **重启应用**

   ```bash
   pm2 restart student-grade-system
   ```

## 常见问题排查

### 连接数据库失败

**问题**: 应用无法连接到数据库

**解决方案**:
1. 检查`.env`文件中的`DATABASE_URL`配置
2. 确保MySQL服务正在运行
3. 验证数据库用户有正确的权限
4. 检查防火墙设置是否允许数据库连接

### 应用无法启动

**问题**: 应用启动失败或崩溃

**解决方案**:
1. 检查错误日志：`pm2 logs`
2. 确保所有环境变量已正确设置
3. 验证Node.js版本兼容性
4. 确认所有依赖已正确安装：`npm install`

### 无法访问应用

**问题**: 浏览器无法访问应用

**解决方案**:
1. 确认应用正在运行：`pm2 status`
2. 检查Nginx配置和状态：`nginx -t` 和 `systemctl status nginx`
3. 验证防火墙设置允许HTTP(80)和HTTPS(443)端口
4. 检查DNS设置是否正确指向服务器IP

### 性能问题

**问题**: 应用响应缓慢

**解决方案**:
1. 检查服务器资源使用情况：`top`, `htop`, `free -m`
2. 监控数据库性能：`SHOW PROCESSLIST;`
3. 考虑增加服务器资源或优化代码
4. 检查并优化数据库查询 