# 留言管理系统后端

基于 FastAPI + MySQL 的现代化留言管理后端服务

## 功能特性

- ✅ RESTful API 设计
- ✅ 数据库连接和 ORM
- ✅ 数据验证和错误处理
- ✅ 搜索和筛选功能
- ✅ 分页和排序
- ✅ 统计信息
- ✅ CORS 支持
- ✅ 日志记录

## 技术栈

- **框架**: FastAPI (Python 3.8+)
- **数据库**: MySQL 8.0+
- **ORM**: SQLAlchemy 2.0
- **验证**: Pydantic
- **部署**: Uvicorn/Gunicorn

## 项目结构

```
backend/
├── main.py              # 主应用文件
├── config.py            # 配置管理
├── database.py          # 数据库连接
├── models.py            # 数据模型
├── schemas.py           # 请求/响应模式
├── services.py          # 业务逻辑
├── api.py               # API 路由
├── init_db.py           # 数据库初始化
├── requirements.txt     # 依赖列表
├── .env.example         # 环境变量示例
└── README.md            # 本文档
```

## 快速开始

### 1. 环境准备

确保已安装以下软件：
- Python 3.8+
- MySQL 8.0+
- pip (Python 包管理器)

### 2. 创建虚拟环境

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 数据库配置

#### 4.1 创建数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE message_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'message_api'@'%' IDENTIFIED BY 'your_secure_password_here';

-- 授权
GRANT ALL PRIVILEGES ON message_system.* TO 'message_api'@'%';
FLUSH PRIVILEGES;
```

#### 4.2 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接信息
```

### 5. 初始化数据库

```bash
# 运行数据库初始化脚本
python init_db.py
```

### 6. 启动服务

#### 开发模式

```bash
# 直接运行
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 生产模式

```bash
# 使用 gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API 文档

启动服务后，可以访问以下文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 健康检查: http://localhost:8000/health

## API 端点

### 留言管理

- `GET /api/v1/messages/` - 获取留言列表（支持搜索、筛选、分页）
- `POST /api/v1/messages/` - 创建新留言
- `GET /api/v1/messages/{id}` - 获取单条留言
- `PUT /api/v1/messages/{id}` - 更新留言
- `DELETE /api/v1/messages/{id}` - 删除留言

### 其他功能

- `GET /api/v1/messages/statistics/overview` - 获取统计信息
- `PATCH /api/v1/messages/{id}/read` - 标记留言为已读
- `POST /api/v1/messages/bulk-delete` - 批量删除留言

## 配置说明

### 环境变量

在 `.env` 文件中配置以下参数：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=message_api
DB_PASSWORD=your_password_here
DB_NAME=message_system

# FastAPI 配置
DEBUG=True

# CORS 配置（生产环境请配置具体域名）
BACKEND_CORS_ORIGINS=["*"]
```

### 数据库连接字符串

默认使用以下格式：
```
mysql+pymysql://username:password@host:port/database
```

## 部署指南

### Docker 部署（推荐）

#### 1. 创建 Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: message_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: message_system
      MYSQL_USER: message_api
      MYSQL_PASSWORD: message_api_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  fastapi:
    build: .
    container_name: message_api
    restart: always
    ports:
      - "8000:8000"
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: message_api
      DB_PASSWORD: message_api_password
      DB_NAME: message_system
    volumes:
      - ./backend:/app

volumes:
  mysql_data:
```

#### 3. 启动服务

```bash
docker-compose up -d
```

### 传统部署

#### 1. 安装系统依赖

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv mysql-server

# CentOS/RHEL
sudo yum install -y python3-pip python3-venv mysql-server
```

#### 2. 配置 MySQL

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### 3. 部署应用

```bash
# 克隆代码
git clone <your-repo-url>
cd message-system/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 启动应用
nohup python main.py > app.log 2>&1 &
```

#### 4. 配置反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控和维护

### 日志管理

应用日志默认输出到控制台，生产环境建议配置日志轮转：

```bash
# 使用 logrotate
sudo nano /etc/logrotate.d/message-system

# 添加以下内容
/path/to/your/app.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 user user
}
```

### 健康检查

```bash
# 创建健康检查脚本
check_health.sh
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ $response -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy"
    exit 1
fi
```

### 备份策略

```bash
# 数据库备份脚本
backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u message_api -p message_system > backup_$DATE.sql
gzip backup_$DATE.sql
# 删除7天前的备份
find . -name "backup_*.sql.gz" -mtime +7 -delete
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 MySQL 服务状态
   - 验证用户名和密码
   - 确认防火墙设置

2. **端口被占用**
   - 修改端口号
   - 杀死占用进程

3. **权限问题**
   - 检查文件权限
   - 确认用户权限

### 调试技巧

```bash
# 查看应用日志
tail -f app.log

# 测试数据库连接
mysql -u message_api -p -h localhost message_system

# 检查端口状态
netstat -tuln | grep 8000
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License