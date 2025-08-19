from flask import Blueprint
from flask_graphql import GraphQLView
from .graphql_schema import schema
from .models import db

# 创建GraphQL蓝图
graphql_bp = Blueprint('graphql', __name__)

# 添加GraphQL视图
graphql_bp.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True,  # 启用GraphiQL调试界面
        get_context=lambda: {'session': db.session}
    )
)

# 添加GraphQL端点（仅用于生产环境，不启用GraphiQL）
graphql_bp.add_url_rule(
    '/graphql-api',
    view_func=GraphQLView.as_view(
        'graphql_api',
        schema=schema,
        graphiql=False,
        get_context=lambda: {'session': db.session}
    )
)