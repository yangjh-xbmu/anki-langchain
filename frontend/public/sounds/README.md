# 音效文件说明

本目录用于存放祝贺动画的音效文件。

## 需要的音频文件

请在此目录下添加以下音频文件：

### success.ogg（推荐）
- **用途**: 答对单词时播放的成功音效
- **格式**: OGG 格式（优先使用）
- **时长**: 建议 1-3 秒
- **文件大小**: 建议小于 100KB
- **音量**: 中等音量（代码中会自动调整到 30%）
- **风格**: 轻快、积极的提示音

### success.mp3（备用）
- **用途**: 当 OGG 文件不可用时的备用音效
- **格式**: MP3 格式
- **其他要求**: 与 OGG 文件相同

## 推荐音效来源

1. **免费音效网站**:
   - Freesound.org
   - Zapsplat.com
   - Adobe Audition 内置音效库

2. **音效关键词**:
   - "success sound"
   - "achievement notification"
   - "positive feedback"
   - "celebration chime"

3. **可汗学院风格**:
   - 简短清脆的铃声
   - 上升音调的和弦
   - 轻快的电子音效

## 文件放置

将音频文件直接放在 `/frontend/public/sounds/` 目录下：

```
frontend/public/sounds/
├── success.mp3     # 祝贺音效
└── README.md       # 本说明文件
```

## 注意事项

- 音频文件大小建议控制在 100KB 以内
- 确保音频格式兼容性（MP3 格式支持最广泛）
- 音效应该简短且不重复，避免影响用户体验
- 如果没有音频文件，组件会静默运行，不会报错