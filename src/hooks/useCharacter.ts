import { useState, useEffect, useCallback } from 'react';
import { Character, CHARACTERS, CHARACTER_MESSAGES, CHARACTER_TITLES, CHARACTER_SECTION_TITLES } from '@/types/character';

export const useCharacter = () => {
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);

  // 初回訪問時にランダムでキャラクターを選択
  useEffect(() => {
    const savedCharacterId = localStorage.getItem('trendgal_character');
    
    if (savedCharacterId) {
      // 保存されたキャラクターがあれば使用
      const savedCharacter = CHARACTERS.find(char => char.id === savedCharacterId);
      if (savedCharacter) {
        setCurrentCharacter(savedCharacter);
        return;
      }
    }
    
    // ランダムでキャラクターを選択
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    const selectedCharacter = CHARACTERS[randomIndex];
    setCurrentCharacter(selectedCharacter);
    localStorage.setItem('trendgal_character', selectedCharacter.id);
  }, []);

  // キャラクターを手動で変更する関数
  const changeCharacter = (characterId: string) => {
    const character = CHARACTERS.find(char => char.id === characterId);
    if (character) {
      setCurrentCharacter(character);
      localStorage.setItem('trendgal_character', character.id);
    }
  };

  // メッセージを取得する関数
  const getMessage = useCallback((type: keyof typeof CHARACTER_MESSAGES.kurisu) => {
    if (!currentCharacter) return '';
    return CHARACTER_MESSAGES[currentCharacter.personality][type];
  }, [currentCharacter]);

  // タイトル情報を取得する関数
  const getTitles = useCallback(() => {
    if (!currentCharacter) return CHARACTER_TITLES.kurisu;
    return CHARACTER_TITLES[currentCharacter.personality];
  }, [currentCharacter]);

  // セクションタイトルを取得する関数
  const getSectionTitles = useCallback(() => {
    if (!currentCharacter) return CHARACTER_SECTION_TITLES.kurisu;
    return CHARACTER_SECTION_TITLES[currentCharacter.personality];
  }, [currentCharacter]);

  // ランダムで新しいキャラクターを選択
  const randomizeCharacter = () => {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
    const selectedCharacter = CHARACTERS[randomIndex];
    setCurrentCharacter(selectedCharacter);
    localStorage.setItem('trendgal_character', selectedCharacter.id);
  };

  return {
    currentCharacter,
    allCharacters: CHARACTERS,
    changeCharacter,
    randomizeCharacter,
    getMessage,
    getTitles,
    getSectionTitles
  };
};