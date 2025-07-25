import { motion } from "framer-motion";
import {
  IoHeart,
  IoHeartOutline,
  IoStar,
  IoArrowForward,
} from "react-icons/io5";
import { Product } from "@/types/product";
import Image from "next/image";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  showSimilarity?: boolean;
}

export const ProductCard = ({
  product,
  onSelect,
  showSimilarity = true,
}: ProductCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(product);
    } else {
      window.open(product.shopUrl, "_blank");
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "text-green-600 bg-green-100";
    if (similarity >= 80) return "text-blue-600 bg-blue-100";
    if (similarity >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 画像エリア */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={`object-cover transition-all duration-300 group-hover:scale-110 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        )}

        {/* セール・新着バッジ */}
        {product.isOnSale && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold"
          >
            SALE
          </motion.div>
        )}

        {/* 類似度バッジ */}
        {showSimilarity && product.similarity && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getSimilarityColor(
              product.similarity
            )}`}
          >
            {product.similarity * 100}%
          </motion.div>
        )}

        {/* お気に入りボタン */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFavoriteClick}
          className="absolute bottom-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
        >
          {isFavorited ? (
            <IoHeart className="text-red-500" size={20} />
          ) : (
            <IoHeartOutline className="text-gray-600" size={20} />
          )}
        </motion.button>
      </div>

      {/* 商品情報エリア */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>

        {/* 価格 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold text-pink-600">
            ¥{product.price.toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-500 line-through">
              ¥{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* レーティング */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <IoStar
                  key={star}
                  className={`text-sm ${
                    star <= Math.floor(product.rating!)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* ショップ名 */}
        <p className="text-sm text-gray-600 mb-3">{product.shopName}</p>

        {/* タグ */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* アクションボタン */}
        <motion.div
          whileHover={{ x: 5 }}
          className="flex items-center justify-between text-pink-600 group-hover:text-pink-700 transition-colors"
        >
          <span className="font-medium text-sm">詳細を見る</span>
          <IoArrowForward size={16} />
        </motion.div>
      </div>
    </motion.div>
  );
};
