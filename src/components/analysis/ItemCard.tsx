import { motion } from 'framer-motion';
import { DetectedItem } from '@/types/product';
import { IoShirt, IoMedal, IoFootsteps, IoWatch, IoInformationCircle } from 'react-icons/io5';

interface ItemCardProps {
  item: DetectedItem;
  index: number;
  onItemClick?: (item: DetectedItem) => void;
  compact?: boolean;
}

export const ItemCard = ({ item, index, onItemClick, compact = false }: ItemCardProps) => {
  const getItemIcon = (type: DetectedItem['type']) => {
    switch (type) {
      case 'tops':
        return <IoShirt size={compact ? 16 : 20} />;
      case 'bottoms':
        return <IoMedal size={compact ? 16 : 20} />;
      case 'shoes':
        return <IoFootsteps size={compact ? 16 : 20} />;
      case 'accessories':
        return <IoWatch size={compact ? 16 : 20} />;
      case 'dress':
        return <IoShirt size={compact ? 16 : 20} />;
      case 'outer':
        return <IoShirt size={compact ? 16 : 20} />;
      default:
        return <IoShirt size={compact ? 16 : 20} />;
    }
  };

  const getItemGradient = (type: DetectedItem['type']) => {
    switch (type) {
      case 'tops':
        return 'from-pink-400 to-rose-400';
      case 'bottoms':
        return 'from-blue-400 to-indigo-400';
      case 'shoes':
        return 'from-purple-400 to-violet-400';
      case 'accessories':
        return 'from-yellow-400 to-orange-400';
      case 'dress':
        return 'from-rose-400 to-pink-400';
      case 'outer':
        return 'from-indigo-400 to-blue-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getTypeLabel = (type: DetectedItem['type']) => {
    switch (type) {
      case 'tops':
        return 'トップス';
      case 'bottoms':
        return 'ボトムス';
      case 'shoes':
        return 'シューズ';
      case 'accessories':
        return 'アクセサリー';
      case 'dress':
        return 'ワンピース';
      case 'outer':
        return 'アウター';
      default:
        return 'その他';
    }
  };

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="bg-white rounded-lg shadow-md p-3 cursor-pointer border border-gray-200 hover:border-pink-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full bg-gradient-to-r ${getItemGradient(item.type)} text-white`}>
            {getItemIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-800 truncate">
              {getTypeLabel(item.type)}
            </h4>
            <p className="text-xs text-gray-600 truncate">
              {item.description}
            </p>
          </div>
          <div className="text-xs font-bold text-green-600">
            {Math.round(item.confidence * 100)}%
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer border border-gray-200 hover:border-pink-300 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <motion.div
          whileHover={{ rotate: 5 }}
          className={`p-3 rounded-full bg-gradient-to-r ${getItemGradient(item.type)} text-white shadow-lg`}
        >
          {getItemIcon(item.type)}
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-pink-600 transition-colors">
              {getTypeLabel(item.type)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-green-600">
                {Math.round(item.confidence * 100)}%
              </span>
              <IoInformationCircle className="text-gray-400" size={16} />
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 leading-relaxed">
            {item.description}
          </p>
          
          {/* 属性タグ */}
          <div className="space-y-3">
            {/* カラーパレット */}
            {item.attributes.colors.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 min-w-max">カラー:</span>
                <div className="flex gap-2">
                  {item.attributes.colors.map((color, colorIndex) => (
                    <motion.div
                      key={colorIndex}
                      whileHover={{ scale: 1.2 }}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 属性タグ */}
            <div className="flex flex-wrap gap-2">
              {item.attributes.style && (
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                  {item.attributes.style}
                </span>
              )}
              {item.attributes.length && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {item.attributes.length}
                </span>
              )}
              {item.attributes.sleeve && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {item.attributes.sleeve}
                </span>
              )}
              {item.attributes.pattern && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {item.attributes.pattern}
                </span>
              )}
              {item.attributes.season && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {item.attributes.season}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};