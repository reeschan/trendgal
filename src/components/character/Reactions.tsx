import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ReactionsProps {
  trigger?: boolean;
  type?: 'hearts' | 'sparkles' | 'stars' | 'money';
}

export const Reactions = ({ trigger = false, type = 'hearts' }: ReactionsProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);

  const emojis = {
    hearts: ['💕', '💖', '💗', '💝'],
    sparkles: ['✨', '⭐', '🌟', '💫'],
    stars: ['⭐', '🌟', '✨', '🌠'],
    money: ['💰', '💸', '💎', '🏆']
  };

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojis[type][Math.floor(Math.random() * emojis[type].length)],
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      
      setParticles(newParticles);
      
      // 3秒後にパーティクルをクリア
      setTimeout(() => setParticles([]), 3000);
    }
  }, [trigger, type]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: '50%',
              y: '50%',
              scale: 0,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              scale: [0, 1.5, 1, 0],
              rotate: [0, 180, 360],
              opacity: [0, 1, 1, 0]
            }}
            exit={{
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 2.5,
              ease: 'easeOut',
              times: [0, 0.2, 0.8, 1]
            }}
            className="absolute text-2xl"
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};