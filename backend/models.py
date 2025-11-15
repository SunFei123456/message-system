from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Index
from sqlalchemy.sql import func
from database import Base

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    status = Column(Enum('read', 'unread', name='message_status'), default='unread', index=True)
    
    # 创建复合索引优化查询
    __table_args__ = (
        Index('idx_email_created', 'email', 'created_at'),
        Index('idx_status_created', 'status', 'created_at'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status': self.status
        }