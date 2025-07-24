import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  favoriteStyles: string[];
  preferredPriceRange: [number, number];
  favoriteColors: string[];
  preferredBrands: string[];
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface UserHistory {
  searchHistory: string[];
  viewedProducts: string[];
  purchaseHistory: string[];
  uploadHistory: {
    id: string;
    timestamp: Date;
    fileName: string;
    results?: any;
  }[];
}

interface UserState {
  // ユーザー基本情報
  userId: string | null;
  nickname: string;
  
  // 設定・好み
  preferences: UserPreferences;
  
  // 履歴
  history: UserHistory;
  
  // セッション情報
  isFirstVisit: boolean;
  lastVisit: Date | null;
  totalSessions: number;
}

interface UserActions {
  // ユーザー情報
  setUserId: (userId: string | null) => void;
  setNickname: (nickname: string) => void;
  
  // 好み設定
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  addFavoriteStyle: (style: string) => void;
  removeFavoriteStyle: (style: string) => void;
  addFavoriteColor: (color: string) => void;
  removeFavoriteColor: (color: string) => void;
  
  // 履歴管理
  addSearchHistory: (query: string) => void;
  addViewedProduct: (productId: string) => void;
  addUploadHistory: (upload: UserHistory['uploadHistory'][0]) => void;
  clearHistory: (type?: keyof UserHistory) => void;
  
  // セッション管理
  markVisit: () => void;
  resetFirstVisit: () => void;
  
  // リセット
  resetUser: () => void;
}

type UserStore = UserState & UserActions;

const initialPreferences: UserPreferences = {
  favoriteStyles: [],
  preferredPriceRange: [0, 5000],
  favoriteColors: [],
  preferredBrands: [],
  notifications: true,
  theme: 'light'
};

const initialHistory: UserHistory = {
  searchHistory: [],
  viewedProducts: [],
  purchaseHistory: [],
  uploadHistory: []
};

const initialState: UserState = {
  userId: null,
  nickname: 'ゲスト',
  preferences: initialPreferences,
  history: initialHistory,
  isFirstVisit: true,
  lastVisit: null,
  totalSessions: 0
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ユーザー情報
      setUserId: (userId) => set({ userId }),
      
      setNickname: (nickname) => set({ nickname }),

      // 好み設定
      updatePreferences: (newPreferences) => set((state) => ({
        preferences: { ...state.preferences, ...newPreferences }
      })),

      addFavoriteStyle: (style) => set((state) => ({
        preferences: {
          ...state.preferences,
          favoriteStyles: [...new Set([...state.preferences.favoriteStyles, style])]
        }
      })),

      removeFavoriteStyle: (style) => set((state) => ({
        preferences: {
          ...state.preferences,
          favoriteStyles: state.preferences.favoriteStyles.filter(s => s !== style)
        }
      })),

      addFavoriteColor: (color) => set((state) => ({
        preferences: {
          ...state.preferences,
          favoriteColors: [...new Set([...state.preferences.favoriteColors, color])]
        }
      })),

      removeFavoriteColor: (color) => set((state) => ({
        preferences: {
          ...state.preferences,
          favoriteColors: state.preferences.favoriteColors.filter(c => c !== color)
        }
      })),

      // 履歴管理
      addSearchHistory: (query) => set((state) => ({
        history: {
          ...state.history,
          searchHistory: [
            query,
            ...state.history.searchHistory.filter(q => q !== query)
          ].slice(0, 50) // 最新50件を保持
        }
      })),

      addViewedProduct: (productId) => set((state) => ({
        history: {
          ...state.history,
          viewedProducts: [
            productId,
            ...state.history.viewedProducts.filter(id => id !== productId)
          ].slice(0, 100) // 最新100件を保持
        }
      })),

      addUploadHistory: (upload) => set((state) => ({
        history: {
          ...state.history,
          uploadHistory: [upload, ...state.history.uploadHistory].slice(0, 20) // 最新20件を保持
        }
      })),

      clearHistory: (type) => set((state) => {
        if (type) {
          return {
            history: {
              ...state.history,
              [type]: type === 'uploadHistory' ? [] : []
            }
          };
        }
        return { history: initialHistory };
      }),

      // セッション管理
      markVisit: () => set((state) => ({
        isFirstVisit: false,
        lastVisit: new Date(),
        totalSessions: state.totalSessions + 1
      })),

      resetFirstVisit: () => set({ isFirstVisit: false }),

      // リセット
      resetUser: () => set(initialState)
    }),
    {
      name: 'trendgal-user-store',
      partialize: (state) => ({
        userId: state.userId,
        nickname: state.nickname,
        preferences: state.preferences,
        history: state.history,
        isFirstVisit: state.isFirstVisit,
        lastVisit: state.lastVisit,
        totalSessions: state.totalSessions
      })
    }
  )
);