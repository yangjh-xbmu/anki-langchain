"""数据验证器模块"""

import re
import json
from typing import Any, Dict, List, Optional
from .exceptions import ValidationError


class BaseValidator:
    """基础验证器类"""
    
    def __init__(self, required=True, allow_none=False):
        self.required = required
        self.allow_none = allow_none
    
    def validate(self, value: Any, field_name: str = None) -> Any:
        """验证值"""
        if value is None:
            if self.allow_none:
                return None
            if self.required:
                raise ValidationError(
                    f"Field '{field_name or 'value'}' is required",
                    field=field_name,
                    value=value
                )
            return None
        
        return self._validate_value(value, field_name)
    
    def _validate_value(self, value: Any, field_name: str = None) -> Any:
        """子类需要实现的验证逻辑"""
        return value


class StringValidator(BaseValidator):
    """字符串验证器"""
    
    def __init__(self, min_length=None, max_length=None, pattern=None,
                 **kwargs):
        super().__init__(**kwargs)
        self.min_length = min_length
        self.max_length = max_length
        self.pattern = re.compile(pattern) if pattern else None
    
    def _validate_value(self, value: Any, field_name: str = None) -> str:
        if not isinstance(value, str):
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be a string",
                field=field_name,
                value=value
            )
        
        if self.min_length is not None and len(value) < self.min_length:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at least "
                f"{self.min_length} characters long",
                field=field_name,
                value=value
            )
        
        if self.max_length is not None and len(value) > self.max_length:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at most "
                f"{self.max_length} characters long",
                field=field_name,
                value=value
            )
        
        if self.pattern and not self.pattern.match(value):
            raise ValidationError(
                f"Field '{field_name or 'value'}' does not match "
                f"required pattern",
                field=field_name,
                value=value
            )
        
        return value


class IntegerValidator(BaseValidator):
    """整数验证器"""
    
    def __init__(self, min_value=None, max_value=None, **kwargs):
        super().__init__(**kwargs)
        self.min_value = min_value
        self.max_value = max_value
    
    def _validate_value(self, value: Any, field_name: str = None) -> int:
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be an integer",
                field=field_name,
                value=value
            )
        
        if self.min_value is not None and int_value < self.min_value:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at least "
                f"{self.min_value}",
                field=field_name,
                value=value
            )
        
        if self.max_value is not None and int_value > self.max_value:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at most "
                f"{self.max_value}",
                field=field_name,
                value=value
            )
        
        return int_value


class FloatValidator(BaseValidator):
    """浮点数验证器"""
    
    def __init__(self, min_value=None, max_value=None, **kwargs):
        super().__init__(**kwargs)
        self.min_value = min_value
        self.max_value = max_value
    
    def _validate_value(self, value: Any, field_name: str = None) -> float:
        try:
            float_value = float(value)
        except (ValueError, TypeError):
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be a number",
                field=field_name,
                value=value
            )
        
        if self.min_value is not None and float_value < self.min_value:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at least "
                f"{self.min_value}",
                field=field_name,
                value=value
            )
        
        if self.max_value is not None and float_value > self.max_value:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be at most "
                f"{self.max_value}",
                field=field_name,
                value=value
            )
        
        return float_value


class BooleanValidator(BaseValidator):
    """布尔值验证器"""
    
    TRUTHY_VALUES = {'true', '1', 'yes', 'on', 'y', 't'}
    FALSY_VALUES = {'false', '0', 'no', 'off', 'n', 'f'}
    
    def _validate_value(self, value: Any, field_name: str = None) -> bool:
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            lower_value = value.lower().strip()
            if lower_value in self.TRUTHY_VALUES:
                return True
            elif lower_value in self.FALSY_VALUES:
                return False
        
        raise ValidationError(
            f"Field '{field_name or 'value'}' must be a boolean value",
            field=field_name,
            value=value
        )


class JSONValidator(BaseValidator):
    """JSON验证器"""
    
    def _validate_value(self, value: Any, field_name: str = None) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError as e:
                raise ValidationError(
                    f"Field '{field_name or 'value'}' must be valid JSON: "
                    f"{str(e)}",
                    field=field_name,
                    value=value
                )
        
        # 如果已经是Python对象，直接返回
        return value


class ChoiceValidator(BaseValidator):
    """选择值验证器"""
    
    def __init__(self, choices: List[Any], **kwargs):
        super().__init__(**kwargs)
        self.choices = choices
    
    def _validate_value(self, value: Any, field_name: str = None) -> Any:
        if value not in self.choices:
            raise ValidationError(
                f"Field '{field_name or 'value'}' must be one of: "
                f"{', '.join(map(str, self.choices))}",
                field=field_name,
                value=value
            )
        
        return value


class ConfigValidator:
    """系统配置验证器"""
    
    TYPE_VALIDATORS = {
        'string': StringValidator,
        'integer': IntegerValidator,
        'float': FloatValidator,
        'boolean': BooleanValidator,
        'json': JSONValidator,
    }
    
    @classmethod
    def validate_config_value(cls, value: Any, config_type: str,
                              validation_rule: Optional[Dict] = None,
                              field_name: str = 'value') -> Any:
        """验证配置值"""
        if config_type not in cls.TYPE_VALIDATORS:
            raise ValidationError(
                f"Unsupported config type: {config_type}",
                field='config_type',
                value=config_type
            )
        
        validator_class = cls.TYPE_VALIDATORS[config_type]
        validator_kwargs = validation_rule or {}
        
        # 处理特殊的验证规则
        if config_type == 'string' and 'choices' in validator_kwargs:
            choices = validator_kwargs.pop('choices')
            validator = ChoiceValidator(choices=choices, **validator_kwargs)
        else:
            validator = validator_class(**validator_kwargs)
        
        return validator.validate(value, field_name)
    
    @classmethod
    def validate_config_key(cls, key: str) -> str:
        """验证配置键名"""
        validator = StringValidator(
            min_length=1,
            max_length=100,
            pattern=r'^[a-zA-Z][a-zA-Z0-9_]*$'
        )
        return validator.validate(key, 'key')