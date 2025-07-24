import { useState } from 'react';
import { AnalysisResult } from '@/types/product';

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (file: File): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // ファイルをBase64に変換
      const base64 = await fileToBase64(file);
      const imageBase64 = base64.split(',')[1]; // data:image/jpeg;base64, を除去
      
      console.log('Sending image for analysis:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

      // API呼び出し
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          filename: file.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      console.log('Analysis successful:', data.data);
      setResult(data.data);
      return data.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Analysis failed:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return { 
    analyzeImage, 
    isAnalyzing, 
    result, 
    error,
    reset
  };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};