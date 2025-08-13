from datetime import datetime
from typing import Dict, List, Any
import statistics
from collections import defaultdict, Counter


class LearningAnalytics:
    """学习数据分析引擎"""
    
    def __init__(self):
        self.learning_patterns = {
            'morning_learner': {'start': 6, 'end': 10},
            'afternoon_learner': {'start': 13, 'end': 17},
            'evening_learner': {'start': 18, 'end': 22},
            'night_learner': {'start': 22, 'end': 24}
        }
    
    def analyze_learning_pattern(self, sessions: List[Dict]) -> Dict[str, Any]:
        """分析学习模式"""
        if not sessions:
            return {'pattern': 'insufficient_data', 'confidence': 0}
        
        # 分析学习时间偏好
        time_distribution = self._analyze_time_preference(sessions)
        
        # 分析学习频率
        frequency_pattern = self._analyze_frequency_pattern(sessions)
        
        # 分析学习强度
        intensity_pattern = self._analyze_intensity_pattern(sessions)
        
        # 分析错误模式
        error_pattern = self._analyze_error_pattern(sessions)
        
        return {
            'time_preference': time_distribution,
            'frequency_pattern': frequency_pattern,
            'intensity_pattern': intensity_pattern,
            'error_pattern': error_pattern,
            'overall_pattern': self._determine_overall_pattern(
                time_distribution, frequency_pattern, intensity_pattern
            )
        }
    
    def _analyze_time_preference(self, sessions: List[Dict]) -> Dict[str, Any]:
        """分析时间偏好"""
        hour_counts = defaultdict(int)
        
        for session in sessions:
            # 假设session有timestamp字段
            if 'timestamp' in session:
                hour = datetime.fromisoformat(session['timestamp']).hour
                hour_counts[hour] += 1
        
        if not hour_counts:
            return {'preferred_time': 'unknown', 'confidence': 0}
        
        # 计算各时间段的学习次数
        pattern_scores = {}
        for pattern_name, time_range in self.learning_patterns.items():
            score = 0
            for hour in range(time_range['start'], time_range['end']):
                score += hour_counts.get(hour, 0)
            pattern_scores[pattern_name] = score
        
        # 找出最活跃的时间段
        best_pattern = max(pattern_scores, key=pattern_scores.get)
        total_sessions = sum(hour_counts.values())
        confidence = pattern_scores[best_pattern] / total_sessions if total_sessions > 0 else 0
        
        return {
            'preferred_time': best_pattern,
            'confidence': confidence,
            'distribution': dict(hour_counts),
            'pattern_scores': pattern_scores
        }
    
    def _analyze_frequency_pattern(self, sessions: List[Dict]) -> Dict[str, Any]:
        """分析学习频率模式"""
        if len(sessions) < 2:
            return {'pattern': 'insufficient_data', 'avg_interval': 0}
        
        # 计算学习间隔
        intervals = []
        sorted_sessions = sorted(sessions, key=lambda x: x.get('timestamp', ''))
        
        for i in range(1, len(sorted_sessions)):
            prev_time = datetime.fromisoformat(sorted_sessions[i-1]['timestamp'])
            curr_time = datetime.fromisoformat(sorted_sessions[i]['timestamp'])
            interval = (curr_time - prev_time).total_seconds() / 3600  # 小时
            intervals.append(interval)
        
        if not intervals:
            return {'pattern': 'insufficient_data', 'avg_interval': 0}
        
        avg_interval = statistics.mean(intervals)
        std_interval = statistics.stdev(intervals) if len(intervals) > 1 else 0
        
        # 判断学习频率模式
        if avg_interval < 2:  # 小于2小时
            pattern = 'intensive_learner'
        elif avg_interval < 24:  # 小于1天
            pattern = 'daily_learner'
        elif avg_interval < 168:  # 小于1周
            pattern = 'regular_learner'
        else:
            pattern = 'casual_learner'
        
        return {
            'pattern': pattern,
            'avg_interval': avg_interval,
            'std_interval': std_interval,
            'consistency': 1 / (1 + std_interval / avg_interval) if avg_interval > 0 else 0
        }
    
    def _analyze_intensity_pattern(self, sessions: List[Dict]) -> Dict[str, Any]:
        """分析学习强度模式"""
        if not sessions:
            return {'pattern': 'no_data', 'avg_duration': 0}
        
        durations = []
        word_counts = []
        
        for session in sessions:
            if 'duration' in session:
                durations.append(session['duration'])
            if 'words_practiced' in session:
                word_counts.append(session['words_practiced'])
        
        avg_duration = statistics.mean(durations) if durations else 0
        avg_words = statistics.mean(word_counts) if word_counts else 0
        
        # 判断学习强度
        if avg_duration > 60 and avg_words > 50:  # 超过1小时，50个单词
            pattern = 'high_intensity'
        elif avg_duration > 30 and avg_words > 25:
            pattern = 'medium_intensity'
        else:
            pattern = 'low_intensity'
        
        return {
            'pattern': pattern,
            'avg_duration': avg_duration,
            'avg_words_per_session': avg_words,
            'efficiency': avg_words / avg_duration if avg_duration > 0 else 0
        }
    
    def _analyze_error_pattern(self, sessions: List[Dict]) -> Dict[str, Any]:
        """分析错误模式"""
        error_types = Counter()
        difficulty_errors = defaultdict(int)
        time_errors = defaultdict(int)
        
        for session in sessions:
            if 'errors' in session:
                for error in session['errors']:
                    error_types[error.get('type', 'unknown')] += 1
                    
                    # 按难度分析错误
                    difficulty = error.get('word_difficulty', 'medium')
                    difficulty_errors[difficulty] += 1
                    
                    # 按时间分析错误
                    if 'timestamp' in session:
                        hour = datetime.fromisoformat(session['timestamp']).hour
                        time_errors[hour] += 1
        
        return {
            'common_error_types': dict(error_types.most_common(5)),
            'difficulty_distribution': dict(difficulty_errors),
            'time_distribution': dict(time_errors),
            'total_errors': sum(error_types.values())
        }
    
    def _determine_overall_pattern(self, time_pref: Dict, freq_pref: Dict, 
                                 intensity_pref: Dict) -> str:
        """确定整体学习模式"""
        patterns = []
        
        # 基于时间偏好
        if time_pref.get('confidence', 0) > 0.6:
            patterns.append(time_pref['preferred_time'])
        
        # 基于频率
        freq_pattern = freq_pref.get('pattern', '')
        if freq_pattern:
            patterns.append(freq_pattern)
        
        # 基于强度
        intensity_pattern = intensity_pref.get('pattern', '')
        if intensity_pattern:
            patterns.append(intensity_pattern)
        
        return '_'.join(patterns) if patterns else 'undefined_pattern'
    
    def generate_personalized_recommendations(self, 
                                            learning_pattern: Dict[str, Any],
                                            current_performance: Dict[str, Any]) -> List[Dict[str, str]]:
        """生成个性化建议"""
        recommendations = []
        
        # 基于时间偏好的建议
        time_pref = learning_pattern.get('time_preference', {})
        if time_pref.get('confidence', 0) > 0.5:
            preferred_time = time_pref['preferred_time']
            recommendations.append({
                'type': 'schedule',
                'title': '优化学习时间',
                'suggestion': f'根据您的学习模式，建议在{self._get_time_description(preferred_time)}进行学习，效果更佳。'
            })
        
        # 基于频率模式的建议
        freq_pattern = learning_pattern.get('frequency_pattern', {})
        if freq_pattern.get('consistency', 0) < 0.5:
            recommendations.append({
                'type': 'consistency',
                'title': '提高学习一致性',
                'suggestion': '建议制定固定的学习计划，保持规律的学习节奏。'
            })
        
        # 基于强度模式的建议
        intensity = learning_pattern.get('intensity_pattern', {})
        if intensity.get('efficiency', 0) < 0.5:
            recommendations.append({
                'type': 'efficiency',
                'title': '提升学习效率',
                'suggestion': '尝试缩短单次学习时间，增加学习频率，可能会有更好的效果。'
            })
        
        # 基于错误模式的建议
        error_pattern = learning_pattern.get('error_pattern', {})
        common_errors = error_pattern.get('common_error_types', {})
        if common_errors:
            most_common_error = max(common_errors, key=common_errors.get)
            recommendations.append({
                'type': 'improvement',
                'title': '针对性改进',
                'suggestion': f'您在{most_common_error}方面需要加强练习，建议重点关注。'
            })
        
        # 基于当前表现的建议
        accuracy = current_performance.get('accuracy', 0)
        if accuracy < 0.7:
            recommendations.append({
                'type': 'difficulty',
                'title': '调整学习难度',
                'suggestion': '当前正确率较低，建议从简单的单词开始，逐步提升难度。'
            })
        elif accuracy > 0.9:
            recommendations.append({
                'type': 'challenge',
                'title': '增加学习挑战',
                'suggestion': '您的表现很出色！可以尝试更有挑战性的单词或增加学习量。'
            })
        
        return recommendations
    
    def _get_time_description(self, pattern: str) -> str:
        """获取时间模式的描述"""
        descriptions = {
            'morning_learner': '早晨时光（6:00-10:00）',
            'afternoon_learner': '下午时段（13:00-17:00）',
            'evening_learner': '傍晚时分（18:00-22:00）',
            'night_learner': '夜晚时间（22:00-24:00）'
        }
        return descriptions.get(pattern, '您偏好的时间段')
    
    def predict_optimal_study_time(self, learning_pattern: Dict[str, Any]) -> Dict[str, Any]:
        """预测最佳学习时间"""
        time_pref = learning_pattern.get('time_preference', {})
        freq_pattern = learning_pattern.get('frequency_pattern', {})
        
        if time_pref.get('confidence', 0) > 0.6:
            preferred_pattern = time_pref['preferred_time']
            time_range = self.learning_patterns[preferred_pattern]
            
            # 基于频率模式调整建议
            avg_interval = freq_pattern.get('avg_interval', 24)
            
            return {
                'recommended_start_hour': time_range['start'],
                'recommended_end_hour': time_range['end'],
                'suggested_interval_hours': min(avg_interval, 24),
                'confidence': time_pref['confidence']
            }
        
        return {
            'recommended_start_hour': 9,  # 默认推荐
            'recommended_end_hour': 11,
            'suggested_interval_hours': 24,
            'confidence': 0.3
        }