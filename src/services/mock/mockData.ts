import { Product, DetectedItem, AnalysisResult, GalMessage } from '@/types/product';
import { GalMessage as ApiGalMessage } from '@/types/api';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: '【激安♡】ふわふわニットトップス',
    price: 1980,
    originalPrice: 2980,
    imageUrl: '/images/mock-products/knit-top.jpg',
    shopName: 'プチプラファッション館',
    shopUrl: '#',
    category: 'tops',
    tags: ['ニット', 'カジュアル', 'プチプラ'],
    similarity: 95,
    rating: 4.2,
    reviewCount: 128,
    isOnSale: true,
    colors: ['#FFB6C1', '#FFFFFF']
  },
  {
    id: '2',
    name: 'トレンド◎ワイドデニムパンツ',
    price: 2480,
    imageUrl: '/images/mock-products/wide-jeans.jpg',
    shopName: 'ガーリーストア',
    shopUrl: '#',
    category: 'bottoms',
    tags: ['デニム', 'ワイド', 'トレンド'],
    similarity: 88,
    rating: 4.5,
    reviewCount: 89,
    colors: ['#4169E1', '#87CEEB']
  },
  {
    id: '3',
    name: '厚底スニーカー★白×ピンク',
    price: 3280,
    originalPrice: 4280,
    imageUrl: '/images/mock-products/platform-sneakers.jpg',
    shopName: 'シューズパラダイス',
    shopUrl: '#',
    category: 'shoes',
    tags: ['スニーカー', '厚底', 'ピンク'],
    similarity: 92,
    rating: 4.1,
    reviewCount: 156,
    isOnSale: true,
    colors: ['#FFFFFF', '#FFB6C1']
  },
  {
    id: '4',
    name: 'かわいすぎ♡ハートバッグ',
    price: 1680,
    imageUrl: '/images/mock-products/heart-bag.jpg',
    shopName: 'アクセサリーランド',
    shopUrl: '#',
    category: 'accessories',
    tags: ['バッグ', 'ハート', 'キュート'],
    similarity: 78,
    rating: 4.0,
    reviewCount: 67,
    colors: ['#FFB6C1', '#FF69B4']
  },
  {
    id: '5',
    name: '春色♪フリルワンピース',
    price: 2980,
    imageUrl: '/images/mock-products/frilly-dress.jpg',
    shopName: 'ドレッシーショップ',
    shopUrl: '#',
    category: 'dress',
    tags: ['ワンピース', 'フリル', '春'],
    similarity: 85,
    rating: 4.3,
    reviewCount: 94,
    colors: ['#FFE4E1', '#F0E68C']
  },
  {
    id: '6',
    name: 'ゆめかわデニムジャケット',
    price: 3680,
    imageUrl: '/images/mock-products/denim-jacket.jpg',
    shopName: 'カジュアルワールド',
    shopUrl: '#',
    category: 'outer',
    tags: ['デニム', 'ジャケット', 'ゆめかわ'],
    similarity: 82,
    rating: 4.4,
    reviewCount: 112,
    colors: ['#4169E1', '#E6E6FA']
  }
];

export const mockDetectedItems: DetectedItem[] = [
  {
    id: '1',
    type: 'tops',
    description: 'ピンクのニットトップス',
    confidence: 0.95,
    boundingBox: { x: 0.2, y: 0.1, width: 0.6, height: 0.4 },
    attributes: {
      colors: ['#FFB6C1', '#FFFFFF'],
      style: 'casual',
      sleeve: 'long',
      pattern: 'solid',
      season: 'autumn',
      material: 'ニット'
    }
  },
  {
    id: '2',
    type: 'bottoms',
    description: 'ワイドデニムパンツ',
    confidence: 0.88,
    boundingBox: { x: 0.1, y: 0.5, width: 0.8, height: 0.4 },
    attributes: {
      colors: ['#4169E1'],
      style: 'casual',
      length: 'long',
      pattern: 'solid',
      season: 'spring'
    }
  },
  {
    id: '3',
    type: 'shoes',
    description: '白とピンクのスニーカー',
    confidence: 0.92,
    boundingBox: { x: 0.2, y: 0.85, width: 0.6, height: 0.15 },
    attributes: {
      colors: ['#FFFFFF', '#FFB6C1'],
      style: 'sporty',
      pattern: 'solid',
      season: 'spring'
    }
  },
  {
    id: '4',
    type: 'accessories',
    description: 'ピンクのハートバッグ',
    confidence: 0.78,
    boundingBox: { x: 0.7, y: 0.3, width: 0.25, height: 0.3 },
    attributes: {
      colors: ['#FFB6C1', '#FF69B4'],
      style: 'casual',
      pattern: 'solid',
      season: 'spring'
    }
  }
];

export const mockAnalysisResult: AnalysisResult = {
  detectedItems: mockDetectedItems,
  overallStyle: 'ガーリーカジュアル',
  colorPalette: ['#FFB6C1', '#4169E1', '#FFFFFF', '#FF69B4'],
  recommendations: mockProducts,
  confidence: 0.89
};

// メッセージ生成関数
export const createCharacterMessages = (messageText: {
  greeting: string;
  thinking: string;
  analysis: string;
  recommendation: string;
  reaction: string;
}): ApiGalMessage[] => [
  {
    id: '1',
    text: messageText.greeting,
    type: 'greeting',
    mood: 'excited',
    timestamp: new Date()
  },
  {
    id: '2',
    text: messageText.thinking,
    type: 'thinking',
    mood: 'thinking',
    timestamp: new Date()
  },
  {
    id: '3',
    text: messageText.analysis,
    type: 'analysis',
    mood: 'excited',
    timestamp: new Date()
  },
  {
    id: '4',
    text: messageText.recommendation,
    type: 'recommendation',
    mood: 'happy',
    timestamp: new Date()
  },
  {
    id: '5',
    text: messageText.reaction,
    type: 'reaction',
    mood: 'surprised',
    timestamp: new Date()
  }
];

// デフォルトメッセージ（後方互換性のため）
export const mockGalMessages: ApiGalMessage[] = createCharacterMessages({
  greeting: 'ふむ...また新しい被験者ね。まあ、私のAIファッション解析システムで、あなたの趣味を分析してあげる。',
  thinking: 'ちょっと待って...画像データを詳細に解析中よ。私の高精度アルゴリズムに任せておきなさい。',
  analysis: 'なるほど...思ったより悪くないコーディネートじゃない。データ解析完了よ。',
  recommendation: 'はあ...仕方ないから、私が厳選した類似アイテムを教えてあげる。感謝しなさい！',
  reaction: 'ちょっと！この類似度、私の予測を上回ってるじゃない...！'
});

// デモ用の解析ステップ
export const mockAnalysisSteps = [
  {
    id: '1',
    title: '画像解析中',
    description: 'AI が画像を分析しています...',
    status: 'processing' as const,
    progress: 30
  },
  {
    id: '2',
    title: 'アイテム検出',
    description: 'ファッションアイテムを検出中...',
    status: 'pending' as const,
    progress: 0
  },
  {
    id: '3',
    title: '色彩分析',
    description: 'カラーパレットを分析中...',
    status: 'pending' as const,
    progress: 0
  },
  {
    id: '4',
    title: '商品検索',
    description: 'プチプラ商品を検索中...',
    status: 'pending' as const,
    progress: 0
  }
];