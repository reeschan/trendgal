import { useMemo } from 'react';
import { CharacterTheme, getCharacterTheme, generateThemeClasses } from '@/styles/themes';

export const useTheme = (personality: 'kurisu' | 'marin') => {
  const theme = useMemo(() => getCharacterTheme(personality), [personality]);
  const themeClasses = useMemo(() => generateThemeClasses(theme), [theme]);
  
  return {
    theme,
    themeClasses,
    personality
  };
};