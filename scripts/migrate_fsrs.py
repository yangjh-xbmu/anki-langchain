"""
FSRS算法数据库迁移脚本
用于创建word_memories表和索引
"""

import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from backend.app import create_app
from backend.app.models import db, Word, WordMemory
from sqlalchemy import text


def migrate_fsrs():
    """执行FSRS相关的数据库迁移"""
    
    print("开始执行FSRS算法数据库迁移...")
    
    app = create_app()
    
    with app.app_context():
        try:
            print("1. 创建WordMemory表...")
            # 创建所有表
            db.create_all()
            
            # 检查表是否创建成功
            result = db.session.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='word_memory'"
            )).fetchone()
            
            if not result:
                raise Exception("WordMemory表创建失败")
            
            print("   ✓ WordMemory表创建成功")
            
            print("2. 创建数据库索引...")
            # 创建索引
            db.session.execute(text(
                'CREATE INDEX IF NOT EXISTS idx_word_memory_next_review '
                'ON word_memory (next_review)'
            ))
            print("   ✓ next_review索引创建成功")
            
            db.session.execute(text(
                'CREATE UNIQUE INDEX IF NOT EXISTS idx_word_memory_word_id '
                'ON word_memory (word_id)'
            ))
            print("   ✓ word_id唯一索引创建成功")
            
            db.session.execute(text(
                'CREATE INDEX IF NOT EXISTS idx_word_memory_last_review '
                'ON word_memory (last_review)'
            ))
            print("   ✓ last_review索引创建成功")
            
            db.session.commit()
            
            # 初始化现有单词的记忆记录
            print("3. 初始化现有单词的记忆记录...")
            words = Word.query.all()
            initialized_count = 0
            
            for word in words:
                # 检查是否已存在记忆记录
                existing_memory = WordMemory.query.filter_by(word_id=word.id).first()
                if not existing_memory:
                    memory = WordMemory(
                        word_id=word.id,
                        stability=0.0,
                        difficulty=0.0,
                        next_review=datetime.utcnow()  # 新单词立即可复习
                    )
                    db.session.add(memory)
                    initialized_count += 1
            
            db.session.commit()
            print(f"   ✓ 已为 {initialized_count} 个单词初始化记忆记录")
            
            # 验证迁移结果
            print("4. 验证迁移结果...")
            memory_count = WordMemory.query.count()
            word_count = Word.query.count()
            print(f"   ✓ 总单词数: {word_count}")
            print(f"   ✓ 记忆记录数: {memory_count}")
            
            print("\n🎉 FSRS数据库迁移完成！")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ 迁移失败: {e}")
            raise e


def rollback_fsrs():
    """回滚FSRS迁移（谨慎使用）"""
    
    print("开始回滚FSRS迁移...")
    
    app = create_app()
    
    with app.app_context():
        try:
            # 删除WordMemory表
            print("1. 删除WordMemory表...")
            
            # 删除索引
            with db.engine.connect() as conn:
                try:
                    conn.execute(text("DROP INDEX IF EXISTS idx_word_memory_next_review"))
                    print("   ✓ 删除next_review索引")
                except Exception as e:
                    print(f"   ⚠ 删除next_review索引失败: {e}")
                
                try:
                    conn.execute(text("DROP INDEX IF EXISTS idx_word_memory_word_id"))
                    print("   ✓ 删除word_id索引")
                except Exception as e:
                    print(f"   ⚠ 删除word_id索引失败: {e}")
                
                try:
                    conn.execute(text("DROP INDEX IF EXISTS idx_word_memory_last_review"))
                    print("   ✓ 删除last_review索引")
                except Exception as e:
                    print(f"   ⚠ 删除last_review索引失败: {e}")
            
            # 删除表
            try:
                db.metadata.tables['word_memory'].drop(db.engine)
                print("   ✓ WordMemory表删除成功")
            except Exception as e:
                print(f"   ⚠ 删除WordMemory表失败: {e}")
            
            print("\n🔄 FSRS迁移回滚完成")
            
        except Exception as e:
            print(f"❌ 回滚失败: {e}")
            raise e


def check_migration():
    """检查迁移状态"""
    
    print("检查FSRS迁移状态...")
    
    app = create_app()
    
    with app.app_context():
        try:
            # 检查表是否存在
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'word_memory' in tables:
                print("   ✓ WordMemory表存在")
                
                # 检查记录数
                memory_count = WordMemory.query.count()
                word_count = Word.query.count()
                
                print(f"   ✓ 总单词数: {word_count}")
                print(f"   ✓ 记忆记录数: {memory_count}")
                
                # 检查索引
                indexes = inspector.get_indexes('word_memory')
                index_names = [idx['name'] for idx in indexes]
                
                print("   ✓ 索引:", index_names)
                
            else:
                print("   ❌ WordMemory表不存在")
                
        except Exception as e:
            print(f"❌ 检查失败: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='FSRS数据库迁移工具')
    parser.add_argument(
        'action', choices=['migrate', 'rollback', 'check'],
        help='执行操作: migrate(迁移), rollback(回滚), check(检查)'
    )
    
    args = parser.parse_args()
    
    if args.action == 'migrate':
        migrate_fsrs()
    elif args.action == 'rollback':
        confirm = input("⚠️  此操作将删除所有FSRS数据，确定继续？(y/N): ")
        if confirm.lower() == 'y':
            rollback_fsrs()
        else:
            print("操作已取消")
    elif args.action == 'check':
        check_migration()