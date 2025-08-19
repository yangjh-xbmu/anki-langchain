from datetime import datetime
import json
from sqlalchemy.exc import SQLAlchemyError
from ..database import get_db
from ..models import SystemConfig
from ..exceptions import ConfigurationError, DatabaseError


class SystemConfigService:
    """系统配置服务类"""
    
    def __init__(self):
        self.db = get_db()
    
    def get_all_configs(self, include_readonly=True, include_private=False):
        """获取所有系统配置"""
        try:
            query = self.db.query(SystemConfig)
            
            if not include_readonly:
                query = query.filter(SystemConfig.is_readonly.is_(False))
            
            if not include_private:
                query = query.filter(SystemConfig.is_public.is_(True))
            
            configs = query.all()
            
            return [{
                'id': config.id,
                'key': config.key,
                'value': config.value,
                'typed_value': self._parse_typed_value(config),
                'description': config.description,
                'config_type': config.config_type,
                'is_public': config.is_public,
                'is_readonly': config.is_readonly,
                'validation_rule': config.validation_rule,
                'created_at': (
                    config.created_at.isoformat()
                    if config.created_at else None
                ),
                'updated_at': (
                    config.updated_at.isoformat()
                    if config.updated_at else None
                )
            } for config in configs]
            
        except Exception as e:
            print(f"Error getting all configs: {e}")
            return []
    
    def get_config_by_key(self, key):
        """根据key获取配置"""
        try:
            config = self.db.query(SystemConfig).filter_by(key=key).first()
            
            if not config:
                return None
            
            return {
                'id': config.id,
                'key': config.key,
                'value': config.value,
                'typed_value': self._parse_typed_value(config),
                'description': config.description,
                'config_type': config.config_type,
                'is_public': config.is_public,
                'is_readonly': config.is_readonly,
                'validation_rule': config.validation_rule,
                'created_at': (
                    config.created_at.isoformat()
                    if config.created_at else None
                ),
                'updated_at': (
                    config.updated_at.isoformat()
                    if config.updated_at else None
                )
            }
            
        except Exception as e:
            print(f"Error getting config by key {key}: {e}")
            return None
    
    def create_or_update_config(self, key, value, description=None,
                                config_type='string', is_public=False,
                                is_readonly=False, validation_rule=None):
        """创建或更新配置"""
        try:
            # 验证值
            if not self._validate_config_value(
                value, config_type, validation_rule
            ):
                return None
            
            config = self.db.query(SystemConfig).filter_by(key=key).first()
            
            if config:
                # 检查是否为只读配置
                if config.is_readonly:
                    print(f"Cannot update readonly config: {key}")
                    return None
                
                # 更新现有配置
                config.value = value
                if description is not None:
                    config.description = description
                config.config_type = config_type
                config.is_public = is_public
                config.is_readonly = is_readonly
                if validation_rule is not None:
                    config.validation_rule = validation_rule
                config.updated_at = datetime.utcnow()
            else:
                # 创建新配置
                config = SystemConfig(
                    key=key,
                    value=value,
                    description=description,
                    config_type=config_type,
                    is_public=is_public,
                    is_readonly=is_readonly,
                    validation_rule=validation_rule,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                self.db.add(config)
            
            self.db.commit()
            return self.get_config_by_key(key)
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Database error: {str(e)}")
        except Exception as e:
            self.db.rollback()
            raise ConfigurationError(
                f"Failed to create/update config: {str(e)}"
            )
    
    def delete_config(self, key):
        """删除配置"""
        try:
            config = self.db.query(SystemConfig).filter_by(key=key).first()
            
            if not config:
                return False
            
            # 检查是否为只读配置
            if config.is_readonly:
                print(
                    f"Cannot delete readonly config: {key}"
                )
                return False
            
            self.db.delete(config)
            self.db.commit()
            return True
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Database error: {str(e)}")
        except Exception as e:
            self.db.rollback()
            raise ConfigurationError(
                f"Failed to delete config: {str(e)}"
            )
    
    def get_public_configs(self):
        """获取所有公开配置"""
        return self.get_all_configs(include_readonly=True, include_private=False)
    
    def get_config_categories(self):
        """获取配置分类统计"""
        try:
            configs = self.db.query(SystemConfig).all()
            
            categories = {}
            for config in configs:
                category = config.config_type or 'unknown'
                if category not in categories:
                    categories[category] = {
                        'count': 0,
                        'public_count': 0,
                        'readonly_count': 0
                    }
                
                categories[category]['count'] += 1
                if config.is_public:
                    categories[category]['public_count'] += 1
                if config.is_readonly:
                    categories[category]['readonly_count'] += 1
            
            return categories
            
        except Exception as e:
            print(f"Error getting config categories: {e}")
            return {}
    
    def _parse_typed_value(self, config):
        """解析配置值为对应类型"""
        try:
            if config.config_type == 'json':
                return json.loads(config.value)
            elif config.config_type == 'boolean':
                return config.value.lower() in ('true', '1', 'yes', 'on')
            elif config.config_type == 'integer':
                return int(config.value)
            elif config.config_type == 'float':
                return float(config.value)
            else:
                return config.value
        except (ValueError, json.JSONDecodeError):
            return config.value
    
    def _validate_config_value(self, value, config_type, validation_rule):
        """验证配置值"""
        try:
            # 基本类型验证
            if config_type == 'integer':
                int(value)
            elif config_type == 'float':
                float(value)
            elif config_type == 'boolean':
                allowed_values = (
                    'true', 'false', '1', '0', 'yes', 'no', 'on', 'off'
                )
                if value.lower() not in allowed_values:
                    return False
            elif config_type == 'json':
                json.loads(value)
            
            # 自定义验证规则
            if validation_rule:
                # 这里可以实现更复杂的验证逻辑
                # 例如正则表达式验证、范围验证等
                pass
            
            return True
            
        except (ValueError, json.JSONDecodeError):
            return False