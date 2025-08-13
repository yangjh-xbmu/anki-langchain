from flask import Blueprint, jsonify, request

from .anki_service import AnkiConnectService
from .langchain_service import LangChainService
from .models import (
    Word, PracticeSession, UserLearningProfile,
    LearningSession, db
)
from .recommendation_engine import RecommendationEngine
from .analytics_engine import LearningAnalytics
from datetime import datetime
import random

api = Blueprint('api', __name__, url_prefix='/api')


@api.route('/words', methods=['GET'])
def get_words():
    """获取单词列表"""
    try:
        words = Word.query.all()
        return jsonify([word.to_dict() for word in words])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 推荐系统API接口
@api.route('/recommendation/daily-goal', methods=['GET'])
def get_daily_recommendation():
    """获取每日练习推荐"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        # 获取或创建用户学习画像
        profile = UserLearningProfile.query.filter_by(
            user_id=user_id
        ).first()
        
        if not profile:
            # 创建默认用户画像
            profile = UserLearningProfile(
                user_id=user_id,
                learning_style='balanced',
                difficulty_preference='medium',
                daily_goal=20,
                motivation_level=0.7,
                attention_span=25,
                peak_performance_time='morning'
            )
            db.session.add(profile)
            db.session.commit()
        
        # 使用推荐引擎生成推荐
        engine = RecommendationEngine()
        recommendation = engine.generate_daily_recommendation(
            user_id, profile
        )
        
        return jsonify(recommendation)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/recommendation/update-profile', methods=['POST'])
def update_user_profile():
    """更新用户学习画像"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        profile = UserLearningProfile.query.filter_by(
            user_id=user_id
        ).first()
        
        if not profile:
            profile = UserLearningProfile(user_id=user_id)
            db.session.add(profile)
        
        # 更新画像数据
        if 'learning_style' in data:
            profile.learning_style = data['learning_style']
        if 'difficulty_preference' in data:
            profile.difficulty_preference = data['difficulty_preference']
        if 'daily_goal' in data:
            profile.daily_goal = data['daily_goal']
        if 'motivation_level' in data:
            profile.motivation_level = data['motivation_level']
        if 'attention_span' in data:
            profile.attention_span = data['attention_span']
        if 'peak_performance_time' in data:
            profile.peak_performance_time = data['peak_performance_time']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/recommendation/session', methods=['POST'])
def record_learning_session():
    """记录学习会话"""
    try:
        data = request.get_json()
        
        session = LearningSession(
            user_id=data.get('user_id', 'default_user'),
            session_type=data.get('session_type', 'practice'),
            words_practiced=data.get('words_practiced', 0),
            correct_answers=data.get('correct_answers', 0),
            session_duration=data.get('session_duration', 0),
            difficulty_level=data.get('difficulty_level', 'medium'),
            engagement_score=data.get('engagement_score', 0.5),
            fatigue_level=data.get('fatigue_level', 0.3)
        )
        
        db.session.add(session)
        db.session.commit()
        
        # 更新用户画像
        engine = RecommendationEngine()
        engine.update_user_profile_from_session(
            data.get('user_id', 'default_user'), session
        )
        
        return jsonify({
            'message': 'Session recorded successfully',
            'session_id': session.id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/recommendation/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    """获取用户学习画像"""
    try:
        profile = UserLearningProfile.query.filter_by(
            user_id=user_id
        ).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        return jsonify(profile.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/sync-anki', methods=['POST'])
def sync_anki():
    """从Anki同步单词"""
    try:
        anki_service = AnkiConnectService()
        langchain_service = LangChainService()
        words_data = anki_service.get_learning_cards()

        print(f"\n=== 开始同步Anki单词，共获取到 {len(words_data)} 个单词 ===")

        synced_count = 0
        for i, word_data in enumerate(words_data, 1):
            print(f"\n--- 处理第 {i} 个单词 ---")
            print(f"Anki卡片ID: {word_data['id']}")
            print(f"单词: {word_data['word']}")
            print(f"含义: {word_data.get('meaning', 'N/A')}")
            print(f"牌组: {word_data.get('deck', 'N/A')}")
            print(f"图片信息: {word_data.get('image_info', 'N/A')}")
            print(f"音频信息: {word_data.get('audio_info', 'N/A')}")

            # 检查是否已存在
            existing_word = Word.query.filter_by(
                anki_card_id=word_data['id']
            ).first()

            if existing_word:
                print(f"单词已存在，跳过: {word_data['word']}")
                continue

            print("新单词，开始处理媒体文件...")

            # 处理图片和音频
            image_info = word_data.get('image_info')
            audio_info = word_data.get('audio_info')

            print("生成图片URL...")
            image_url = langchain_service.generate_image(
                word_data['word'], image_info
            )
            print(f"图片URL: {image_url}")

            print("处理音频URL...")
            audio_url = langchain_service.process_audio_url(
                word_data['word'], audio_info
            )
            print(f"音频URL: {audio_url}")

            word = Word(
                anki_card_id=word_data['id'],
                word=word_data['word'],
                meaning=word_data.get('meaning'),
                deck_name=word_data.get('deck'),
                image_url=image_url,
                audio_url=audio_url,
                phonetic=word_data.get('phonetic'),
                etymology=word_data.get('etymology'),
                exam_frequency=word_data.get('exam_frequency'),
                star_level=word_data.get('star_level'),
                example_sentence=word_data.get('example_sentence'),
                example_translation=word_data.get('example_translation'),
                related_words=word_data.get('related_words')
            )
            db.session.add(word)
            synced_count += 1
            print(f"单词 '{word_data['word']}' 已添加到数据库")

        db.session.commit()
        print(f"\n=== 同步完成，成功添加 {synced_count} 个新单词 ===")
        return jsonify({
            'message': f'成功同步 {synced_count} 个单词',
            'synced_count': synced_count
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/words/<int:word_id>/generate-media', methods=['POST'])
def generate_media(word_id):
    """为单词生成图片和音频"""
    try:
        word = Word.query.get_or_404(word_id)
        langchain_service = LangChainService()

        # 生成图片URL
        if not word.image_url:
            image_url = langchain_service.generate_image(word.word, None)
            word.image_url = image_url

        # 生成音频URL
        if not word.audio_url:
            audio_url = langchain_service.generate_audio(word.word)
            word.audio_url = audio_url

        db.session.commit()
        return jsonify(word.to_dict())

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/check-answer', methods=['POST'])
def check_answer():
    """检查用户答案"""
    try:
        data = request.get_json()
        word_id = data.get('word_id')
        user_answer = data.get('user_answer')

        if not word_id or not user_answer:
            return jsonify({'error': '缺少必要参数'}), 400

        word = Word.query.get_or_404(word_id)
        is_correct = user_answer.lower().strip() == word.word.lower()

        # 记录练习会话
        session = PracticeSession(
            word_id=word_id,
            user_input=user_answer,
            is_correct=is_correct
        )
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'is_correct': is_correct,
            'correct_word': word.word,
            'session_id': session.id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/practice', methods=['POST'])
def submit_practice():
    """提交练习结果"""
    try:
        data = request.get_json()
        word_id = data.get('word_id')
        user_input = data.get('user_input')

        if not word_id or not user_input:
            return jsonify({'error': '缺少必要参数'}), 400

        word = Word.query.get_or_404(word_id)
        is_correct = user_input.lower().strip() == word.word.lower()

        # 记录练习会话
        session = PracticeSession(
            word_id=word_id,
            user_input=user_input,
            is_correct=is_correct
        )
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'is_correct': is_correct,
            'correct_word': word.word,
            'session_id': session.id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/clear-database', methods=['POST'])
def clear_database():
    """清空数据库中的所有记录"""
    try:
        # 删除所有练习会话记录
        PracticeSession.query.delete()
        # 删除所有单词记录
        Word.query.delete()

        db.session.commit()
        return jsonify({'message': '数据库已清空'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/words/next', methods=['GET'])
def get_next_word():
    """获取下一个要复习的单词（FSRS算法）"""
    try:
        from app.fsrs_service import FSRSService
        
        fsrs_service = FSRSService()
        next_word = fsrs_service.get_next_word()
        
        if not next_word:
            return jsonify({'error': '没有可用的单词'}), 404
            
        # 确保返回完整的单词信息
        word_dict = next_word.to_dict()
        
        # 添加记忆状态信息（如果存在）
        if hasattr(next_word, 'memory') and next_word.memory:
            word_dict['memory'] = next_word.memory.to_dict()
        else:
            word_dict['memory'] = None
            
        return jsonify(word_dict)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/words/<int:word_id>/review', methods=['POST'])
def review_word(word_id):
    """记录单词复习结果（FSRS算法）"""
    try:
        from app.fsrs_service import FSRSService
        
        data = request.get_json()
        rating = data.get('rating')
        
        if not rating or rating not in [1, 2, 3, 4]:
            return jsonify({'error': '评分必须在1-4之间'}), 400
            
        fsrs_service = FSRSService()
        result = fsrs_service.review_word(word_id, rating)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/review-stats', methods=['GET'])
def get_review_stats():
    """获取复习统计信息"""
    try:
        from app.fsrs_service import FSRSService
        
        fsrs_service = FSRSService()
        stats = fsrs_service.get_review_stats()
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/words/due', methods=['GET'])
def get_due_words():
    """获取所有到期的单词"""
    try:
        from app.fsrs_service import FSRSService
        
        limit = request.args.get('limit', 50, type=int)
        
        fsrs_service = FSRSService()
        due_words = fsrs_service.get_due_words(limit)
        
        return jsonify([word.to_dict() for word in due_words])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/words/<int:word_id>/reset-memory', methods=['POST'])
def reset_word_memory(word_id):
    """重置单词记忆状态"""
    try:
        from app.fsrs_service import FSRSService
        
        fsrs_service = FSRSService()
        success = fsrs_service.reset_word_memory(word_id)
        
        if success:
            return jsonify({'success': True, 'message': '记忆状态已重置'})
        else:
            return jsonify({'success': False, 'message': '未找到记忆记录'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        return jsonify({
            'message': '数据库已清空',
            'success': True
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/stats', methods=['GET'])
def get_stats():
    """获取练习统计"""
    try:
        total_words = Word.query.count()
        total_sessions = PracticeSession.query.count()
        correct_sessions = PracticeSession.query.filter_by(
            is_correct=True
        ).count()

        accuracy = (correct_sessions / total_sessions * 100
                    if total_sessions > 0 else 0)

        return jsonify({
            'total_words': total_words,
            'total_sessions': total_sessions,
            'correct_sessions': correct_sessions,
            'accuracy': round(accuracy, 2)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 心理支持系统API
@api.route('/motivation/assessment', methods=['POST'])
def submit_motivation_assessment():
    """提交动机评估"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        # 获取评估数据
        motivation_level = data.get('motivation_level', 5)
        stress_level = data.get('stress_level', 3)
        confidence_level = data.get('confidence_level', 5)
        energy_level = data.get('energy_level', 5)
        focus_level = data.get('focus_level', 5)
        
        # 这里应该保存到数据库，目前返回模拟数据
        assessment_result = {
            'motivation_level': motivation_level,
            'stress_level': stress_level,
            'confidence_level': confidence_level,
            'energy_level': energy_level,
            'focus_level': focus_level,
            'assessment_time': datetime.now().isoformat(),
            'recommendations': generate_motivation_recommendations(
                motivation_level, stress_level, confidence_level
            )
        }
        
        return jsonify(assessment_result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/motivation/encouragement', methods=['GET'])
def get_encouragement_message():
    """获取鼓励消息"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        message_type = request.args.get('type', 'general')
        
        encouragement_messages = {
            'motivation': [
                {'message': '每一个单词都是通向成功的阶梯，继续加油！', 'icon': '🚀'},
                {'message': '学习的路上你并不孤单，坚持就是胜利！', 'icon': '🌟'},
                {'message': '今天的努力是明天成功的基石！', 'icon': '💎'}
            ],
            'achievement': [
                {'message': '你的坚持让人敬佩，今天又是进步的一天！', 'icon': '🏆'},
                {'message': '每一次练习都让你更加优秀！', 'icon': '🎯'},
                {'message': '你正在创造属于自己的学习奇迹！', 'icon': '✨'}
            ],
            'progress': [
                {'message': '学习如登山，每一步都让你更接近山顶！', 'icon': '⛰️'},
                {'message': '进步可能缓慢，但从未停止！', 'icon': '📈'},
                {'message': '你的努力正在悄悄改变着一切！', 'icon': '🌱'}
            ],
            'challenge': [
                {'message': '挑战让我们成长，你正在变得更强大！', 'icon': '💪'},
                {'message': '困难是成长路上的垫脚石！', 'icon': '🪨'},
                {'message': '每一次挑战都是新的机会！', 'icon': '🎪'}
            ]
        }
        
        messages = encouragement_messages.get(message_type, 
                                             encouragement_messages['motivation'])
        selected_message = random.choice(messages)
        
        return jsonify({
            'type': message_type,
            'message': selected_message['message'],
            'icon': selected_message['icon'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_motivation_recommendations(motivation, stress, confidence):
    """根据评估结果生成个性化建议"""
    recommendations = []
    
    if motivation < 5:
        recommendations.append({
            'type': 'motivation',
            'title': '提升学习动机',
            'suggestion': '设定小目标，每完成一个就奖励自己'
        })
    
    if stress > 6:
        recommendations.append({
            'type': 'stress',
            'title': '缓解学习压力',
            'suggestion': '适当休息，尝试深呼吸或短暂散步'
        })
    
    if confidence < 5:
        recommendations.append({
            'type': 'confidence',
            'title': '建立学习信心',
            'suggestion': '从简单的单词开始，逐步提升难度'
        })
    
    return recommendations


# 数据分析API端点
@api.route('/analytics/learning-patterns', methods=['GET'])
def get_learning_patterns():
    """获取学习模式分析"""
    try:
        analytics = LearningAnalytics()
        patterns = analytics.analyze_learning_patterns()
        return jsonify({
            'success': True,
            'patterns': patterns
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/analytics/personalized-recommendations', methods=['GET'])
def get_personalized_recommendations():
    """获取个性化学习建议"""
    try:
        analytics = LearningAnalytics()
        recommendations = analytics.generate_personalized_recommendations()
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/analytics/performance-insights', methods=['GET'])
def get_performance_insights():
    """获取学习表现洞察"""
    try:
        analytics = LearningAnalytics()
        insights = analytics.get_performance_insights()
        return jsonify({
            'success': True,
            'insights': insights
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# 用户偏好设置API端点
@api.route('/user/preferences', methods=['GET'])
def get_user_preferences():
    """获取用户偏好设置"""
    try:
        # 模拟用户偏好数据
        preferences = [
            {
                'id': 'daily_target',
                'category': '学习目标',
                'name': '每日学习目标',
                'value': 20,
                'type': 'range',
                'min': 5,
                'max': 100,
                'description': '每天计划学习的单词数量'
            },
            {
                'id': 'difficulty_level',
                'category': '学习设置',
                'name': '难度等级',
                'value': '中等',
                'type': 'select',
                'options': ['简单', '中等', '困难', '混合'],
                'description': '选择适合的学习难度'
            },
            {
                'id': 'auto_play_audio',
                'category': '媒体设置',
                'name': '自动播放音频',
                'value': True,
                'type': 'boolean',
                'description': '显示单词时自动播放发音'
            }
        ]
        
        return jsonify({
            'success': True,
            'preferences': preferences
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/user/preferences', methods=['PUT'])
def update_user_preference():
    """更新用户偏好设置"""
    try:
        data = request.get_json()
        preference_id = data.get('preference_id')
        # value = data.get('value')
        
        # 这里应该更新数据库中的用户偏好
        # 目前返回成功响应
        
        return jsonify({
            'success': True,
            'message': f'偏好设置 {preference_id} 已更新'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/user/learning-goals', methods=['GET'])
def get_learning_goals():
    """获取学习目标"""
    try:
        # 模拟学习目标数据
        goals = [
            {
                'id': 'goal1',
                'title': '本月掌握200个新单词',
                'target_value': 200,
                'current_value': 87,
                'unit': '个',
                'deadline': '2025-01-31',
                'priority': 'high',
                'status': 'active'
            },
            {
                'id': 'goal2',
                'title': '连续学习30天',
                'target_value': 30,
                'current_value': 12,
                'unit': '天',
                'deadline': '2025-02-15',
                'priority': 'medium',
                'status': 'active'
            }
        ]
        
        return jsonify({
            'success': True,
            'goals': goals
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/user/learning-goals', methods=['POST'])
def add_learning_goal():
    """添加学习目标"""
    try:
        data = request.get_json()
        
        # 创建新目标
        new_goal = {
            'id': f'goal_{random.randint(1000, 9999)}',
            'title': data.get('title'),
            'target_value': data.get('target_value'),
            'current_value': 0,
            'unit': data.get('unit'),
            'deadline': data.get('deadline'),
            'priority': data.get('priority'),
            'status': 'active'
        }
        
        return jsonify({
            'success': True,
            'goal': new_goal,
            'message': '学习目标已添加'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/user/learning-goals/<goal_id>', methods=['PUT'])
def update_learning_goal(goal_id):
    """更新学习目标"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        # 这里应该更新数据库中的目标状态
        # 目前返回成功响应
        
        return jsonify({
            'success': True,
            'message': f'目标 {goal_id} 状态已更新为 {status}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
