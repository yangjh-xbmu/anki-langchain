"""数据库连接和会话管理"""

from .models import db
from flask import current_app


def get_db():
    """获取数据库会话
    
    Returns:
        SQLAlchemy session: 数据库会话对象
    """
    return db.session


def init_db():
    """初始化数据库"""
    with current_app.app_context():
        db.create_all()


def close_db():
    """关闭数据库连接"""
    db.session.close()