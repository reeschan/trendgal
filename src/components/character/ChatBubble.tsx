import { motion } from 'framer-motion';

interface ChatBubbleProps {
  message: string;
  position?: 'left' | 'right';
  mood?: 'excited' | 'thinking' | 'happy' | 'surprised' | 'winking';
}

export const ChatBubble = ({ message, position = 'right', mood = 'happy' }: ChatBubbleProps) => {
  const moodStyles = {
    excited: 'bg-gradient-to-br from-pink-100 to-purple-100 border-pink-300',
    thinking: 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300',
    happy: 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300',
    surprised: 'bg-gradient-to-br from-green-100 to-teal-100 border-green-300',
    winking: 'bg-gradient-to-br from-pink-100 to-rose-100 border-pink-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative max-w-xs px-4 py-3 rounded-2xl border-2 ${moodStyles[mood]} shadow-lg`}
    >
      <p className="text-gray-800 font-medium leading-relaxed">
        {message}
      </p>
      
      {/* 吹き出しの尻尾 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
          position === 'left'
            ? '-right-2 border-l-8 border-l-current border-t-8 border-b-8 border-t-transparent border-b-transparent'
            : '-left-2 border-r-8 border-r-current border-t-8 border-b-8 border-t-transparent border-b-transparent'
        } text-pink-300`}
      />
      
      {/* キラキラエフェクト（excited時のみ） */}
      {mood === 'excited' && (
        <>
          <motion.span
            className="absolute -top-1 -right-1 text-yellow-400 text-xs"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            ✨
          </motion.span>
          <motion.span
            className="absolute -bottom-1 -left-1 text-pink-400 text-xs"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            💕
          </motion.span>
        </>
      )}
      
      {/* 考え中の点々（thinking時のみ） */}
      {mood === 'thinking' && (
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-blue-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};