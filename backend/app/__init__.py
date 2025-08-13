from flask import Flask
from flask_cors import CORS
from .models import db
from .routes import api
import os


def create_app():
    app = Flask(__name__, static_folder='../static', static_url_path='/static')
    
    # 配置
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 'sqlite:///anki_langchain.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化扩展
    db.init_app(app)
    CORS(app)
    
    # 注册蓝图
    app.register_blueprint(api)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        return {'message': 'Anki LangChain API 服务器运行中'}
    
    return app


app = create_app()