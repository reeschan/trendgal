import { motion } from 'framer-motion';
import { DetectedItem } from '@/types/product';
import { IoShirt, IoMedal, IoFootsteps, IoWatch } from 'react-icons/io5';

interface DetectedItemsProps {
  items: DetectedItem[];
  imageUrl?: string;
}

export const DetectedItems = ({ items, imageUrl }: DetectedItemsProps) => {
  const getItemIcon = (type: DetectedItem['type']) => {
    switch (type) {
      case 'tops':
        return <IoShirt size={24} />;
      case 'bottoms':
        return <IoMedal size={24} />;
      case 'shoes':
        return <IoFootsteps size={24} />;
      case 'accessories':
        return <IoWatch size={24} />;
      case 'dress':
        return <IoShirt size={24} />;
      case 'outer':
        return <IoShirt size={24} />;
      default:
        return <IoShirt size={24} />;
    }
  };

  const getItemColor = (type: DetectedItem['type']) => {
    switch (type) {
      case 'tops':
        return 'bg-pink-100 text-pink-600 border-pink-300';
      case 'bottoms':
        return 'bg-blue-100 text-blue-600 border-blue-300';
      case 'shoes':
        return 'bg-purple-100 text-purple-600 border-purple-300';
      case 'accessories':
        return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      case 'dress':
        return 'bg-rose-100 text-rose-600 border-rose-300';
      case 'outer':
        return 'bg-indigo-100 text-indigo-600 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            検出されたアイテム✨
          </h2>
          <p className="text-gray-600">
            AI が画像から {items.length} 個のファッションアイテムを検出しました
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 画像表示エリア（バウンディングボックス付き） */}
            {imageUrl && (
              <div className="relative">
                <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                  <img
                    src={imageUrl}
                    alt="解析対象画像"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* バウンディングボックス */}
                  {items.map((item, index) => 
                    item.boundingBox && (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.2 }}
                        className="absolute border-2 border-pink-500 bg-pink-500/20 rounded"
                        style={{
                          left: `${item.boundingBox.x * 100}%`,
                          top: `${item.boundingBox.y * 100}%`,
                          width: `${item.boundingBox.width * 100}%`,
                          height: `${item.boundingBox.height * 100}%`
                        }}
                      >
                        <div className="absolute -top-8 left-0 bg-pink-500 text-white px-2 py-1 rounded text-xs font-bold">
                          {getTypeLabel(item.type)}
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* アイテムリスト */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-2 rounded-xl p-4 ${getItemColor(item.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">
                          {getTypeLabel(item.type)}
                        </h3>
                        <span className={`text-sm font-bold ${getConfidenceColor(item.confidence)}`}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">
                        {item.description}
                      </p>
                      
                      {/* 属性情報 */}
                      <div className="space-y-2">
                        {item.attributes.colors.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">色:</span>
                            <div className="flex gap-1">
                              {item.attributes.colors.map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {item.attributes.style && (
                            <span className="px-2 py-1 bg-white/60 rounded-full text-xs font-medium">
                              {item.attributes.style}
                            </span>
                          )}
                          {item.attributes.length && (
                            <span className="px-2 py-1 bg-white/60 rounded-full text-xs font-medium">
                              {item.attributes.length}
                            </span>
                          )}
                          {item.attributes.sleeve && (
                            <span className="px-2 py-1 bg-white/60 rounded-full text-xs font-medium">
                              {item.attributes.sleeve}
                            </span>
                          )}
                          {item.attributes.pattern && (
                            <span className="px-2 py-1 bg-white/60 rounded-full text-xs font-medium">
                              {item.attributes.pattern}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};