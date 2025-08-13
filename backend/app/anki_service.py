import requests
import re
from urllib.parse import unquote


class AnkiConnectService:
    def __init__(self, url="http://localhost:8765"):
        self.url = url
    
    def _request(self, action, params=None):
        """向AnkiConnect发送请求"""
        if params is None:
            params = {}
        
        request_data = {
            "action": action,
            "version": 6,
            "params": params
        }
        
        try:
            response = requests.post(self.url, json=request_data)
            response.raise_for_status()
            result = response.json()
            
            if result.get("error"):
                raise Exception(f"AnkiConnect错误: {result['error']}")
            
            return result.get("result")
        except requests.exceptions.RequestException as e:
            raise Exception(f"连接Anki失败: {e}")
    
    def get_deck_names(self):
        """获取所有牌组名称"""
        return self._request("deckNames")
    
    def get_cards_in_deck(self, deck_name):
        """获取指定牌组中的卡片ID"""
        query = f"deck:{deck_name}"
        return self._request("findCards", {"query": query})
    
    def get_cards_info(self, card_ids):
        """获取卡片详细信息"""
        return self._request("cardsInfo", {"cards": card_ids})
    
    def get_notes_info(self, note_ids):
        """获取笔记详细信息"""
        return self._request("notesInfo", {"notes": note_ids})
    
    def get_learning_cards(self):
        """获取正在学习的卡片"""
        # 获取【英语::小学单词】牌组中正在学习的卡片
        query = "deck:英语::小学单词 is:learn"
        card_ids = self._request("findCards", {"query": query})
        
        if not card_ids:
            return []
        
        # 限制数量，避免一次获取太多
        card_ids = card_ids[:50]
        cards_info = self.get_cards_info(card_ids)
        
        # 获取笔记信息
        note_ids = [card["note"] for card in cards_info]
        notes_info = self.get_notes_info(note_ids)
        
        # 组合卡片和笔记信息
        words = []
        for i, card in enumerate(cards_info):
            note = notes_info[i]
            fields = note.get("fields", {})
            
            # 尝试从不同字段获取单词和含义
            word = self._extract_word(fields)
            meaning = self._extract_meaning(fields)
            
            if word:
                # 提取图片信息
                image_info = self._extract_image(fields)
                # 提取音频信息
                audio_info = self._extract_audio(fields)
                # 提取其他字段信息
                phonetic = self._extract_field(fields, ["音标", "Phonetic"])
                etymology = self._extract_field(fields, ["词源", "Etymology"])
                exam_frequency = self._extract_field(
                    fields, ["考试频率", "Frequency"]
                )
                star_level = self._extract_field(
                    fields, ["星级", "Level", "重要等级"]
                )
                example_sentence = self._extract_field(
                    fields, ["真题例句", "Example"]
                )
                example_translation = self._extract_field(
                    fields, ["例句释义", "Translation"]
                )
                related_words = self._extract_field(
                    fields, ["相关词", "Related"]
                )
                
                words.append({
                    "id": card["cardId"],
                    "word": word,
                    "meaning": meaning,
                    "deck": card["deckName"],
                    "image_info": image_info,
                    "audio_info": audio_info,
                    "phonetic": phonetic,
                    "etymology": etymology,
                    "exam_frequency": exam_frequency,
                    "star_level": star_level,
                    "example_sentence": example_sentence,
                    "example_translation": example_translation,
                    "related_words": related_words
                })
        
        return words
    
    def _extract_word(self, fields):
        """从字段中提取单词"""
        # 常见的单词字段名
        word_fields = ["Front", "Word", "单词", "English", "Question"]
        
        for field_name in word_fields:
            if field_name in fields:
                value = fields[field_name]["value"]
                # 移除HTML标签
                clean_value = re.sub(r'<[^>]+>', '', value).strip()
                if clean_value:
                    return clean_value
        
        # 如果没找到，返回第一个非空字段
        for field_name, field_data in fields.items():
            value = field_data["value"]
            clean_value = re.sub(r'<[^>]+>', '', value).strip()
            # 假设单词不超过3个词
            if clean_value and len(clean_value.split()) <= 3:
                return clean_value
        
        return None
    
    def _extract_image(self, fields):
        """从字段中提取图片信息"""
        # 遍历所有字段寻找图片
        for field_name, field_data in fields.items():
            value = field_data["value"]
            
            # 首先查找img标签
            img_pattern = r'<img[^>]*src=["\']([^"\'>]+)["\'][^>]*>'
            img_matches = re.findall(img_pattern, value)
            
            if img_matches:
                # 返回第一个找到的图片信息
                img_src = img_matches[0]
                
                # 处理不同类型的图片源
                if img_src.startswith('data:image/'):
                    # Base64编码的图片
                    return {
                        'type': 'base64',
                        'data': img_src,
                        'field': field_name
                    }
                elif img_src.startswith('http'):
                    # 网络图片
                    return {
                        'type': 'url',
                        'data': img_src,
                        'field': field_name
                    }
                else:
                    # Anki媒体文件
                    # 解码URL编码的文件名
                    filename = unquote(img_src)
                    return {
                        'type': 'anki_media',
                        'data': filename,
                        'field': field_name
                    }
            
            # 如果没有找到img标签，检查是否为纯URL（特别是图片字段）
            if field_name in ["图片", "Image", "Picture"]:
                # 去除HTML标签和空白字符
                clean_value = re.sub(r'<[^>]+>', '', value).strip()
                
                # 检查是否为有效的图片URL
                if (clean_value and 
                    (clean_value.startswith('http') or 
                     clean_value.startswith('https'))):
                    # 检查URL是否指向图片文件
                    img_extensions = ['.jpg', '.jpeg', '.png', '.gif', 
                                      '.bmp', '.webp', '.svg']
                    if (any(clean_value.lower().endswith(ext) 
                             for ext in img_extensions) or 
                            '?' in clean_value):
                        return {
                            'type': 'url',
                            'data': clean_value,
                            'field': field_name
                        }
        
        return None
    
    def _extract_audio(self, fields):
        """从字段中提取音频信息"""
        # 遍历所有字段寻找音频
        for field_name, field_data in fields.items():
            value = field_data["value"]
            
            # 查找sound标签或有道API链接
            sound_pattern = r'\[sound:([^\]]+)\]'
            sound_matches = re.findall(sound_pattern, value)
            
            if sound_matches:
                # 返回第一个找到的音频信息
                audio_src = sound_matches[0]
                
                # 处理不同类型的音频源
                if audio_src.startswith('http://dict.youdao.com'):
                    # 有道API音频
                    return {
                        'type': 'youdao_url',
                        'data': audio_src,
                        'field': field_name
                    }
                elif audio_src.startswith('http'):
                    # 其他网络音频
                    return {
                        'type': 'url',
                        'data': audio_src,
                        'field': field_name
                    }
                else:
                    # Anki媒体文件
                    filename = unquote(audio_src)
                    return {
                        'type': 'anki_media',
                        'data': filename,
                        'field': field_name
                    }
        
        return None
    
    def _extract_meaning(self, fields):
        """从字段中提取含义"""
        # 常见的含义字段名
        meaning_fields = [
            "Back", "Meaning", "含义", "中文", "Answer", "Definition", "释义"
        ]
        
        for field_name in meaning_fields:
            if field_name in fields:
                value = fields[field_name]["value"]
                # 移除HTML标签
                clean_value = re.sub(r'<[^>]+>', '', value).strip()
                if clean_value:
                    return clean_value
        
        return None
    
    def _extract_field(self, fields, field_names):
        """从字段中提取指定字段的值"""
        for field_name in field_names:
            if field_name in fields:
                value = fields[field_name]["value"]
                # 移除HTML标签
                clean_value = re.sub(r'<[^>]+>', '', value).strip()
                if clean_value:
                    # 对于数字字段，尝试转换为整数
                    numeric_fields = [
                        "考试频率", "Frequency", "星级", "Level", "重要等级"
                    ]
                    if field_name in numeric_fields:
                        try:
                            return int(clean_value)
                        except ValueError:
                            return clean_value
                    return clean_value
        
        return None