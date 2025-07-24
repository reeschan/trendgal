import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropZone } from './DragDropZone';
import { PreviewImage } from './PreviewImage';
import { Button } from '../common/Button';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isAnalyzing?: boolean;
}

export const ImageUploader = ({ onUpload, isAnalyzing = false }: ImageUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DragDropZone 
              onFileSelect={handleFileSelect} 
              isLoading={isAnalyzing}
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <PreviewImage 
              file={selectedFile} 
              onRemove={handleRemoveFile}
            />
            
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                disabled={isAnalyzing}
              >
                画像を変更
              </Button>
              
              <Button
                variant="primary"
                onClick={handleAnalyze}
                isLoading={isAnalyzing}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? '解析中...' : '解析開始♡'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};