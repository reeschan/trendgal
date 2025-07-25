import { useState, useEffect, useCallback } from 'react';
import { Character, CHARACTERS, CHARACTER_MESSAGES, CHARACTER_TITLES, CHARACTER_SECTION_TITLES } from '@/types/character';

export const useCharacter = () => {
  // 初期値をマリン（avatar2.png）に設定して確実にアイコンが表示されるようにする
  const [currentCharacter, setCurrentCharacter] = useState<Character>(() => {
    // マリンをデフォルトとして使用（avatar2.pngが確実に存在する）
    return CHARACTERS.find(char => char.id === 'marin') || CHARACTERS[1];
  });

  // ローカルストレージから設定を読み込み（初期表示後に変更）
  useEffect(() => {
    const savedCharacterId = localStorage.getItem('trendgal_character');
    
    if (savedCharacterId) {
      // 保存されたキャラクターがあれば使用
      const savedCharacter = CHARACTERS.find(char => char.id === savedCharacterId);
      if (savedCharacter && savedCharacter.id !== currentCharacter.id) {
        setCurrentCharacter(savedCharacter);
      }
    } else {
      // 初回訪問時は現在のキャラクター（マリン）をローカルストレージに保存
      localStorage.setItem('trendgal_character', currentCharacter.id);
    }
  }, [currentCharacter.id]);

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
    // currentCharacterは常に存在するためnullチェック不要
    return CHARACTER_MESSAGES[currentCharacter.personality][type];
  }, [currentCharacter]);

  // タイトル情報を取得する関数
  const getTitles = useCallback(() => {
    // currentCharacterは常に存在するためnullチェック不要
    return CHARACTER_TITLES[currentCharacter.personality];
  }, [currentCharacter]);

  // セクションタイトルを取得する関数
  const getSectionTitles = useCallback(() => {
    // currentCharacterは常に存在するためnullチェック不要
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