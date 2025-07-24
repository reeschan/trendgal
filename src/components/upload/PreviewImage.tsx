import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import Image from 'next/image';

interface PreviewImageProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export const PreviewImage = ({ file, onRemove, className = '' }: PreviewImageProps) => {
  const imageUrl = URL.createObjectURL(file);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative rounded-2xl overflow-hidden shadow-lg ${className}`}
    >
      <div className="relative w-full h-64">
        <Image
          src={imageUrl}
          alt="プレビュー画像"
          fill
          className="object-cover"
          onLoad={() => URL.revokeObjectURL(imageUrl)}
        />
      </div>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
      >
        <IoClose size={20} />
      </motion.button>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-white text-sm font-medium truncate">
          {file.name}
        </p>
        <p className="text-white/80 text-xs">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </motion.div>
  );
};