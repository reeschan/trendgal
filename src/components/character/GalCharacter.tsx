import { motion } from 'framer-motion';
import { ChatBubble } from './ChatBubble';
import { useState, useEffect } from 'react';

interface GalCharacterProps {
  mood: 'excited' | 'thinking' | 'happy' | 'surprised' | 'winking';
  message?: string;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  avatarPath?: string;
}

export const GalCharacter = ({ 
  mood, 
  message, 
  position = 'right',
  size = 'md',
  avatarPath = '/images/avatar.jpg'
}: GalCharacterProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // avatarPathが変更された時に状態をリセット
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    console.log(`🔄 Loading new avatar: ${avatarPath}`);
  }, [avatarPath]);
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const moodEmojis = {
    excited: '✨',
    thinking: '🤔',
    happy: '😊',
    surprised: '😲',
    winking: '😉'
  };

  const moodColors = {
    excited: 'from-pink-400 to-purple-400',
    thinking: 'from-blue-400 to-indigo-400',
    happy: 'from-yellow-400 to-orange-400',
    surprised: 'from-green-400 to-teal-400',
    winking: 'from-pink-500 to-rose-500'
  };

  const bounceAnimation = {
    excited: { y: [0, -10, 0], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } },
    thinking: { rotate: [-2, 2, -2], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    happy: { scale: [1, 1.1, 1], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
    surprised: { scale: [1, 1.2, 1], y: [0, -5, 0], transition: { duration: 0.5, repeat: 2 } },
    winking: { scale: [1, 0.9, 1], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } }
  };

  return (
    <div className={`flex items-end gap-4 ${position === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
      {message && (
        <ChatBubble 
          message={message} 
          position={position}
          mood={mood}
        />
      )}
      
      <motion.div
        className="relative"
        animate={bounceAnimation[mood]}
      >
        <motion.div
          className={`${sizeClasses[size]} rounded-full shadow-lg flex items-center justify-center relative overflow-hidden border-4 border-white`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {!imageError ? (
            <img 
              src={avatarPath} 
              alt="TrendGal Avatar"
              className="w-full h-full object-cover rounded-full"
              onLoad={() => {
                console.log(`✅ Avatar image loaded successfully: ${avatarPath}`);
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error(`❌ Avatar image failed to load: ${avatarPath}`);
                console.error('Image error details:', {
                  src: e.currentTarget.src,
                  naturalWidth: e.currentTarget.naturalWidth,
                  naturalHeight: e.currentTarget.naturalHeight,
                  complete: e.currentTarget.complete
                });
                setImageError(true);
                setIsLoading(false);
              }}
            />
          ) : (
            // フォールバック: 絵文字アバター
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${moodColors[mood]} rounded-full`}>
              <span className="text-4xl">{moodEmojis[mood]}</span>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          {/* キラキラエフェクト */}
          {mood === 'excited' && (
            <>
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-pink-300 rounded-full"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute top-4 left-2 w-1 h-1 bg-purple-300 rounded-full"
                animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
              />
            </>
          )}
        </motion.div>
        
        {/* 髪の毛っぽい装飾 */}
        <div className="absolute -top-2 -left-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-80"></div>
        <div className="absolute -top-1 -right-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-70"></div>
      </motion.div>
    </div>
  );
};