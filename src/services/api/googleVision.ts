import { GoogleAuth } from 'google-auth-library';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { GoogleVisionResponse, VisionLabel, VisionColor, VisionObject } from '@/types/analysis';

export class GoogleVisionService {
  private client: ImageAnnotatorClient | null = null;

  constructor() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
      }

      const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      
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

      // レスポンスを標準化
      const response: GoogleVisionResponse = {
        labelAnnotations: result.labelAnnotations?.map(label => ({
          description: label.description || '',
          score: label.score || 0,
          mid: label.mid || undefined
        })) || [],
        
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: result.imagePropertiesAnnotation?.dominantColors?.colors?.map(color => ({
              red: color.color?.red || 0,
              green: color.color?.green || 0,
              blue: color.color?.blue || 0,
              alpha: color.color?.alpha?.value || undefined,
              score: color.score || 0,
              pixelFraction: color.pixelFraction || 0
            })) || []
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