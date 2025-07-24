'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { GalCharacter } from '@/components/character/GalCharacter';
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress';
import { DetectedItems } from '@/components/analysis/DetectedItems';
import { ProductList } from '@/components/shopping/ProductList';
import { useAppStore } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { mockAnalysisSteps, mockAnalysisResult, createCharacterMessages } from '@/services/mock/mockData';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useCharacter } from '@/hooks/useCharacter';
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
    setUploadedImage,
    startAnalysis,
    updateAnalysisStep,
    setAnalysisResult,
    setCurrentMessage,
    addMessage
  } = useAppStore();

  const { isFirstVisit, markVisit, nickname } = useUserStore();
  const { analyzeImage, isAnalyzing: realAnalyzing, result: realResult, error } = useImageAnalysis();
  const { 
    currentCharacter, 
    allCharacters, 
    changeCharacter, 
    randomizeCharacter, 
    getMessage, 
    getTitles, 
    getSectionTitles 
  } = useCharacter();
  
  const [currentPhase, setCurrentPhase] = useState<'upload' | 'analysis' | 'results'>('upload');
  const [useRealAnalysis, setUseRealAnalysis] = useState(true);
  const [characterMessages, setCharacterMessages] = useState<ReturnType<typeof createCharacterMessages>>([]);

  // キャラクターが変更された時にメッセージを更新
  useEffect(() => {
    if (currentCharacter) {
      const newMessages = createCharacterMessages({
        greeting: getMessage('greeting'),
        thinking: getMessage('thinking'),
        analysis: getMessage('analysis'),
        recommendation: getMessage('recommendation'),
        reaction: getMessage('reaction')
      });
      setCharacterMessages(newMessages);
      
      // 初回訪問時の処理もここで実行
      if (isFirstVisit && newMessages.length > 0) {
        const welcomeMessage = newMessages[0];
        setCurrentMessage(welcomeMessage);
        addMessage(welcomeMessage);
        markVisit();
      }
    }
  }, [currentCharacter?.id, getMessage, isFirstVisit, setCurrentMessage, addMessage, markVisit]); // 必要な依存関数を追加


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
      // 実際のGoogle Vision API解析
      setCurrentPhase('analysis');
      startAnalysis();
      
      const thinkingMessage = characterMessages[1];
      setCurrentMessage(thinkingMessage);
      addMessage(thinkingMessage);
      
      try {
        const result = await analyzeImage(file);
        if (result) {
          setAnalysisResult(result);
          setCurrentPhase('results');
          
          const completedMessage = characterMessages[2];
          setCurrentMessage(completedMessage);
          addMessage(completedMessage);
          
          setTimeout(() => {
            const recommendMessage = characterMessages[3];
            setCurrentMessage(recommendMessage);
            addMessage(recommendMessage);
          }, 2000);
        } else {
          // エラー時はデモ版にフォールバック
          console.log('API analysis failed, falling back to demo');
          simulateAnalysis();
        }
      } catch (err) {
        console.error('Analysis error:', err);
        // エラー時はデモ版にフォールバック
        simulateAnalysis();
      }
    } else {
      // デモ版の解析
      simulateAnalysis();
    }
  };

  const handleBackToUpload = () => {
    setCurrentPhase('upload');
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
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
                      onClick={() => changeCharacter(char.id)}
                      className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all ${
                        currentCharacter?.id === char.id
                          ? 'border-red-500 shadow-md'
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
                    onClick={randomizeCharacter}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-xs hover:shadow-md transition-all"
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
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {useRealAnalysis ? 'リアルAI🔥' : 'デモ版'}
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">{getTitles().user}</p>
                <p className="font-bold text-red-600">{nickname}</p>
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
              avatarPath={currentCharacter?.avatarPath}
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

            {currentPhase === 'results' && analysisResult && (
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
                    className="px-6 py-3 bg-white text-red-600 rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                  >
                    ← 新しい画像をアップロード
                  </button>
                </div>

                {/* 検出結果 */}
                <DetectedItems
                  items={analysisResult.detectedItems}
                  imageUrl={uploadedImage ? URL.createObjectURL(uploadedImage) : undefined}
                />

                {/* おすすめ商品 */}
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
