import { useState } from 'react';
import { DetectedItem, Product } from '@/types/product';
import { GoogleVisionResponse } from '@/types/analysis';

interface UseStreamingAnalysisReturn {
  analyzeImageStreaming: (file: File, characterPersonality?: 'kurisu' | 'marin') => Promise<void>;
  isVisionAnalyzing: boolean;
  isRecommendationLoading: boolean;
  error: string | null;
  progress: { current: number; total: number; percentage: number; currentItem: string } | null;
}

export function useStreamingAnalysis(
  onVisionComplete: (items: DetectedItem[], visionResult: GoogleVisionResponse) => void,
  onRecommendationComplete: (products: Product[]) => void,
  onError: (error: string) => void
): UseStreamingAnalysisReturn {
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; percentage: number; currentItem: string } | null>(null);

  const analyzeImageStreaming = async (file: File, characterPersonality?: 'kurisu' | 'marin') => {
    try {
      setError(null);
      setIsVisionAnalyzing(true);
      
      // 画像をBase64に変換
      const base64 = await fileToBase64(file);
      
      console.log('🔍 Starting Vision API analysis with streaming...');
      
      // Step 1: Vision API解析（ストリーミングでプログレス表示）
      const visionResponse = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          filename: file.name,
          streaming: true
        })
      });
      
      if (!visionResponse.ok) {
        throw new Error(`Vision API failed: ${visionResponse.status}`);
      }

      // SSEストリームを読み取り
      const reader = visionResponse.body?.getReader();
      const decoder = new TextDecoder();
      let visionData: any = null;

      console.log('📡 Starting SSE stream read...');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('📡 SSE stream ended');
            break;
          }

          const chunk = decoder.decode(value);
          console.log('📡 Received chunk:', chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            console.log('📡 Processing line:', line);
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('📡 Parsed data:', data);
                const eventLine = lines[lines.indexOf(line) - 1];
                console.log('📡 Event line:', eventLine);
                
                if (eventLine?.startsWith('event: ')) {
                  const eventType = eventLine.slice(7);
                  console.log('📡 Event type:', eventType);
                  
                  switch (eventType) {
                    case 'start':
                      console.log('🔍 Vision analysis started:', data.message);
                      const startProgress = { current: 0, total: 1, percentage: 0, currentItem: 'Vision API解析中...' };
                      console.log('📊 Setting progress (start):', startProgress);
                      setProgress(startProgress);
                      break;
                      
                    case 'vision-complete':
                      console.log('✅ Vision API completed:', data);
                      const visionProgress = { current: 0, total: 1, percentage: 10, currentItem: 'アイテム検出中...' };
                      console.log('📊 Setting progress (vision-complete):', visionProgress);
                      setProgress(visionProgress);
                      break;
                      
                    case 'progress':
                      console.log('📊 Progress event received:', data);
                      const progressUpdate = {
                        current: data.current,
                        total: data.total,
                        percentage: data.percentage,
                        currentItem: data.currentItem
                      };
                      console.log('📊 Setting progress (progress):', progressUpdate);
                      setProgress(progressUpdate);
                      break;
                      
                    case 'complete':
                      console.log('✅ Vision analysis completed');
                      visionData = data;
                      setProgress({ current: data.data.progressStats.totalItemsDetected, total: data.data.progressStats.totalItemsDetected, percentage: 100, currentItem: '完了!' });
                      break;
                      
                    case 'error':
                      throw new Error(data.error);
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      }
      
      if (!visionData || !visionData.success) {
        throw new Error('Vision analysis failed');
      }
      
      setIsVisionAnalyzing(false);
      setProgress(null);
      
      // Vision結果を表示
      onVisionComplete(visionData.data.detectedItems, visionData.visionResult || {});
      
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
    error,
    progress
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