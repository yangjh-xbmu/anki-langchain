"""自定义异常类"""


class BaseServiceException(Exception):
    """服务基础异常类"""
    def __init__(self, message, error_code=None, details=None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(BaseServiceException):
    """数据验证异常"""
    def __init__(self, message, field=None, value=None, **kwargs):
        super().__init__(message, error_code='VALIDATION_ERROR', **kwargs)
        self.field = field
        self.value = value


class ConfigurationError(BaseServiceException):
    """配置相关异常"""
    def __init__(self, message, config_key=None, **kwargs):
        super().__init__(message, error_code='CONFIG_ERROR', **kwargs)
        self.config_key = config_key


class ReadOnlyError(BaseServiceException):
    """只读资源修改异常"""
    def __init__(self, message, resource_type=None, resource_id=None,
                 **kwargs):
        super().__init__(message, error_code='READONLY_ERROR', **kwargs)
        self.resource_type = resource_type
        self.resource_id = resource_id


class NotFoundError(BaseServiceException):
    """资源未找到异常"""
    def __init__(self, message, resource_type=None, resource_id=None,
                 **kwargs):
        super().__init__(message, error_code='NOT_FOUND', **kwargs)
        self.resource_type = resource_type
        self.resource_id = resource_id


class DatabaseError(BaseServiceException):
    """数据库操作异常"""
    def __init__(self, message, operation=None, **kwargs):
        super().__init__(message, error_code='DATABASE_ERROR', **kwargs)
        self.operation = operation


class AuthenticationError(BaseServiceException):
    """认证异常"""
    def __init__(self, message, **kwargs):
        super().__init__(message, error_code='AUTH_ERROR', **kwargs)


class AuthorizationError(BaseServiceException):
    """授权异常"""
    def __init__(self, message, required_permission=None, **kwargs):
        super().__init__(message, error_code='AUTHORIZATION_ERROR', **kwargs)
        self.required_permission = required_permission