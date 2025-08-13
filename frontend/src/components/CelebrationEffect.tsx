import React, { useEffect, useState, useRef } from 'react';
import { playSuccessSound } from '../utils/audioUtils';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface CelebrationEffectProps {
  isVisible: boolean;
  onComplete?: () => void;
  playSound?: boolean;
  reducedMotion?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

// 将colors移到组件外部，避免每次渲染都创建新数组
const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
  isVisible,
  onComplete,
  playSound = true,
  reducedMotion = false,
  buttonRef
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const ANIMATION_DURATION = 1000; // 1秒动画时长
  const particleCount = reducedMotion ? 25 : window.innerWidth < 768 ? 40 : 60;

  // 创建粒子
  const createParticles = () => {
    const newParticles: Particle[] = [];
    
    // 获取按钮位置
    let buttonRect = { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 100, height: 40 };
    if (buttonRef?.current) {
      buttonRect = buttonRef.current.getBoundingClientRect();
    }
    
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = Math.random() * 8 + 4;
      
      newParticles.push({
        id: i,
        x: centerX + (Math.random() - 0.5) * buttonRect.width,
        y: centerY + (Math.random() - 0.5) * buttonRect.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        life: 0,
        maxLife: Math.random() * 30 + 30,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
      });
    }
    
    setParticles(newParticles);
  };



  // 播放音效（只播放一次）
  useEffect(() => {
    if (isVisible && playSound && !soundPlayed) {
      playSuccessSound();
      setSoundPlayed(true);
    }
    if (!isVisible) {
      setSoundPlayed(false); // 重置状态以便下次播放
    }
  }, [isVisible, playSound, soundPlayed]);

  // 动画循环
  useEffect(() => {
    if (!isVisible) {
      // 当isVisible为false时，立即清理粒子和状态
      setParticles([]);
      return;
    }

    // 创建粒子
    createParticles();

    const animate = () => {
      setParticles(prevParticles => {
        return prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.5, // 重力效果
          life: particle.life + 1
        })).filter(particle => particle.life < particle.maxLife);
      });
    };

    const intervalId = setInterval(animate, 16); // ~60fps

    // 1秒后结束动画
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setParticles([]);
      onComplete?.();
    }, ANIMATION_DURATION);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      setParticles([]);
    };
  }, [isVisible, onComplete, ANIMATION_DURATION, particleCount, buttonRef, colors]);

  if (!isVisible) return null;

  // 获取按钮位置用于容器定位
  let buttonRect = { left: 0, top: 0, width: 200, height: 100 };
  if (buttonRef?.current) {
    buttonRect = buttonRef.current.getBoundingClientRect();
  }

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{
        left: `${buttonRect.left - 100}px`,
        top: `${buttonRect.top - 50}px`,
        width: `${buttonRect.width + 200}px`,
        height: `${buttonRect.height + 100}px`,
      }}
    >
      {particles.map((particle) => {
        const opacity = Math.max(0, 1 - particle.life / particle.maxLife);
        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x - (buttonRect.left - 100)}px`,
              top: `${particle.y - (buttonRect.top - 50)}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            }}
          />
        );
      })}
    </div>
  );
};

export default CelebrationEffect;