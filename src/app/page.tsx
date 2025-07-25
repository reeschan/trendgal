'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { GalCharacter } from '@/components/character/GalCharacter';
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress';
import { DetectedItems } from '@/components/analysis/DetectedItems';
import { ProductList } from '@/components/shopping/ProductList';
import { ProductRecommendationSkeleton } from '@/components/loading/ProductListSkeleton';
import { useAppStore } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { mockAnalysisSteps, mockAnalysisResult, createCharacterMessages } from '@/services/mock/mockData';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useStreamingAnalysis } from '@/hooks/useStreamingAnalysis';
import { useCharacter } from '@/hooks/useCharacter';
import { useTheme } from '@/hooks/useTheme';
import { CHARACTER_MESSAGES } from '@/types/character';

export default function Home() {
  const {
    isAnalyzing,
    showResults,
    uploadedImage,
    analysisSteps,
    analysisResult,
    recommendedProducts,
    currentMessage,
    detectedItems,
    visionAnalysisComplete,
    isLoadingRecommendations,
    setUploadedImage,
    startAnalysis,
    updateAnalysisStep,
    setAnalysisResult,
    setDetectedItems,
    setVisionAnalysisComplete,
    startRecommendationLoading,
    setRecommendationComplete,
    setCurrentMessage,
    addMessage
  } = useAppStore();

  const { isFirstVisit, markVisit, nickname } = useUserStore();
  const { analyzeImage, isAnalyzing: realAnalyzing, result: realResult, error } = useImageAnalysis();
  
  // ストリーミング解析フック
  const { analyzeImageStreaming, isVisionAnalyzing, isRecommendationLoading, error: streamingError } = useStreamingAnalysis(
    // Vision解析完了時
    (items, visionResult) => {
      setDetectedItems(items);
      setVisionAnalysisComplete(true);
      setCurrentPhase('results');
      
      const completedMessage = characterMessages[2];
      setCurrentMessage(completedMessage);
      addMessage(completedMessage);
    },
    // 商品推薦完了時
    (products) => {
      setRecommendationComplete(products);
      
      setTimeout(() => {
        const recommendMessage = characterMessages[3];
        setCurrentMessage(recommendMessage);
        addMessage(recommendMessage);
      }, 500);
    },
    // エラー時
    (error) => {
      console.error('Streaming analysis failed:', error);
      // エラー時はデモ版にフォールバック
      simulateAnalysis();
    }
  );
  
  const { 
    currentCharacter, 
    allCharacters, 
    changeCharacter, 
    randomizeCharacter, 
    getMessage, 
    getTitles, 
    getSectionTitles 
  } = useCharacter();
  
  // テーマフック
  const { theme, themeClasses } = useTheme(currentCharacter.personality);
  
  const [currentPhase, setCurrentPhase] = useState<'upload' | 'analysis' | 'results'>('upload');
  const [useRealAnalysis, setUseRealAnalysis] = useState(true);
  const [characterMessages, setCharacterMessages] = useState<ReturnType<typeof createCharacterMessages>>([]);

  // キャラクター変更時のメッセージ更新を強制実行する関数
  const updateCharacterMessage = useCallback(() => {
    console.log('🔄 updateCharacterMessage called for:', currentCharacter.name);
    const newMessages = createCharacterMessages({
      greeting: getMessage('greeting'),
      thinking: getMessage('thinking'),
      analysis: getMessage('analysis'),
      recommendation: getMessage('recommendation'),
      reaction: getMessage('reaction')
    });
    setCharacterMessages(newMessages);

    // アップロードフェーズの時は即座に挨拶を表示
    if (currentPhase === 'upload' && newMessages.length > 0) {
      const welcomeMessage = newMessages[0];
      console.log('💬 Setting welcome message:', welcomeMessage.text);
      setCurrentMessage(welcomeMessage);
      addMessage(welcomeMessage);
    }
  }, [getMessage, currentPhase, setCurrentMessage, addMessage, currentCharacter.name]);

  // カスタムキャラクター変更関数（useEffectに任せて重複を防ぐ）
  const handleCharacterChange = useCallback((characterId: string) => {
    changeCharacter(characterId);
    // useEffectがキャラクター変更を検知してメッセージを更新するので、ここでは何もしない
  }, [changeCharacter]);

  // ランダムキャラクター選択関数（useEffectに任せて重複を防ぐ）
  const handleRandomCharacter = useCallback(() => {
    randomizeCharacter();
    // useEffectがキャラクター変更を検知してメッセージを更新するので、ここでは何もしない
  }, [randomizeCharacter]);

  // キャラクターが変更された時にメッセージを更新
  useEffect(() => {
    updateCharacterMessage();
    
    // 初回訪問時の処理
    if (isFirstVisit) {
      markVisit();
    }
  }, [currentCharacter.id, updateCharacterMessage, isFirstVisit, markVisit]);

  // フェーズが変更された時もメッセージを同期（アップロード時のみ）
  useEffect(() => {
    if (currentPhase === 'upload') {
      // アップロードフェーズになった時は挨拶メッセージを表示
      // ただし、キャラクター変更によるuseEffectと重複しないように少し遅延
      const timer = setTimeout(() => {
        updateCharacterMessage();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [currentPhase, updateCharacterMessage]);


  // デモ用の解析シミュレーション
  const simulateAnalysis = async () => {
    if (!uploadedImage) return;

    // 解析開始
    startAnalysis();
    setCurrentPhase('analysis');
    
    // ステップを初期化
    const steps = [...mockAnalysisSteps];
    steps.forEach(step => updateAnalysisStep(step.id, step));

    // メッセージ更新
    const thinkingMessage = characterMessages[1];
    setCurrentMessage(thinkingMessage);
    addMessage(thinkingMessage);

    // 各ステップをシミュレーション
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // ステップ開始
      updateAnalysisStep(step.id, { status: 'processing', progress: 0 });
      
      // プログレス更新
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        updateAnalysisStep(step.id, { progress });
      }
      
      // ステップ完了
      await new Promise(resolve => setTimeout(resolve, 200));
      updateAnalysisStep(step.id, { status: 'completed', progress: 100 });
    }

    // 解析完了
    await new Promise(resolve => setTimeout(resolve, 500));
    setAnalysisResult(mockAnalysisResult);
    setCurrentPhase('results');

    // 完了メッセージ
    const completedMessage = characterMessages[2];
    setCurrentMessage(completedMessage);
    addMessage(completedMessage);

    // レコメンドメッセージ
    setTimeout(() => {
      const recommendMessage = characterMessages[3];
      setCurrentMessage(recommendMessage);
      addMessage(recommendMessage);
    }, 2000);
  };

  const handleImageUpload = async (file: File) => {
    setUploadedImage(file);
    
    if (useRealAnalysis) {
      // ストリーミング解析を開始
      setCurrentPhase('analysis');
      startAnalysis();
      
      const thinkingMessage = characterMessages[1];
      setCurrentMessage(thinkingMessage);
      addMessage(thinkingMessage);
      
      // 商品推薦の読み込み開始フラグを設定
      startRecommendationLoading();
      
      // ストリーミング解析を実行（キャラクター性格を渡す）
      await analyzeImageStreaming(file, currentCharacter.personality);
    } else {
      // デモ版の解析
      simulateAnalysis();
    }
  };

  const handleBackToUpload = () => {
    setCurrentPhase('upload');
    setUploadedImage(null);
    // フェーズ変更のuseEffectがメッセージを更新するので、ここでは何もしない
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.background}`}>
      {/* ヘッダー */}
      <header className={theme.styles.headerBg}>
        <div className="container mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${theme.colors.gradientHeader} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                T
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{getTitles().main}</h1>
                <p className="text-sm text-gray-600">{getTitles().sub}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* キャラクター選択 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">キャラクター:</label>
                <div className="flex gap-1">
                  {allCharacters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => handleCharacterChange(char.id)}
                      className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all ${
                        currentCharacter.id === char.id
                          ? `border-[${theme.colors.primary}] shadow-md`
                          : 'border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={char.avatarPath}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn(`Character avatar failed to load: ${char.avatarPath}`);
                          // フォールバック: 文字アイコン
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                              ${char.name[0]}
                            </div>
                          `;
                        }}
                      />
                    </button>
                  ))}
                  <button
                    onClick={handleRandomCharacter}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${theme.styles.accentGradient} flex items-center justify-center text-white text-xs hover:shadow-md transition-all`}
                    title="ランダム選択"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">解析モード:</label>
                <button
                  onClick={() => setUseRealAnalysis(!useRealAnalysis)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    useRealAnalysis 
                      ? `bg-gradient-to-r ${theme.colors.gradient} text-white border-transparent` 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {useRealAnalysis ? 'リアルAI🔥' : 'デモ版'}
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">{getTitles().user}</p>
                <p className={`font-bold`} style={{ color: theme.colors.primary }}>{nickname}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* ヒミコキャラクター */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <GalCharacter
              mood={
                currentPhase === 'analysis' ? 'thinking' :
                currentPhase === 'results' ? 'excited' : 'happy'
              }
              message={currentMessage?.text}
              size="lg"
              avatarPath={currentCharacter.avatarPath}
            />
          </motion.div>

          {/* フェーズ別コンテンツ */}
          <AnimatePresence mode="wait">
            {currentPhase === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {getSectionTitles().upload.title}
                  </h2>
                  <p className="text-gray-600 mb-8">
                    {getSectionTitles().upload.description}
                  </p>
                </div>

                <ImageUploader
                  onUpload={handleImageUpload}
                  isAnalyzing={isAnalyzing}
                />
              </motion.div>
            )}

            {currentPhase === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AnalysisProgress
                  steps={analysisSteps}
                  currentMessage={currentMessage?.text}
                />
              </motion.div>
            )}

            {currentPhase === 'results' && (visionAnalysisComplete || analysisResult) && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* 戻るボタン */}
                <div className="flex justify-center">
                  <button
                    onClick={handleBackToUpload}
                    className={`px-6 py-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 border-2`}
                    style={{ 
                      color: theme.colors.primary, 
                      borderColor: theme.colors.primary + '40',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary + '40';
                    }}
                  >
                    ← 新しい画像をアップロード
                  </button>
                </div>

                {/* 検出結果 - Vision API完了後すぐに表示 */}
                {detectedItems.length > 0 && (
                  <DetectedItems
                    items={detectedItems}
                    imageUrl={uploadedImage ? URL.createObjectURL(uploadedImage) : undefined}
                  />
                )}

                {/* おすすめ商品 - ストリーミング表示 */}
                {isLoadingRecommendations ? (
                  /* スケルトン表示 */
                  <ProductRecommendationSkeleton />
                ) : recommendedProducts.length > 0 ? (
                  /* 商品リスト表示 */
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {getSectionTitles().results.title}
                      </h2>
                      <p className="text-gray-600">
                        {getSectionTitles().results.description}
                      </p>
                    </div>

                    <ProductList
                      products={recommendedProducts}
                      showFilters={true}
                    />
                  </div>
                ) : analysisResult && (
                  /* 既存のロジック（デモ版用） */
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {getSectionTitles().results.title}
                      </h2>
                      <p className="text-gray-600">
                        {getSectionTitles().results.description}
                      </p>
                    </div>

                    <ProductList
                      products={analysisResult.recommendations}
                      showFilters={true}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-red-100 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 TrendGal - AI研究員クリスのファッション解析システム
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Google Vision API & Yahoo Shopping API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
