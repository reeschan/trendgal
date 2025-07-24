# Google Vision API セットアップガイド

## 1. Google Cloud Console でのセットアップ

### ステップ1: プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成、または既存のプロジェクトを選択
3. プロジェクト名: `trendgal-vision` など

### ステップ2: Vision API の有効化
1. 左メニューから「APIとサービス」→「ライブラリ」
2. 「Cloud Vision API」を検索
3. 「有効にする」をクリック

### ステップ3: 認証情報の作成
1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「APIキー」
3. 作成されたAPIキーをコピー

### ステップ4: APIキーの制限設定（推奨）
1. 作成したAPIキーをクリック
2. 「アプリケーションの制限」で「HTTPリファラー」を選択
3. 許可するドメインを追加（例: `localhost:3000/*`, `your-domain.com/*`）
4. 「APIの制限」で「キーを制限」を選択
5. 「Cloud Vision API」のみ選択

## 2. プロジェクトでの設定

### 環境変数ファイルの作成
\`\`\`bash
# .env.local を作成
touch .env.local
\`\`\`

### APIキーの設定
\`\`\`.env.local
# Google Vision API
GOOGLE_VISION_API_KEY=your_api_key_here

# 楽天API (オプション)
RAKUTEN_API_KEY=your_rakuten_key_here
\`\`\`

### 環境変数の型定義
\`\`\`typescript
// src/types/env.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_VISION_API_KEY: string;
      RAKUTEN_API_KEY: string;
    }
  }
}

export {};
\`\`\`

## 3. Vision API サービスの実装

### Google Vision API クライアント
\`\`\`typescript
// src/services/api/googleVision.ts
import { GoogleVisionResponse, VisionLabel, VisionColor } from '@/types/analysis';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export class GoogleVisionService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageBase64: string): Promise<GoogleVisionResponse> {
    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 20
            },
            {
              type: 'IMAGE_PROPERTIES',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            }
          ]
        }
      ]
    };

    const response = await fetch(\`\${VISION_API_URL}?key=\${this.apiKey}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(\`Vision API error: \${response.statusText}\`);
    }

    const data = await response.json();
    return data.responses[0];
  }
}
\`\`\`

## 4. Next.js API Route の実装

### API エンドポイント
\`\`\`typescript
// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleVisionService } from '@/services/api/googleVision';
import { AttributeInferenceService } from '@/services/analysis/attributeInference';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!process.env.GOOGLE_VISION_API_KEY) {
      return NextResponse.json(
        { error: 'Google Vision API key not configured' },
        { status: 500 }
      );
    }

    // Vision API で画像解析
    const visionService = new GoogleVisionService(process.env.GOOGLE_VISION_API_KEY);
    const visionResult = await visionService.analyzeImage(imageBase64);

    // カスタム属性推定
    const inferenceService = new AttributeInferenceService();
    const analysisResult = inferenceService.processVisionResult(visionResult);

    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
\`\`\`

## 5. 使用方法

### フロントエンドでの呼び出し
\`\`\`typescript
// src/hooks/useImageAnalysis.ts
import { useState } from 'react';
import { AnalysisResult } from '@/types/product';

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      // ファイルをBase64に変換
      const base64 = await fileToBase64(file);
      
      // API呼び出し
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64.split(',')[1] // data:image/jpeg;base64, を除去
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, result };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
\`\`\`

## 6. 料金について

### Vision API 料金 (2024年)
- 月間 1,000 リクエストまで無料
- それ以降は 1,000 リクエストあたり $1.50
- LABEL_DETECTION: $1.50 per 1000 requests
- IMAGE_PROPERTIES: $1.50 per 1000 requests
- OBJECT_LOCALIZATION: $1.50 per 1000 requests

### 注意事項
- 開発時は無料枠で十分
- 本番環境では予算アラートの設定を推奨
- APIキーは絶対に公開しない
- 可能な限りサーバーサイドで処理する

## 7. トラブルシューティング

### よくあるエラー
1. **403 Forbidden**: APIキーが無効 or APIが無効化されている
2. **400 Bad Request**: リクエスト形式が間違っている
3. **429 Too Many Requests**: レート制限に達している

### デバッグ方法
\`\`\`typescript
// API呼び出し時のログ出力
console.log('Vision API Request:', {
  imageSize: imageBase64.length,
  timestamp: new Date().toISOString()
});
\`\`\`