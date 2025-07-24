import { motion } from 'framer-motion';
import { useState } from 'react';

interface PriceFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export const PriceFilter = ({ 
  min, 
  max, 
  value, 
  onChange, 
  step = 100 
}: PriceFilterProps) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.max(min, Math.min(newMin, value[1] - step));
    onChange([clampedMin, value[1]]);
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.min(max, Math.max(newMax, value[0] + step));
    onChange([value[0], clampedMax]);
  };

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">価格帯</label>
        <span className="text-sm text-gray-600">
          {formatPrice(value[0])} - {formatPrice(value[1])}
        </span>
      </div>
      
      {/* カスタムスライダー */}
      <div className="relative">
        {/* トラック */}
        <div className="h-2 bg-gray-200 rounded-full relative">
          <motion.div
            className="absolute h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
            style={{
              left: `${getPercentage(value[0])}%`,
              width: `${getPercentage(value[1]) - getPercentage(value[0])}%`
            }}
            layout
          />
        </div>
        
        {/* ハンドル */}
        <motion.div
          className={`absolute w-6 h-6 bg-white border-2 border-pink-400 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 -translate-x-1/2 ${
            isDragging === 'min' ? 'scale-110 border-pink-600' : ''
          }`}
          style={{
            left: `${getPercentage(value[0])}%`,
            top: '50%'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.2 }}
          onMouseDown={() => setIsDragging('min')}
        />
        
        <motion.div
          className={`absolute w-6 h-6 bg-white border-2 border-pink-400 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 -translate-x-1/2 ${
            isDragging === 'max' ? 'scale-110 border-pink-600' : ''
          }`}
          style={{
            left: `${getPercentage(value[1])}%`,
            top: '50%'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.2 }}
          onMouseDown={() => setIsDragging('max')}
        />
        
        {/* 隠しinput */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => handleMinChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => handleMaxChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      
      {/* 入力フィールド */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">最小価格</label>
          <input
            type="number"
            min={min}
            max={value[1] - step}
            step={step}
            value={value[0]}
            onChange={(e) => handleMinChange(parseInt(e.target.value) || min)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div className="text-gray-400 mt-6">〜</div>
        
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">最大価格</label>
          <input
            type="number"
            min={value[0] + step}
            max={max}
            step={step}
            value={value[1]}
            onChange={(e) => handleMaxChange(parseInt(e.target.value) || max)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>
      
      {/* プリセットボタン */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: '〜1000円', range: [0, 1000] as [number, number] },
          { label: '1000〜3000円', range: [1000, 3000] as [number, number] },
          { label: '3000〜5000円', range: [3000, 5000] as [number, number] },
          { label: '5000円〜', range: [5000, max] as [number, number] }
        ].map((preset) => (
          <motion.button
            key={preset.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(preset.range)}
            className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
          >
            {preset.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};