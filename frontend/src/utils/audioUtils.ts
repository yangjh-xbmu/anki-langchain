/**
 * 音频工具函数
 * 用于生成和播放祝贺音效
 */

/**
 * 使用 Web Audio API 生成祝贺音效
 * 当没有音频文件时，可以使用此函数生成简单的音效
 */
export const playSuccessSound = () => {
  try {
    // 首先尝试播放OGG音频文件
    const audio = new Audio('/sounds/success.ogg');
    audio.volume = 0.3; // 设置音量为30%
    audio.play().catch(() => {
      // 如果OGG文件不存在，尝试MP3文件
      const audioMp3 = new Audio('/sounds/success.mp3');
      audioMp3.volume = 0.3;
      audioMp3.play().catch(() => {
        // 如果音频文件都不存在，使用 Web Audio API 生成音效
        generateSuccessSound();
      });
    });
  } catch (error) {
    // 如果创建 Audio 对象失败，使用 Web Audio API
    generateSuccessSound();
  }
};

/**
 * 使用 Web Audio API 生成简单的祝贺音效
 * 模拟可汗学院风格的成功提示音
 */
const generateSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 创建一个简短的上升音调序列
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 和弦
    const duration = 0.15; // 每个音符持续时间
    
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // 设置音量包络
      const startTime = audioContext.currentTime + index * duration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.log('Web Audio API not supported or failed to generate sound');
  }
};

/**
 * 检查音频文件是否存在
 */
export const checkAudioFileExists = async (audioPath: string): Promise<boolean> => {
  try {
    const response = await fetch(audioPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// 检查成功音效文件是否存在
export const checkSuccessAudioExists = async (): Promise<{ ogg: boolean; mp3: boolean }> => {
  const [oggExists, mp3Exists] = await Promise.all([
    checkAudioFileExists('/sounds/success.ogg'),
    checkAudioFileExists('/sounds/success.mp3')
  ]);
  return { ogg: oggExists, mp3: mp3Exists };
};