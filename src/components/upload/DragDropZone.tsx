import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUpload, IoImage } from 'react-icons/io5';

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // MB
  isLoading?: boolean;
}

export const DragDropZone = ({ 
  onFileSelect, 
  accept = 'image/*', 
  maxSize = 5,
  isLoading = false 
}: DragDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルのみアップロード可能です');
      return false;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      setError(`ファイルサイズは${maxSize}MB以下にしてください`);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, maxSize]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
        isDragOver 
          ? 'border-pink-500 bg-pink-50' 
          : 'border-gray-300 hover:border-pink-400 hover:bg-pink-25'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      <motion.div
        animate={{ scale: isDragOver ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {isDragOver ? (
          <IoImage className="mx-auto h-16 w-16 text-pink-500 mb-4" />
        ) : (
          <IoCloudUpload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        )}
        
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          {isDragOver ? '画像をドロップしてね♡' : '画像をアップロードしてね♡'}
        </h3>
        
        <p className="text-gray-500 mb-4">
          ドラッグ&ドロップ or クリックして選択
        </p>
        
        <p className="text-sm text-gray-400">
          JPG, PNG, GIF (最大{maxSize}MB)
        </p>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};