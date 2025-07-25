export interface CharacterTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    gradient: string;
    gradientHeader: string;
    button: string;
    buttonHover: string;
  };
  styles: {
    headerBg: string;
    cardBg: string;
    shadowColor: string;
    accentGradient: string;
    characterGradient: string;
  };
}

export const characterThemes: Record<'kurisu' | 'marin', CharacterTheme> = {
  kurisu: {
    id: 'kurisu',
    name: 'クリス（知的・合理的）',
    colors: {
      primary: '#3B82F6', // 知的な青
      primaryHover: '#2563EB',
      secondary: '#64748B', // 上品なグレー
      accent: '#8B5CF6', // 洗練された紫
      background: 'from-blue-50 via-indigo-50 to-purple-50',
      backgroundSecondary: 'from-slate-50 to-blue-50',
      text: '#1E293B',
      textSecondary: '#475569',
      border: '#E2E8F0',
      gradient: 'from-blue-500 to-indigo-600',
      gradientHeader: 'from-blue-500 to-purple-600',
      button: '#3B82F6',
      buttonHover: '#2563EB'
    },
    styles: {
      headerBg: 'bg-white/90 backdrop-blur-sm border-b border-blue-100',
      cardBg: 'bg-white/80 backdrop-blur-sm',
      shadowColor: 'shadow-blue-100',
      accentGradient: 'from-blue-400 to-indigo-500',
      characterGradient: 'from-blue-400 via-indigo-400 to-purple-400'
    }
  },
  marin: {
    id: 'marin',
    name: 'マリン（トレンド・流行）',
    colors: {
      primary: '#EC4899', // トレンディなピンク
      primaryHover: '#DB2777',
      secondary: '#F97316', // 活発なオレンジ
      accent: '#8B5CF6', // ポップな紫
      background: 'from-pink-50 via-rose-50 to-orange-50',
      backgroundSecondary: 'from-pink-50 to-purple-50',
      text: '#881337',
      textSecondary: '#BE185D',
      border: '#FECACA',
      gradient: 'from-pink-500 to-rose-600',
      gradientHeader: 'from-pink-500 to-orange-500',
      button: '#EC4899',
      buttonHover: '#DB2777'
    },
    styles: {
      headerBg: 'bg-white/90 backdrop-blur-sm border-b border-pink-100',
      cardBg: 'bg-white/80 backdrop-blur-sm',
      shadowColor: 'shadow-pink-100',
      accentGradient: 'from-pink-400 to-rose-500',
      characterGradient: 'from-pink-400 via-rose-400 to-orange-400'
    }
  }
};

export const getCharacterTheme = (personality: 'kurisu' | 'marin'): CharacterTheme => {
  return characterThemes[personality];
};

// Tailwind CSS動的クラス生成用のヘルパー
export const generateThemeClasses = (theme: CharacterTheme) => {
  return {
    // 背景
    bgPrimary: `bg-gradient-to-br ${theme.colors.background}`,
    bgSecondary: `bg-gradient-to-r ${theme.colors.backgroundSecondary}`,
    bgCard: theme.styles.cardBg,
    
    // テキスト
    textPrimary: `text-${theme.colors.text}`,
    textSecondary: `text-${theme.colors.textSecondary}`,
    
    // ボーダー
    border: `border-${theme.colors.border}`,
    
    // ボタン
    button: `bg-${theme.colors.button} hover:bg-${theme.colors.buttonHover}`,
    buttonGradient: `bg-gradient-to-r ${theme.colors.gradient}`,
    
    // グラデーション
    gradient: `bg-gradient-to-r ${theme.colors.gradient}`,
    headerGradient: `bg-gradient-to-r ${theme.colors.gradientHeader}`,
    characterGradient: `bg-gradient-to-br ${theme.styles.characterGradient}`,
    
    // 影
    shadow: theme.styles.shadowColor
  };
};