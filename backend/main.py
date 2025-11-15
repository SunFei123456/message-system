from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn

from config import settings
from database import engine, Base, test_connection
from api import router as message_router
from schemas import ErrorResponse

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    logger.info("正在启动留言管理系统...")
    
    # 测试数据库连接
    if test_connection():
        logger.info("数据库连接成功")
    else:
        logger.error("数据库连接失败，请检查配置")
    
    # 创建数据库表
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"数据库表创建失败: {e}")
    
    yield
    
    # 关闭时执行
    logger.info("正在关闭留言管理系统...")

# 创建FastAPI应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="现代化的留言管理系统后端API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"全局异常: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            code=500,
            message="服务器内部错误",
            detail=str(exc)
        ).dict()
    )

# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "系统运行正常"}

# 根路径
@app.get("/")
async def root():
    return {
        "message": "欢迎使用留言管理系统API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# 注册路由
app.include_router(message_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )