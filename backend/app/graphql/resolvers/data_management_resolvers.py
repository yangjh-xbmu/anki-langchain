from typing import Dict, Any, List, Optional
from app.auth.jwt_auth import jwt_required
from app.auth.permissions import check_permission
import logging

logger = logging.getLogger(__name__)


class DataManagementResolvers:
    """数据管理GraphQL解析器"""
    
    def resolve_users(
        self, info, page: int = 1, page_size: int = 20, 
        search: str = None, role_filter: str = None, 
        status_filter: str = None
    ) -> Dict[str, Any]:
        """获取用户列表"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_users')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.get_users(
                page, page_size, search, role_filter, status_filter
            )
        except Exception as e:
            logger.error(f"获取用户列表失败: {str(e)}")
            raise
    
    def resolve_user_by_id(
        self, info, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """根据ID获取用户详情"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_users')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.get_user_by_id(user_id)
        except Exception as e:
            logger.error(f"获取用户详情失败: {str(e)}")
            raise
    
    def resolve_update_user(
        self, info, user_id: str, user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """更新用户信息"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_users')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.update_user(user_id, user_data)
        except Exception as e:
            logger.error(f"更新用户失败: {str(e)}")
            raise
    
    def resolve_words(
        self, info, page: int = 1, page_size: int = 20, 
        search: str = None, deck_filter: str = None, 
        difficulty_filter: str = None
    ) -> Dict[str, Any]:
        """获取单词列表"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_words')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.get_words(
                page, page_size, search, deck_filter, difficulty_filter
            )
        except Exception as e:
            logger.error(f"获取单词列表失败: {str(e)}")
            raise
    
    def resolve_word_by_id(
        self, info, word_id: str
    ) -> Optional[Dict[str, Any]]:
        """根据ID获取单词详情"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_words')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.get_word_by_id(word_id)
        except Exception as e:
            logger.error(f"获取单词详情失败: {str(e)}")
            raise
    
    def resolve_create_word(
        self, info, word_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建新单词"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_words')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.create_word(word_data)
        except Exception as e:
            logger.error(f"创建单词失败: {str(e)}")
            raise
    
    def resolve_update_word(
        self, info, word_id: str, word_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """更新单词信息"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_words')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.update_word(word_id, word_data)
        except Exception as e:
            logger.error(f"更新单词失败: {str(e)}")
            raise
    
    def resolve_delete_word(self, info, word_id: str) -> bool:
        """删除单词"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'manage_words')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.delete_word(word_id)
        except Exception as e:
            logger.error(f"删除单词失败: {str(e)}")
            raise
    
    def resolve_decks(self, info) -> List[Dict[str, Any]]:
        """获取所有卡组"""
        try:
            jwt_required(info.context)
            check_permission(info.context, 'view_decks')
            
            from app.services.data_management_service import (
                DataManagementService
            )
            return DataManagementService.get_decks()
        except Exception as e:
            logger.error(f"获取卡组列表失败: {str(e)}")
            raise


# 创建解析器实例
data_management_resolvers = DataManagementResolvers()