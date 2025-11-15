from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MessageStatus(str, Enum):
    READ = "read"
    UNREAD = "unread"

# 请求模式
class MessageCreate(BaseModel):
    email: EmailStr = Field(..., description="用户邮箱地址")
    message: str = Field(..., min_length=1, max_length=2000, description="留言内容")
    
    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v):
        if not v.strip():
            raise ValueError('留言内容不能为空')
        return v.strip()

class MessageUpdate(BaseModel):
    email: Optional[EmailStr] = None
    message: Optional[str] = Field(None, min_length=1, max_length=2000)
    status: Optional[MessageStatus] = None
    
    @field_validator('message')
    @classmethod
    def message_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('留言内容不能为空')
        return v.strip() if v else v

class MessageSearch(BaseModel):
    query: Optional[str] = Field(None, description="搜索关键词")
    date_filter: Optional[str] = Field(None, pattern="^(all|today|week|month)$", description="时间筛选")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页条数")
    sort_field: Optional[str] = Field(None, pattern="^(id|email|created_at)$", description="排序字段")
    sort_direction: Optional[str] = Field(None, pattern="^(asc|desc)$", description="排序方向")

# 响应模式
class MessageResponse(BaseModel):
    id: int
    email: str
    message: str
    created_at: datetime
    updated_at: datetime
    status: MessageStatus
    
    class Config:
        from_attributes = True

class MessageListResponse(BaseModel):
    items: List[MessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class StatisticsResponse(BaseModel):
    total_messages: int
    today_messages: int
    week_messages: int
    total_users: int

# 通用响应
class ApiResponse(BaseModel):
    code: int = Field(200, description="响应码")
    message: str = Field("success", description="响应消息")
    data: Optional[dict] = None

class ErrorResponse(BaseModel):
    code: int = Field(400, description="错误码")
    message: str = Field("error", description="错误消息")
    detail: Optional[str] = None