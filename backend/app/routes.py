from flask import Blueprint, jsonify, request

from .anki_service import AnkiConnectService
from .langchain_service import LangChainService
from .models import PracticeSession, Word, db

api = Blueprint('api', __name__, url_prefix='/api')


@api.route('/words', methods=['GET'])
def get_words():
    """获取单词列表"""
    try:
        words = Word.query.all()
        return jsonify([word.to_dict() for word in words])
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
