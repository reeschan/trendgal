import { GoogleAuth } from 'google-auth-library';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { GoogleVisionResponse, VisionLabel, VisionColor, VisionObject } from '@/types/analysis';

export class GoogleVisionService {
  private client: ImageAnnotatorClient | null = null;

  constructor() {
    try {
      // APIキーまたはサービスアカウントキーをチェック
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_API_KEY) {
        throw new Error('Either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_API_KEY environment variable must be set');
      }

      // APIキーが設定されている場合
      if (process.env.GOOGLE_API_KEY) {
        this.client = new ImageAnnotatorClient({
          apiKey: process.env.GOOGLE_API_KEY
        });
        console.log('✅ Google Vision initialized with API key');
        return;
      }

      // サービスアカウントキーが設定されている場合
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        let serviceAccountKey;
        try {
          serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (parseError) {
          throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY must be a valid JSON service account key, not an API key');
        }
        
        // 秘密鍵の改行文字を正しく処理
        if (serviceAccountKey.private_key) {
          serviceAccountKey.private_key = serviceAccountKey.private_key.replace(/\\n/g, '\n');
        }
        
        // サービスアカウントキーでGoogle Cloud認証を設定
        const auth = new GoogleAuth({
          credentials: serviceAccountKey,
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        this.client = new ImageAnnotatorClient({ auth });
        console.log('✅ Google Vision initialized with service account key');
      }
    } catch (error) {
      console.error('Failed to initialize Google Vision client:', error);
      throw error;
    }
  }

  async analyzeImage(imageBase64: string): Promise<GoogleVisionResponse> {
    if (!this.client) {
      throw new Error('Google Vision client is not initialized');
    }

    try {
      // Base64文字列をBufferに変換
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Vision APIの機能を定義
      const features = [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'IMAGE_PROPERTIES', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
      ];

      // 画像解析を実行
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer },
        features: features
      });

      if (result.error) {
        throw new Error(`Vision API error: ${result.error.message}`);
      }

      // デバッグ: 生の色データを出力
      console.log('🎨 Raw Vision API colors:', result.imagePropertiesAnnotation?.dominantColors?.colors?.map(color => ({
        color: color.color,
        score: color.score,
        pixelFraction: color.pixelFraction
      })));

      // レスポンスを標準化
      const response: GoogleVisionResponse = {
        labelAnnotations: result.labelAnnotations?.map(label => ({
          description: label.description || '',
          score: label.score || 0,
          mid: label.mid || undefined
        })) || [],
        
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: result.imagePropertiesAnnotation?.dominantColors?.colors?.map(color => {
              const processedColor = {
                red: color.color?.red || 0,
                green: color.color?.green || 0,
                blue: color.color?.blue || 0,
                alpha: color.color?.alpha?.value || undefined,
                score: color.score || 0,
                pixelFraction: color.pixelFraction || 0
              };
              console.log(`🔄 Color conversion: RGB(${color.color?.red || 0}, ${color.color?.green || 0}, ${color.color?.blue || 0}) → ${processedColor.red}, ${processedColor.green}, ${processedColor.blue}`);
              return processedColor;
            }) || []
          }
        },
        
        localizedObjectAnnotations: result.localizedObjectAnnotations?.map(obj => ({
          name: obj.name || '',
          score: obj.score || 0,
          boundingPoly: {
            normalizedVertices: obj.boundingPoly?.normalizedVertices?.map(vertex => ({
              x: vertex.x || 0,
              y: vertex.y || 0
            })) || []
          }
        })) || []
      };

      return response;
    } catch (error) {
      console.error('Error analyzing image with Vision API:', error);
      throw error;
    }
  }

  // ヘルスチェック用
  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      
      // 小さなテスト画像で接続確認
      const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWx7l1wAAAABJRU5ErkJggg==';
      await this.analyzeImage(testImage);
      return true;
    } catch (error) {
      console.error('Vision API connection test failed:', error);
      return false;
    }
  }
}