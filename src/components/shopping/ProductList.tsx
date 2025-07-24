import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { useState } from 'react';
import { Button } from '../common/Button';
import { IoGrid, IoList, IoFunnel } from 'react-icons/io5';

interface ProductListProps {
  products: Product[];
  isLoading?: boolean;
  onProductSelect?: (product: Product) => void;
  showFilters?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'similarity' | 'price' | 'rating' | 'popularity';

export const ProductList = ({ 
  products, 
  isLoading = false, 
  onProductSelect,
  showFilters = true 
}: ProductListProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('similarity');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const sortProducts = (products: Product[], sortBy: SortOption): Product[] => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'similarity':
          return (b.similarity || 0) - (a.similarity || 0);
        case 'price':
          return a.price - b.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popularity':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return 0;
      }
    });
  };

  const filteredProducts = sortProducts(
    products.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    ),
    sortBy
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルター・ソートバー */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 表示切り替え */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <IoGrid size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <IoList size={16} />
              </Button>
            </div>
            
            {/* ソート */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">並び順:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="similarity">類似度順</option>
                <option value="price">価格順</option>
                <option value="rating">評価順</option>
                <option value="popularity">人気順</option>
              </select>
            </div>
            
            {/* フィルターボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <IoFunnel size={16} />
              フィルター
            </Button>
          </div>
          
          {/* フィルターメニュー */}
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      価格帯: ¥{priceRange[0]} - ¥{priceRange[1]}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* 商品一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            プチプラ商品 ({filteredProducts.length}件)
          </h2>
        </div>
        
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard
                  product={product}
                  onSelect={onProductSelect}
                  showSimilarity={sortBy === 'similarity'}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">😅</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              該当する商品が見つかりませんでした
            </h3>
            <p className="text-gray-500">
              フィルター条件を変更してみてください
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};