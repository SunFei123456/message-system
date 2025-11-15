from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from schemas import (
    MessageCreate, MessageUpdate, MessageSearch, 
    MessageResponse, MessageListResponse, StatisticsResponse,
    ApiResponse, ErrorResponse
)
from services import MessageService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/messages", tags=["留言管理"])

def get_message_service(db: Session = Depends(get_db)) -> MessageService:
    return MessageService(db)

@router.post("/", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message: MessageCreate,
    service: MessageService = Depends(get_message_service)
):
    """创建新留言"""
    try:
        db_message = service.create_message(message)
        return ApiResponse(
            code=201,
            message="留言创建成功",
            data=db_message.to_dict()
        )
    except Exception as e:
        logger.error(f"创建留言API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建留言失败"
        )

@router.get("/{message_id}", response_model=ApiResponse)
async def get_message(
    message_id: int = Path(..., gt=0, description="留言ID"),
    service: MessageService = Depends(get_message_service)
):
    """获取单条留言详情"""
    try:
        message = service.get_message(message_id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="留言不存在"
            )
        
        return ApiResponse(
            code=200,
            message="获取成功",
            data=message.to_dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取留言API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取留言失败"
        )

@router.put("/{message_id}", response_model=ApiResponse)
async def update_message(
    message_id: int = Path(..., gt=0, description="留言ID"),
    message_update: MessageUpdate = Depends(),
    service: MessageService = Depends(get_message_service)
):
    """更新留言"""
    try:
        updated_message = service.update_message(message_id, message_update)
        if not updated_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="留言不存在"
            )
        
        return ApiResponse(
            code=200,
            message="更新成功",
            data=updated_message.to_dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新留言API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新留言失败"
        )

@router.delete("/{message_id}", response_model=ApiResponse)
async def delete_message(
    message_id: int = Path(..., gt=0, description="留言ID"),
    service: MessageService = Depends(get_message_service)
):
    """删除留言"""
    try:
        success = service.delete_message(message_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="留言不存在"
            )
        
        return ApiResponse(
            code=200,
            message="删除成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除留言API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除留言失败"
        )

@router.get("/", response_model=ApiResponse)
async def search_messages(
    query: Optional[str] = Query(None, description="搜索关键词"),
    date_filter: Optional[str] = Query(None, regex="^(all|today|week|month)$", description="时间筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    sort_field: Optional[str] = Query(None, regex="^(id|email|created_at)$", description="排序字段"),
    sort_direction: Optional[str] = Query(None, regex="^(asc|desc)$", description="排序方向"),
    service: MessageService = Depends(get_message_service)
):
    """搜索和筛选留言列表"""
    try:
        search_params = MessageSearch(
            query=query,
            date_filter=date_filter,
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_direction=sort_direction
        )
        
        messages, total = service.search_messages(search_params)
        total_pages = (total + page_size - 1) // page_size
        
        return ApiResponse(
            code=200,
            message="获取成功",
            data={
                "items": [msg.to_dict() for msg in messages],
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }
        )
    except Exception as e:
        logger.error(f"搜索留言API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="搜索留言失败"
        )

@router.get("/statistics/overview", response_model=ApiResponse)
async def get_statistics(
    service: MessageService = Depends(get_message_service)
):
    """获取统计信息"""
    try:
        stats = service.get_statistics()
        return ApiResponse(
            code=200,
            message="获取成功",
            data=stats
        )
    except Exception as e:
        logger.error(f"获取统计API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取统计信息失败"
        )

@router.patch("/{message_id}/read", response_model=ApiResponse)
async def mark_as_read(
    message_id: int = Path(..., gt=0, description="留言ID"),
    service: MessageService = Depends(get_message_service)
):
    """标记留言为已读"""
    try:
        success = service.mark_as_read(message_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="留言不存在"
            )
        
        return ApiResponse(
            code=200,
            message="标记成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"标记已读API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="标记失败"
        )

@router.post("/bulk-delete", response_model=ApiResponse)
async def bulk_delete_messages(
    message_ids: List[int] = Depends(),
    service: MessageService = Depends(get_message_service)
):
    """批量删除留言"""
    try:
        deleted_count = service.bulk_delete(message_ids)
        return ApiResponse(
            code=200,
            message=f"成功删除 {deleted_count} 条留言",
            data={"deleted_count": deleted_count}
        )
    except Exception as e:
        logger.error(f"批量删除API错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="批量删除失败"
        )