from datetime import datetime, date, timedelta
from typing import Dict, List
import statistics
from .models import (
    UserLearningProfile, DailyPracticeRecommendation,
    LearningSession, db
)
from sqlalchemy import and_


class RecommendationEngine:
    """智能推荐引擎 - 基于心理学理论的每日练习量推荐系统"""
    
    def __init__(self):
        # 推荐算法参数
        self.base_word_count = 10  # 基础单词数量
        self.max_word_count = 50   # 最大单词数量
        self.min_word_count = 5    # 最小单词数量
        
        # 心理学参数权重
        self.autonomy_weight = 0.3
        self.competence_weight = 0.4
        self.motivation_weight = 0.3
        
        # 学习能力评估参数
        self.learning_speed_factor = 1.2
        self.accuracy_threshold = 0.7
        self.difficulty_adjustment = 0.1
    
    def generate_daily_recommendation(self, user_id: str,
                                      target_date: date = None) -> Dict:
        """生成每日练习推荐
        
        Args:
            user_id: 用户ID
            target_date: 目标日期，默认为今天
            
        Returns:
            推荐结果字典
        """
        if target_date is None:
            target_date = date.today()
        
        # 获取或创建用户学习画像
        profile = self._get_or_create_user_profile(user_id)
        
        # 分析用户学习历史
        learning_analysis = self._analyze_learning_history(user_id)
        
        # 计算推荐参数
        recommendation = self._calculate_recommendation(
            profile, learning_analysis, target_date
        )
        
        # 应用心理学调整
        psychological_adjustment = self._apply_psychological_factors(
            profile, learning_analysis, recommendation
        )
        
        # 合并推荐结果
        final_recommendation = {
            **recommendation,
            **psychological_adjustment,
            'user_id': user_id,
            'date': target_date,
            'confidence_level': self._calculate_confidence(
                profile, learning_analysis
            )
        }
        
        # 保存推荐记录
        self._save_recommendation(final_recommendation)
        
        return final_recommendation
    
    def _get_or_create_user_profile(self, user_id: str) -> UserLearningProfile:
        """获取或创建用户学习画像"""
        profile = UserLearningProfile.query.filter_by(
            user_id=user_id
        ).first()
        
        if not profile:
            profile = UserLearningProfile(
                user_id=user_id,
                learning_speed=1.0,
                memory_retention=0.7,
                accuracy_trend=0.8,
                preferred_session_length=20,
                preferred_daily_words=10,
                optimal_difficulty=0.6
            )
            db.session.add(profile)
            db.session.commit()
        
        return profile
    
    def _analyze_learning_history(self, user_id: str) -> Dict:
        """分析用户学习历史"""
        # 获取最近30天的学习会话
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_sessions = LearningSession.query.filter(
            and_(
                LearningSession.user_id == user_id,
                LearningSession.session_date >= thirty_days_ago
            )
        ).order_by(LearningSession.session_date.desc()).all()
        
        if not recent_sessions:
            return self._get_default_analysis()
        
        # 计算学习统计
        total_sessions = len(recent_sessions)
        avg_accuracy = statistics.mean(
            [s.accuracy_rate for s in recent_sessions if s.accuracy_rate > 0]
        ) if recent_sessions else 0.8
        
        avg_words_per_session = statistics.mean(
            [s.total_words for s in recent_sessions if s.total_words > 0]
        ) if recent_sessions else 10
        
        avg_duration = statistics.mean(
            [s.duration_minutes for s in recent_sessions
             if s.duration_minutes > 0]
        ) if recent_sessions else 20
        
        # 计算学习趋势
        recent_accuracy_trend = self._calculate_accuracy_trend(recent_sessions)
        learning_consistency = self._calculate_consistency(recent_sessions)
        
        # 分析最佳学习时间
        optimal_time_analysis = self._analyze_optimal_time(recent_sessions)
        
        return {
            'total_sessions': total_sessions,
            'avg_accuracy': avg_accuracy,
            'avg_words_per_session': avg_words_per_session,
            'avg_duration': avg_duration,
            'accuracy_trend': recent_accuracy_trend,
            'learning_consistency': learning_consistency,
            'optimal_time': optimal_time_analysis,
            'recent_sessions': recent_sessions[:7]  # 最近7天
        }
    
    def _get_default_analysis(self) -> Dict:
        """获取默认分析结果（新用户）"""
        return {
            'total_sessions': 0,
            'avg_accuracy': 0.8,
            'avg_words_per_session': 10,
            'avg_duration': 20,
            'accuracy_trend': 0.0,
            'learning_consistency': 0.5,
            'optimal_time': {'hour': 14, 'preference': 0.7},
            'recent_sessions': []
        }
    
    def _calculate_recommendation(self, profile: UserLearningProfile,
                                  analysis: Dict, target_date: date) -> Dict:
        """计算基础推荐参数"""
        # 基于学习能力调整单词数量
        base_count = profile.preferred_daily_words or self.base_word_count
        
        # 学习速度调整
        speed_factor = profile.learning_speed * self.learning_speed_factor
        adjusted_count = base_count * speed_factor
        
        # 准确率调整
        if analysis['avg_accuracy'] > self.accuracy_threshold:
            # 准确率高，可以增加难度
            adjusted_count *= 1.1
        elif analysis['avg_accuracy'] < 0.6:
            # 准确率低，减少数量
            adjusted_count *= 0.8
        
        # 趋势调整
        if analysis['accuracy_trend'] > 0.1:
            # 进步趋势，可以增加挑战
            adjusted_count *= 1.05
        elif analysis['accuracy_trend'] < -0.1:
            # 退步趋势，降低难度
            adjusted_count *= 0.9
        
        # 确保在合理范围内
        recommended_count = max(
            self.min_word_count,
            min(self.max_word_count, int(adjusted_count))
        )
        
        # 计算推荐学习时长
        base_duration = profile.preferred_session_length or 20
        recommended_duration = int(
            base_duration * (recommended_count / base_count)
        )
        
        # 计算目标准确率
        target_accuracy = min(0.95, analysis['avg_accuracy'] + 0.05)
        
        # 计算难度级别
        difficulty_level = profile.optimal_difficulty or 0.6
        if analysis['avg_accuracy'] > 0.85:
            difficulty_level = min(1.0, difficulty_level + 0.1)
        elif analysis['avg_accuracy'] < 0.65:
            difficulty_level = max(0.3, difficulty_level - 0.1)
        
        return {
            'recommended_word_count': recommended_count,
            'recommended_session_length': recommended_duration,
            'target_accuracy': target_accuracy,
            'difficulty_level': difficulty_level
        }
    
    def _apply_psychological_factors(self, profile: UserLearningProfile,
                                     analysis: Dict,
                                     recommendation: Dict) -> Dict:
        """应用心理学因素调整"""
        # 自主性评估 (Autonomy)
        autonomy_score = self._calculate_autonomy_score(
            profile, analysis, recommendation
        )
        
        # 胜任感评估 (Competence)
        competence_score = self._calculate_competence_score(
            profile, analysis, recommendation
        )
        
        # 动机提升计算
        motivation_boost = self._calculate_motivation_boost(
            profile, analysis, autonomy_score, competence_score
        )
        
        # 生成推荐理由
        reasoning = self._generate_reasoning(
            profile, analysis, recommendation,
            autonomy_score, competence_score, motivation_boost
        )
        
        return {
            'autonomy_score': autonomy_score,
            'competence_score': competence_score,
            'motivation_boost': motivation_boost,
            'reasoning': reasoning
        }
    
    def _calculate_autonomy_score(self, profile: UserLearningProfile,
                                  analysis: Dict,
                                  recommendation: Dict) -> float:
        """计算自主性评分"""
        # 基于用户偏好与推荐的匹配度
        word_count_match = 1.0 - abs(
            recommendation['recommended_word_count'] -
            (profile.preferred_daily_words or 10)
        ) / 20.0
        
        duration_match = 1.0 - abs(
            recommendation['recommended_session_length'] -
            (profile.preferred_session_length or 20)
        ) / 30.0
        
        # 学习一致性影响自主感
        consistency_factor = analysis['learning_consistency']
        
        autonomy_score = (
            word_count_match * 0.4 +
            duration_match * 0.3 +
            consistency_factor * 0.3
        )
        
        return max(0.0, min(1.0, autonomy_score))
    
    def _calculate_competence_score(self, profile: UserLearningProfile,
                                    analysis: Dict,
                                    recommendation: Dict) -> float:
        """计算胜任感评分"""
        # 基于历史表现和推荐难度的匹配
        accuracy_confidence = min(1.0, analysis['avg_accuracy'] / 0.8)
        
        # 难度适配性
        optimal_difficulty = profile.optimal_difficulty or 0.6
        difficulty_match = 1.0 - abs(
            recommendation['difficulty_level'] - optimal_difficulty
        )
        
        # 进步趋势
        progress_factor = max(0.0, min(1.0, 
            (analysis['accuracy_trend'] + 0.2) / 0.4
        ))
        
        competence_score = (
            accuracy_confidence * 0.4 + 
            difficulty_match * 0.3 + 
            progress_factor * 0.3
        )
        
        return max(0.0, min(1.0, competence_score))
    
    def _calculate_motivation_boost(self, profile: UserLearningProfile,
                                  analysis: Dict, autonomy_score: float,
                                  competence_score: float) -> float:
        """计算动机提升系数"""
        # 基于自主性和胜任感的综合评估
        base_motivation = (
            autonomy_score * self.autonomy_weight + 
            competence_score * self.competence_weight
        )
        
        # 学习连续性奖励
        streak_bonus = min(0.2, profile.current_streak * 0.02)
        
        # 一致性奖励
        consistency_bonus = analysis['learning_consistency'] * 0.1
        
        motivation_boost = base_motivation + streak_bonus + consistency_bonus
        
        return max(0.0, min(1.0, motivation_boost))
    
    def _generate_reasoning(self, profile: UserLearningProfile,
                          analysis: Dict, recommendation: Dict,
                          autonomy_score: float, competence_score: float,
                          motivation_boost: float) -> str:
        """生成推荐理由说明"""
        reasons = []
        
        # 基于学习表现的理由
        if analysis['avg_accuracy'] > 0.85:
            reasons.append("您的学习表现优秀，建议适当增加挑战难度")
        elif analysis['avg_accuracy'] < 0.65:
            reasons.append("建议先巩固基础，降低学习强度以提升信心")
        
        # 基于学习趋势的理由
        if analysis['accuracy_trend'] > 0.1:
            reasons.append("您的学习呈上升趋势，可以尝试更多单词")
        elif analysis['accuracy_trend'] < -0.1:
            reasons.append("最近表现有所波动，建议保持稳定的学习节奏")
        
        # 基于心理因素的理由
        if autonomy_score > 0.8:
            reasons.append("推荐参数符合您的学习偏好")
        if competence_score > 0.8:
            reasons.append("难度设置有助于提升您的胜任感")
        
        # 基于连续性的理由
        if profile.current_streak > 7:
            reasons.append(f"您已连续学习{profile.current_streak}天，保持良好习惯")
        
        return "；".join(reasons) if reasons else "基于您的学习数据制定的个性化推荐"
    
    def _calculate_accuracy_trend(self, sessions: List[LearningSession]) -> float:
        """计算准确率趋势"""
        if len(sessions) < 3:
            return 0.0
        
        # 取最近的会话计算趋势
        recent_accuracies = [s.accuracy_rate for s in sessions[:5] 
                           if s.accuracy_rate > 0]
        
        if len(recent_accuracies) < 2:
            return 0.0
        
        # 简单线性趋势计算
        x = list(range(len(recent_accuracies)))
        y = recent_accuracies
        
        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        if n * sum_x2 - sum_x ** 2 == 0:
            return 0.0
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x ** 2)
        return slope
    
    def _calculate_consistency(self, sessions: List[LearningSession]) -> float:
        """计算学习一致性"""
        if len(sessions) < 2:
            return 0.5
        
        # 计算学习间隔的标准差
        dates = [s.session_date for s in sessions]
        dates.sort()
        
        intervals = []
        for i in range(1, len(dates)):
            interval = (dates[i-1] - dates[i]).days
            intervals.append(abs(interval))
        
        if not intervals:
            return 0.5
        
        # 一致性 = 1 - (标准差 / 平均值)
        avg_interval = statistics.mean(intervals)
        if avg_interval == 0:
            return 1.0
        
        std_interval = statistics.stdev(intervals) if len(intervals) > 1 else 0
        consistency = 1.0 - min(1.0, std_interval / avg_interval)
        
        return max(0.0, consistency)
    
    def _analyze_optimal_time(self, sessions: List[LearningSession]) -> Dict:
        """分析最佳学习时间"""
        if not sessions:
            return {'hour': 14, 'preference': 0.7}
        
        # 统计不同时间段的学习表现
        time_performance = {}
        for session in sessions:
            if session.start_time and session.accuracy_rate > 0:
                hour = session.start_time.hour
                if hour not in time_performance:
                    time_performance[hour] = []
                time_performance[hour].append(session.accuracy_rate)
        
        if not time_performance:
            return {'hour': 14, 'preference': 0.7}
        
        # 找到表现最好的时间段
        best_hour = 14
        best_performance = 0.0
        
        for hour, accuracies in time_performance.items():
            avg_accuracy = statistics.mean(accuracies)
            if avg_accuracy > best_performance:
                best_performance = avg_accuracy
                best_hour = hour
        
        return {
            'hour': best_hour,
            'preference': min(1.0, best_performance)
        }
    
    def _calculate_confidence(self, profile: UserLearningProfile,
                            analysis: Dict) -> float:
        """计算推荐置信度"""
        # 基于数据量的置信度
        data_confidence = min(1.0, analysis['total_sessions'] / 10.0)
        
        # 基于学习稳定性的置信度
        stability_confidence = analysis['learning_consistency']
        
        # 基于用户画像完整性的置信度
        profile_completeness = 0.8  # 假设画像相对完整
        
        overall_confidence = (
            data_confidence * 0.4 + 
            stability_confidence * 0.3 + 
            profile_completeness * 0.3
        )
        
        return max(0.5, min(1.0, overall_confidence))
    
    def _save_recommendation(self, recommendation_data: Dict) -> None:
        """保存推荐记录到数据库"""
        recommendation = DailyPracticeRecommendation(
            user_id=recommendation_data['user_id'],
            date=recommendation_data['date'],
            recommended_word_count=recommendation_data['recommended_word_count'],
            recommended_session_length=recommendation_data['recommended_session_length'],
            target_accuracy=recommendation_data['target_accuracy'],
            difficulty_level=recommendation_data['difficulty_level'],
            autonomy_score=recommendation_data['autonomy_score'],
            competence_score=recommendation_data['competence_score'],
            motivation_boost=recommendation_data['motivation_boost'],
            reasoning=recommendation_data['reasoning'],
            confidence_level=recommendation_data['confidence_level']
        )
        
        db.session.add(recommendation)
        db.session.commit()
    
    def update_user_profile(self, user_id: str, 
                          session_data: Dict) -> None:
        """根据学习会话更新用户画像"""
        profile = self._get_or_create_user_profile(user_id)
        
        # 更新学习统计
        if session_data.get('accuracy_rate'):
            # 使用指数移动平均更新准确率趋势
            alpha = 0.3
            profile.accuracy_trend = (
                alpha * session_data['accuracy_rate'] + 
                (1 - alpha) * profile.accuracy_trend
            )
        
        # 更新学习偏好
        if session_data.get('duration_minutes'):
            # 调整偏好学习时长
            current_pref = profile.preferred_session_length or 20
            profile.preferred_session_length = int(
                0.8 * current_pref + 0.2 * session_data['duration_minutes']
            )
        
        # 更新连续学习天数
        today = date.today()
        last_session_date = session_data.get('session_date', today)
        
        if isinstance(last_session_date, str):
            last_session_date = datetime.strptime(
                last_session_date, '%Y-%m-%d'
            ).date()
        
        if last_session_date == today:
            profile.current_streak += 1
            profile.longest_streak = max(
                profile.longest_streak, profile.current_streak
            )
        else:
            profile.current_streak = 0
        
        profile.total_study_days += 1
        
        db.session.commit()