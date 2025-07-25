import { useState } from 'react';
import { DetectedItem, Product } from '@/types/product';
import { GoogleVisionResponse } from '@/types/analysis';

interface UseStreamingAnalysisReturn {
  analyzeImageStreaming: (file: File, characterPersonality?: 'kurisu' | 'marin') => Promise<void>;
  isVisionAnalyzing: boolean;
  isRecommendationLoading: boolean;
  error: string | null;
}

export function useStreamingAnalysis(
  onVisionComplete: (items: DetectedItem[], visionResult: GoogleVisionResponse) => void,
  onRecommendationComplete: (products: Product[]) => void,
  onError: (error: string) => void
): UseStreamingAnalysisReturn {
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImageStreaming = async (file: File, characterPersonality?: 'kurisu' | 'marin') => {
    try {
      setError(null);
      setIsVisionAnalyzing(true);
      
      // 画像をBase64に変換
      const base64 = await fileToBase64(file);
      
      console.log('🔍 Starting Vision API analysis...');
      
      // Step 1: Vision API解析（即座に結果を表示）
      const visionResponse = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          filename: file.name
        })
      });
      
      if (!visionResponse.ok) {
        throw new Error(`Vision API failed: ${visionResponse.status}`);
      }
      
      const visionData = await visionResponse.json();
      
      if (!visionData.success) {
        throw new Error(visionData.error || 'Vision analysis failed');
      }
      
      console.log('✅ Vision analysis completed immediately');
      setIsVisionAnalyzing(false);
      
      // Vision結果を即座に表示
      onVisionComplete(visionData.data.detectedItems, visionData.visionResult);
      
      // Step 2: 商品推薦を非同期で取得（スケルトン表示）
      setIsRecommendationLoading(true);
      console.log('🛍️ Starting product recommendation search...');
      
      const recommendationResponse = await fetch('/api/get-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          detectedItems: visionData.data.detectedItems,
          visionResult: visionData.visionResult,
          characterPersonality
        })
      });
      
      if (!recommendationResponse.ok) {
        throw new Error(`Recommendation API failed: ${recommendationResponse.status}`);
      }
      
      const recommendationData = await recommendationResponse.json();
      
      if (!recommendationData.success) {
        throw new Error(recommendationData.error || 'Recommendation search failed');
      }
      
      console.log('✅ Product recommendations completed');
      setIsRecommendationLoading(false);
      
      // 商品推薦結果を表示
      onRecommendationComplete(recommendationData.data.recommendations);
      
    } catch (err) {
      console.error('❌ Streaming analysis error:', err);
      setIsVisionAnalyzing(false);
      setIsRecommendationLoading(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  return {
    analyzeImageStreaming,
    isVisionAnalyzing,
    isRecommendationLoading,
    error
  };
}

// Helper function to convert File to Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}