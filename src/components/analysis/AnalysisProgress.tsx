import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmark, IoClose, IoTime } from 'react-icons/io5';
import { AnalysisStep } from '@/types/analysis';

interface AnalysisProgressProps {
  steps: AnalysisStep[];
  currentMessage?: string;
}

export const AnalysisProgress = ({ steps, currentMessage }: AnalysisProgressProps) => {
  const getStepIcon = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return <IoCheckmark className="text-green-500" size={20} />;
      case 'error':
        return <IoClose className="text-red-500" size={20} />;
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full"
          />
        );
      default:
        return <IoTime className="text-gray-400" size={20} />;
    }
  };

  const getStepColor = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'processing':
        return 'border-pink-500 bg-pink-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          AI解析中♡
        </h2>
        {currentMessage && (
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-pink-600 font-medium"
          >
            {currentMessage}
          </motion.p>
        )}
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-2 rounded-xl p-4 transition-all duration-300 ${getStepColor(step.status)}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getStepIcon(step.status)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {step.description}
                </p>
                
                {/* プログレスバー */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {step.progress}% 完了
                  </span>
                  {step.status === 'processing' && (
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 bg-pink-400 rounded-full"
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
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 全体の進捗 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">全体の進捗</span>
          <span className="text-sm text-gray-600">
            {steps.filter(s => s.status === 'completed').length} / {steps.length} 完了
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="h-3 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* キラキラエフェクト */}
      <div className="relative overflow-hidden">
        <AnimatePresence>
          {steps.some(s => s.status === 'processing') && (
            <>
              <motion.div
                className="absolute top-4 right-8 text-yellow-400 text-xl"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute bottom-8 left-8 text-pink-400 text-lg"
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}
              >
                💖
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};