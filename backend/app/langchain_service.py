import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate


class LangChainService:
    def __init__(self):
        # 从环境变量获取API密钥
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        self.llm = None
        
        if self.google_api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash-exp",
                    google_api_key=self.google_api_key,
                    temperature=0.3
                )
            except Exception as e:
                print(f"警告：无法初始化Google AI服务: {e}")
        else:
            print("警告：未设置GOOGLE_API_KEY，AI功能将不可用")
    
    def generate_image_prompt(self, word):
        """生成图片描述提示词"""
        if not self.llm:
            return f"A simple illustration of {word}"
            
        prompt_template = PromptTemplate(
            input_variables=["word"],
            template="""
            为单词 '{word}' 生成一个简单、清晰的图片描述，
            适合儿童学习使用。描述应该：
            1. 简洁明了
            2. 突出单词的主要特征
            3. 适合生成插图
            4. 用英文描述
            
            只返回图片描述，不要其他内容。
            """
        )
        
        prompt = prompt_template.format(word=word)
        response = self.llm.invoke(prompt)
        return response.strip()
    
    def generate_image(self, word, image_info=None):
        """处理单词对应的图片URL"""
        if image_info:
            return self._process_anki_image(image_info)
        else:
            # 如果没有图片信息，返回占位符
            base_url = "https://via.placeholder.com/200x200/4CAF50/FFFFFF"
            return f"{base_url}?text={word}"
    
    def _process_anki_image(self, image_info):
        """处理Anki图片信息"""
        if not image_info:
            return None
            
        image_type = image_info.get('type')
        image_data = image_info.get('data')
        
        if image_type == 'base64':
            # Base64图片可以直接使用
            return image_data
        elif image_type == 'url':
            # 网络图片直接返回URL
            return image_data
        elif image_type == 'anki_media':
            # Anki媒体文件需要通过AnkiConnect获取
            return self._get_anki_media_url(image_data)
        
        return None
    
    def process_audio_url(self, word, audio_info=None):
        """处理单词对应的音频URL"""
        if audio_info:
            return self._process_anki_audio(audio_info)
        else:
            # 如果没有音频信息，使用pyttsx3生成
            return self.generate_audio(word)
    
    def _process_anki_audio(self, audio_info):
        """处理Anki音频信息"""
        if not audio_info:
            return None
            
        audio_type = audio_info.get('type')
        audio_data = audio_info.get('data')
        
        if audio_type == 'youdao_url':
            # 有道API音频直接返回URL
            return audio_data
        elif audio_type == 'url':
            # 其他网络音频直接返回URL
            return audio_data
        elif audio_type == 'anki_media':
            # Anki媒体文件需要通过AnkiConnect获取
            return self._get_anki_audio_url(audio_data)
        
        return None
    
    def _get_anki_audio_url(self, filename):
        """获取Anki音频媒体文件的URL"""
        try:
            import requests
            import base64
            import os
            
            # 通过AnkiConnect获取媒体文件
            request_data = {
                "action": "retrieveMediaFile",
                "version": 6,
                "params": {"filename": filename}
            }
            
            response = requests.post("http://localhost:8765", 
                                     json=request_data)
            result = response.json()
            
            if result.get("error"):
                print(f"获取Anki音频文件失败: {result['error']}")
                return None
                
            # 获取base64编码的文件内容
            file_content = result.get("result")
            if not file_content:
                return None
                
            # 保存文件到static目录
            audio_dir = "static/audio"
            os.makedirs(audio_dir, exist_ok=True)
            
            # 处理文件名
            safe_filename = filename.replace(' ', '_').replace('/', '_')
            local_filename = f"anki_{safe_filename}"
            local_path = os.path.join(audio_dir, local_filename)
            
            # 解码并保存文件
            with open(local_path, 'wb') as f:
                f.write(base64.b64decode(file_content))
            
            return f"/static/audio/{local_filename}"
            
        except Exception as e:
            print(f"处理Anki音频文件失败: {e}")
            return None
    
    def _get_anki_media_url(self, filename):
        """获取Anki媒体文件的URL"""
        try:
            import requests
            import base64
            import os
            
            # 通过AnkiConnect获取媒体文件
            request_data = {
                "action": "retrieveMediaFile",
                "version": 6,
                "params": {"filename": filename}
            }
            
            response = requests.post("http://localhost:8765", 
                                     json=request_data)
            result = response.json()
            
            if result.get("error"):
                print(f"获取Anki媒体文件失败: {result['error']}")
                return None
                
            # 获取base64编码的文件内容
            file_content = result.get("result")
            if not file_content:
                return None
                
            # 保存文件到static目录
            media_dir = "static/images"
            os.makedirs(media_dir, exist_ok=True)
            
            # 处理文件名
            safe_filename = filename.replace(' ', '_').replace('/', '_')
            local_filename = f"anki_{safe_filename}"
            local_path = os.path.join(media_dir, local_filename)
            
            # 解码并保存文件
            with open(local_path, 'wb') as f:
                f.write(base64.b64decode(file_content))
            
            return f"/static/images/{local_filename}"
            
        except Exception as e:
            print(f"处理Anki媒体文件失败: {e}")
            return None
    
    def generate_audio(self, word):
        """使用pyttsx3生成单词发音音频文件"""
        try:
            import pyttsx3
            
            # 初始化TTS引擎
            engine = pyttsx3.init()
            
            # 设置语音属性
            engine.setProperty('rate', 150)  # 语速
            engine.setProperty('volume', 0.9)  # 音量
            
            # 尝试设置英语语音
            voices = engine.getProperty('voices')
            for voice in voices:
                if 'english' in voice.name.lower() or 'en' in voice.id.lower():
                    engine.setProperty('voice', voice.id)
                    break
            
            # 创建音频目录
            audio_dir = "static/audio"
            os.makedirs(audio_dir, exist_ok=True)
            
            # 生成音频文件
            audio_filename = f"{word.lower().replace(' ', '_')}.wav"
            audio_path = os.path.join(audio_dir, audio_filename)
            
            # 保存音频到文件
            engine.save_to_file(word, audio_path)
            engine.runAndWait()
            
            # 返回音频文件的相对路径
            return f"/static/audio/{audio_filename}"
            
        except Exception as e:
            print(f"生成音频失败: {e}")
            return None
    
    def get_word_definition(self, word):
        """获取单词定义"""
        prompt_template = PromptTemplate(
            input_variables=["word"],
            template="""
            请为英语单词 '{word}' 提供：
            1. 中文含义（简洁明了）
            2. 词性
            3. 一个简单的例句（英文）
            
            格式：
            含义：[中文含义]
            词性：[词性]
            例句：[英文例句]
            """
        )
        
        try:
            prompt = prompt_template.format(word=word)
            response = self.llm.invoke(prompt)
            # Gemini返回的是AIMessage对象，需要获取content
            if hasattr(response, 'content'):
                return response.content.strip()
            else:
                return str(response).strip()
        except Exception as e:
            print(f"获取单词定义失败: {e}")
            return f"单词：{word}"