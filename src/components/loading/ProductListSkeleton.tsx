import { motion } from 'framer-motion';

interface ProductListSkeletonProps {
  count?: number;
}

export const ProductListSkeleton = ({ count = 6 }: ProductListSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} delay={index * 0.1} />
      ))}
    </div>
  );
};

const ProductCardSkeleton = ({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl shadow-md overflow-hidden"
    >
      {/* 商品画像スケルトン */}
      <div className="relative aspect-square bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
      </div>
      
      {/* 商品情報スケルトン */}
      <div className="p-4 space-y-3">
        {/* 商品名 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
        
        {/* 価格 */}
        <div className="flex items-center gap-2">
          <div className="h-6 bg-red-100 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        
        {/* ショップ名 */}
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        
        {/* 評価・レビュー */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
        
        {/* タグ */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};

export const ProductRecommendationSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-6">
        {/* タイトルスケルトン */}
        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-80 mx-auto animate-pulse" />
      </div>

      {/* Geminiクエリ情報スケルトン */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-purple-200 rounded animate-pulse" />
          <div className="h-5 bg-purple-200 rounded w-40 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-purple-200 rounded-full animate-pulse" />
              <div className="h-4 bg-purple-200 rounded flex-1 animate-pulse" />
              <div className="h-4 bg-purple-200 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 商品リストスケルトン */}
      <ProductListSkeleton count={6} />
      
      {/* 読み込み中メッセージ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-8"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full"
          />
          <span className="text-pink-700 font-medium">
            🤖 Geminiが最適な商品を検索中...
          </span>
        </div>
      </motion.div>
    </div>
  );
};