# 前后端集成指南

本指南将帮助您将前端页面与 FastAPI 后端服务集成，实现完整的留言管理系统。

## 集成架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端页面   │────▶│  FastAPI API │────▶│   MySQL DB  │
│  (HTML/CSS) │◀────│  (Python)   │◀────│  (Database) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 集成步骤

### 1. 后端部署

#### 1.1 准备环境

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows

# 安装依赖
pip install -r requirements.txt
```

#### 1.2 配置数据库

```bash
# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，设置数据库连接信息
vim .env
```

#### 1.3 初始化数据库

```bash
# 运行数据库初始化脚本
python init_db.py
```

#### 1.4 启动后端服务

```bash
# 开发模式
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 `http://localhost:8000` 启动。

### 2. 前端配置

#### 2.1 修改前端配置文件

编辑 `main-api.js` 文件，确保 API 地址正确：

```javascript
// 修改 API 基础地址
this.apiBaseUrl = 'http://localhost:8000/api/v1';
```

如果您的后端部署在不同地址，请相应修改。

#### 2.2 更新 HTML 文件

在 `index.html` 中，将脚本引用从 `main.js` 改为 `main-api.js`：

```html
<!-- 修改前 -->
<script src="main.js"></script>

<!-- 修改后 -->
<script src="main-api.js"></script>
```

### 3. 测试集成

#### 3.1 检查后端服务

访问以下 URL 确认后端正常运行：

- 健康检查: http://localhost:8000/health
- API 文档: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### 3.2 测试前端连接

打开前端页面，检查：

1. 统计数据是否正确显示
2. 留言列表是否加载
3. 搜索功能是否正常工作
4. 分页功能是否正常

## API 接口映射

| 前端功能 | API 端点 | 方法 |
|---------|---------|------|
| 获取统计信息 | `/messages/statistics/overview` | GET |
| 获取留言列表 | `/messages/` | GET |
| 创建留言 | `/messages/` | POST |
| 获取单条留言 | `/messages/{id}` | GET |
| 更新留言 | `/messages/{id}` | PUT |
| 删除留言 | `/messages/{id}` | DELETE |
| 标记已读 | `/messages/{id}/read` | PATCH |

## 数据格式

### 请求参数

获取留言列表支持以下参数：

```javascript
{
  query: "搜索关键词",        // 可选
  date_filter: "today",      // 可选: all, today, week, month
  page: 1,                   // 页码
  page_size: 10,             // 每页条数
  sort_field: "created_at",  // 排序字段
  sort_direction: "desc"     // 排序方向: asc, desc
}
```

### 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 具体数据
  }
}
```

### 留言数据结构

```json
{
  "id": 1,
  "email": "user@example.com",
  "message": "留言内容",
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00",
  "status": "read"  // 或 "unread"
}
```

## 错误处理

前端代码包含了完整的错误处理机制：

1. **网络错误**: 显示友好的错误提示
2. **API 错误**: 解析错误信息并显示
3. **数据验证错误**: 前端表单验证
4. **后备数据**: API 不可用时使用模拟数据

## 性能优化

### 1. 分页优化

- 后端分页减少数据传输量
- 前端虚拟滚动（大量数据时）
- 缓存机制避免重复请求

### 2. 搜索优化

- 防抖处理减少请求频率
- 后端全文索引支持
- 实时搜索响应

### 3. 数据缓存

```javascript
// 简单的缓存机制
class APICache {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, value, ttl = 60000) { // 默认1分钟
    this.cache.set(key, {
      value,
      expire: Date.now() + ttl
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expire) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

## 安全考虑

### 1. CORS 配置

后端已配置 CORS 支持，生产环境应限制具体域名：

```python
# 生产环境配置
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]
```

### 2. 输入验证

- 后端使用 Pydantic 进行数据验证
- 前端表单验证
- SQL 注入防护（使用 ORM）

### 3. 认证授权

当前版本为简化演示，未包含认证功能。生产环境建议添加：

- JWT 认证
- 用户权限管理
- API 访问频率限制

## 部署方案

### 1. 开发环境

```bash
# 同时启动前后端
# 后端
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端
# 使用 Python HTTP 服务器
cd .. && python -m http.server 8080
```

### 2. 生产环境

推荐使用 Docker 部署：

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: message_system
      MYSQL_USER: message_api
      MYSQL_PASSWORD: message_api_password
    volumes:
      - mysql_data:/var/lib/mysql

  fastapi:
    build: ./backend
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

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend:/usr/share/nginx/html
    depends_on:
      - fastapi

volumes:
  mysql_data:
```

## 故障排除

### 常见问题

1. **跨域错误 (CORS)**
   - 检查后端 CORS 配置
   - 确认 API 地址正确

2. **数据库连接失败**
   - 检查 MySQL 服务状态
   - 验证数据库配置
   - 检查防火墙设置

3. **数据不显示**
   - 检查浏览器控制台错误
   - 确认 API 响应格式
   - 检查网络连接

### 调试技巧

1. **浏览器开发者工具**
   - Network 面板查看 API 请求
   - Console 面板查看错误信息
   - Application 面板查看本地存储

2. **后端日志**
   ```bash
   # 查看 FastAPI 日志
   tail -f backend/app.log
   ```

3. **数据库查询**
   ```sql
   -- 检查数据是否存在
   USE message_system;
   SELECT COUNT(*) FROM messages;
   ```

## 扩展功能

### 1. 实时通知

使用 WebSocket 实现实时消息通知：

```python
# WebSocket 端点
@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # 发送实时更新
        await websocket.send_json({"type": "new_message", "count": unread_count})
```

### 2. 文件上传

支持留言附件上传：

```python
@app.post("/messages/{id}/attachments")
async def upload_attachment(id: int, file: UploadFile = File(...)):
    # 文件上传逻辑
    pass
```

### 3. 导出功能

支持数据导出：

```python
@app.get("/messages/export")
async def export_messages(format: str = "csv"):
    # 数据导出逻辑
    pass
```

## 总结

通过本指南，您应该能够成功集成前后端，实现完整的留言管理系统。系统具有以下特点：

- **现代化架构**: 前后端分离，易于维护
- **高性能**: 分页、缓存、优化查询
- **易扩展**: 模块化设计，方便添加新功能
- **安全可靠**: 输入验证、错误处理、CORS 配置

如需进一步帮助，请查阅完整的项目文档或提交 Issue。