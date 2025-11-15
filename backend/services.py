from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from models import Message
from schemas import MessageCreate, MessageUpdate, MessageSearch
import logging

logger = logging.getLogger(__name__)

class MessageService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_message(self, message_create: MessageCreate) -> Message:
        """创建新留言"""
        try:
            db_message = Message(
                email=message_create.email,
                message=message_create.message
            )
            self.db.add(db_message)
            self.db.commit()
            self.db.refresh(db_message)
            logger.info(f"创建新留言: ID={db_message.id}, Email={db_message.email}")
            return db_message
        except Exception as e:
            self.db.rollback()
            logger.error(f"创建留言失败: {e}")
            raise
    
    def get_message(self, message_id: int) -> Optional[Message]:
        """获取单条留言"""
        return self.db.query(Message).filter(Message.id == message_id).first()
    
    def update_message(self, message_id: int, message_update: MessageUpdate) -> Optional[Message]:
        """更新留言"""
        try:
            db_message = self.get_message(message_id)
            if not db_message:
                return None
            
            update_data = message_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_message, field, value)
            
            self.db.commit()
            self.db.refresh(db_message)
            logger.info(f"更新留言: ID={message_id}")
            return db_message
        except Exception as e:
            self.db.rollback()
            logger.error(f"更新留言失败: {e}")
            raise
    
    def delete_message(self, message_id: int) -> bool:
        """删除留言"""
        try:
            db_message = self.get_message(message_id)
            if not db_message:
                return False
            
            self.db.delete(db_message)
            self.db.commit()
            logger.info(f"删除留言: ID={message_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"删除留言失败: {e}")
            raise
    
    def search_messages(self, search_params: MessageSearch) -> Tuple[List[Message], int]:
        """搜索和筛选留言"""
        query = self.db.query(Message)
        
        # 关键词搜索
        if search_params.query:
            query = query.filter(
                or_(
                    Message.email.contains(search_params.query),
                    Message.message.contains(search_params.query)
                )
            )
        
        # 时间筛选
        if search_params.date_filter and search_params.date_filter != 'all':
            now = datetime.now()
            if search_params.date_filter == 'today':
                start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
                query = query.filter(Message.created_at >= start_of_day)
            elif search_params.date_filter == 'week':
                week_ago = now - timedelta(days=7)
                query = query.filter(Message.created_at >= week_ago)
            elif search_params.date_filter == 'month':
                month_ago = now - timedelta(days=30)
                query = query.filter(Message.created_at >= month_ago)
        
        # 排序
        sort_field = search_params.sort_field or 'created_at'
        sort_direction = search_params.sort_direction or 'desc'
        
        if sort_direction == 'asc':
            query = query.order_by(getattr(Message, sort_field).asc())
        else:
            query = query.order_by(getattr(Message, sort_field).desc())
        
        # 分页
        total = query.count()
        offset = (search_params.page - 1) * search_params.page_size
        messages = query.offset(offset).limit(search_params.page_size).all()
        
        return messages, total
    
    def get_statistics(self) -> dict:
        """获取统计信息"""
        try:
            now = datetime.now()
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = now - timedelta(days=7)
            
            # 总留言数
            total_messages = self.db.query(func.count(Message.id)).scalar()
            
            # 今日新增
            today_messages = self.db.query(func.count(Message.id)).filter(
                Message.created_at >= start_of_day
            ).scalar()
            
            # 本周新增
            week_messages = self.db.query(func.count(Message.id)).filter(
                Message.created_at >= week_ago
            ).scalar()
            
            # 总用户数（邮箱去重）
            total_users = self.db.query(func.count(func.distinct(Message.email))).scalar()
            
            return {
                'total_messages': total_messages or 0,
                'today_messages': today_messages or 0,
                'week_messages': week_messages or 0,
                'total_users': total_users or 0
            }
        except Exception as e:
            logger.error(f"获取统计数据失败: {e}")
            raise
    
    def mark_as_read(self, message_id: int) -> bool:
        """标记留言为已读"""
        try:
            db_message = self.get_message(message_id)
            if not db_message:
                return False
            
            db_message.status = 'read'
            self.db.commit()
            logger.info(f"标记留言为已读: ID={message_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"标记留言状态失败: {e}")
            raise
    
    def bulk_delete(self, message_ids: List[int]) -> int:
        """批量删除留言"""
        try:
            deleted_count = self.db.query(Message).filter(
                Message.id.in_(message_ids)
            ).delete(synchronize_session=False)
            
            self.db.commit()
            logger.info(f"批量删除留言: 数量={deleted_count}")
            return deleted_count
        except Exception as e:
            self.db.rollback()
            logger.error(f"批量删除留言失败: {e}")
            raise