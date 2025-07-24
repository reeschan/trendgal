import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Product, DetectedItem, AnalysisResult } from '@/types/product';
import { AnalysisStep } from '@/types/analysis';
import { GalMessage } from '@/types/api';

interface AppState {
  // UI状態
  isAnalyzing: boolean;
  currentStep: string | null;
  showResults: boolean;
  
  // 解析関連
  uploadedImage: File | null;
  analysisSteps: AnalysisStep[];
  detectedItems: DetectedItem[];
  analysisResult: AnalysisResult | null;
  
  // 商品関連
  recommendedProducts: Product[];
  selectedProduct: Product | null;
  favorites: string[];
  
  // ギャルキャラクター
  currentMessage: GalMessage | null;
  messageHistory: GalMessage[];
  
  // フィルター・ソート
  priceRange: [number, number];
  sortBy: string;
  selectedCategories: string[];
}

interface AppActions {
  // 画像アップロード
  setUploadedImage: (image: File | null) => void;
  
  // 解析制御
  startAnalysis: () => void;
  updateAnalysisStep: (stepId: string, update: Partial<AnalysisStep>) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  resetAnalysis: () => void;
  
  // 商品関連
  setRecommendedProducts: (products: Product[]) => void;
  selectProduct: (product: Product | null) => void;
  toggleFavorite: (productId: string) => void;
  
  // ギャルメッセージ
  setCurrentMessage: (message: GalMessage | null) => void;
  addMessage: (message: GalMessage) => void;
  clearMessages: () => void;
  
  // フィルター・ソート
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sortBy: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  
  // リセット
  resetAll: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  isAnalyzing: false,
  currentStep: null,
  showResults: false,
  
  uploadedImage: null,
  analysisSteps: [],
  detectedItems: [],
  analysisResult: null,
  
  recommendedProducts: [],
  selectedProduct: null,
  favorites: [],
  
  currentMessage: null,
  messageHistory: [],
  
  priceRange: [0, 10000],
  sortBy: 'similarity',
  selectedCategories: []
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 画像アップロード
      setUploadedImage: (image) => set({ uploadedImage: image }),

      // 解析制御
      startAnalysis: () => set({ 
        isAnalyzing: true, 
        showResults: false,
        analysisResult: null,
        detectedItems: [],
        recommendedProducts: []
      }),

      updateAnalysisStep: (stepId, update) => set((state) => ({
        analysisSteps: state.analysisSteps.map(step =>
          step.id === stepId ? { ...step, ...update } : step
        )
      })),

      setAnalysisResult: (result) => set({
        analysisResult: result,
        detectedItems: result.detectedItems,
        recommendedProducts: result.recommendations,
        isAnalyzing: false,
        showResults: true
      }),

      resetAnalysis: () => set({
        isAnalyzing: false,
        currentStep: null,
        showResults: false,
        analysisSteps: [],
        detectedItems: [],
        analysisResult: null,
        recommendedProducts: []
      }),

      // 商品関連
      setRecommendedProducts: (products) => set({ recommendedProducts: products }),

      selectProduct: (product) => set({ selectedProduct: product }),

      toggleFavorite: (productId) => set((state) => ({
        favorites: state.favorites.includes(productId)
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId]
      })),

      // ギャルメッセージ
      setCurrentMessage: (message) => set({ currentMessage: message }),

      addMessage: (message) => set((state) => ({
        messageHistory: [...state.messageHistory, message],
        currentMessage: message
      })),

      clearMessages: () => set({
        currentMessage: null,
        messageHistory: []
      }),

      // フィルター・ソート
      setPriceRange: (range) => set({ priceRange: range }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSelectedCategories: (categories) => set({ selectedCategories: categories }),

      // リセット
      resetAll: () => set(initialState)
    }),
    {
      name: 'trendgal-store'
    }
  )
);