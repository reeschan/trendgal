import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiQueryResponse {
  queries: Array<{
    query: string;
    confidence: number;
    reasoning: string;
  }>;
}

interface VisionAnalysisData {
  labels: Array<{
    description: string;
    score: number;
  }>;
  colors: Array<{
    color: {
      red: number;
      green: number;
      blue: number;
    };
    score: number;
    pixelFraction: number;
  }>;
  objects: Array<{
    name: string;
    score: number;
  }>;
  characterPersonality?: 'kurisu' | 'marin'; // キャラクター性格を追加
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async generateSearchQueries(visionData: VisionAnalysisData): Promise<GeminiQueryResponse> {
    // キャラクター性格に基づく設定
    const personalityConfig = this.getPersonalityConfig(visionData.characterPersonality || 'kurisu');
    
    const prompt = `
あなたはファッションECサイトの検索クエリ生成の専門家です。
Google Vision APIの解析結果から、Yahoo!ショッピングで効果的に商品を検索するための日本語クエリを生成してください。

【キャラクター設定】
現在のキャラクター: ${personalityConfig.name}
ファッション志向: ${personalityConfig.fashionStyle}
好みの傾向: ${personalityConfig.preferences.join('、')}
重視するポイント: ${personalityConfig.priorities.join('、')}

Vision API解析結果:
- 検出されたラベル: ${JSON.stringify(visionData.labels)}
- 検出された色: ${JSON.stringify(visionData.colors)}
- 検出されたオブジェクト: ${JSON.stringify(visionData.objects)}

【重要な要件】
1. 信頼度スコアが高い順に5つの検索クエリを生成してください
2. **キャラクターの性格に合わせたクエリ生成を必須とする**：
   - ${personalityConfig.name}の場合：${personalityConfig.queryGuideline}
   - 検索キーワードに${personalityConfig.keywords.join('、')}などを含める
3. **検索クエリは必ず単品パーツ部位で生成する**：
   - 「コーデ」「セット」「セットアップ」などのワードは使用禁止
   - 必ず具体的なアイテム名（シャツ、パンツ、ジャケット、スカート等）で検索
   - 複数カテゴリが検出された場合も、それぞれ個別のアイテムとして検索クエリを作成
4. 単品アイテム検索クエリを5つ全て生成：
   - 色 + アイテム名 + キャラクター特徴の形式
   - 素材・シルエット + アイテム名の形式
   - ブランド系統 + アイテム名の形式
5. クエリ生成の具体的な考慮点：
   - キャラクターの年齢層・テイストを反映
   - ${personalityConfig.ageGroup}をターゲットとした商品を重視
   - ${personalityConfig.priceRange}の価格帯を想定
   - 各アイテムが単体で購入・着用できることを前提とする

【キャラクター別例】
${personalityConfig.examples.map(ex => `- "${ex.query}" (信頼度: ${ex.confidence}) - ${ex.type}`).join('\n')}

以下のJSON形式で回答してください:
{
  "queries": [
    {
      "query": "検索クエリ",
      "confidence": 0.95,
      "reasoning": "クエリ選定理由"
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const parsedResponse = JSON.parse(jsonMatch[0]) as GeminiQueryResponse;
      
      // 信頼度スコアで降順ソート
      parsedResponse.queries.sort((a, b) => b.confidence - a.confidence);
      
      // 上位5つに限定
      parsedResponse.queries = parsedResponse.queries.slice(0, 5);
      
      return parsedResponse;
    } catch (error) {
      console.error('Error generating queries with Gemini:', error);
      
      // フォールバック: 既存のロジックを使用
      return this.generateFallbackQueries(visionData);
    }
  }

  private generateFallbackQueries(visionData: VisionAnalysisData): GeminiQueryResponse {
    const queries: GeminiQueryResponse['queries'] = [];
    
    // ラベルから主要なアイテムを抽出
    const topLabels = visionData.labels
      .filter(label => label.score > 0.7)
      .slice(0, 3);
    
    // 色情報から主要な色を抽出
    const topColor = visionData.colors[0];
    const colorName = this.rgbToJapaneseColorName(
      topColor.color.red,
      topColor.color.green,
      topColor.color.blue
    );
    
    // カテゴリを判定
    const categories = new Set<string>();
    const fashionItems: string[] = [];
    
    topLabels.forEach(label => {
      const itemName = this.translateToJapanese(label.description);
      if (itemName) {
        fashionItems.push(itemName);
        
        // カテゴリ分類
        if (['ジャケット', 'コート', 'ブルゾン', 'パーカー'].includes(itemName)) {
          categories.add('アウター');
        } else if (['シャツ', 'ニット', 'セーター', 'Tシャツ', 'ブラウス'].includes(itemName)) {
          categories.add('トップス');
        } else if (['パンツ', 'スカート', 'ジーンズ', 'ショートパンツ'].includes(itemName)) {
          categories.add('ボトムス');
        }
      }
    });
    
    // 基本的な単品クエリ（最低2つ）
    fashionItems.slice(0, 2).forEach((itemName, index) => {
      queries.push({
        query: `${colorName} ${itemName}`,
        confidence: topLabels[index].score * 0.9,
        reasoning: `単品検索: Vision APIで${topLabels[index].description}が検出されました`
      });
    });
    
    // 複数カテゴリが検出された場合も単品アイテムで検索
    if (categories.size >= 2) {
      const additionalItems = fashionItems.slice(2); // 3番目以降のアイテム
      additionalItems.forEach((itemName, index) => {
        const season = this.inferSeasonFromColor(colorName);
        queries.push({
          query: `${season} ${itemName} ${colorName}`,
          confidence: 0.8 - (index * 0.05),
          reasoning: `追加単品検索: 複数カテゴリから${itemName}を個別検索`
        });
      });
    }
    
    // 特徴的なクエリ
    if (fashionItems.length > 0) {
      queries.push({
        query: `${fashionItems[0]} レディース おしゃれ`,
        confidence: 0.7,
        reasoning: `特徴検索: メインアイテムに「おしゃれ」を追加して幅広い結果を取得`
      });
    }
    
    return { queries: queries.slice(0, 5) };
  }
  
  private inferSeasonFromColor(colorName: string): string {
    const springColors = ['ピンク', '黄色', 'パステル'];
    const summerColors = ['白', '青', '水色'];
    const autumnColors = ['茶色', 'ベージュ', 'オレンジ', '赤'];
    const winterColors = ['黒', 'グレー', '紺'];
    
    if (springColors.includes(colorName)) return '春';
    if (summerColors.includes(colorName)) return '夏';
    if (autumnColors.includes(colorName)) return '秋';
    if (winterColors.includes(colorName)) return '冬';
    return '秋冬'; // デフォルト
  }

  private getPersonalityConfig(personality: 'kurisu' | 'marin') {
    const configs = {
      kurisu: {
        name: 'クリス（AI研究員）',
        fashionStyle: '知的で合理性のあるファッション',
        preferences: ['機能性', 'シンプル', '上品', '知的'],
        priorities: ['品質', '着心地', '実用性', 'コストパフォーマンス'],
        keywords: ['ベーシック', 'シンプル', 'きれいめ', 'オフィス', '大人', '上品'],
        queryGuideline: '機能性と実用性を重視し、知的で洗練された印象のアイテムを優先する',
        ageGroup: '25-35歳の大人女性',
        priceRange: '中価格帯〜高価格帯',
        examples: [
          { query: 'ベージュ テーラードジャケット きれいめ', confidence: '0.95', type: '知的単品検索' },
          { query: 'オフィスカジュアル シンプル コーデ', confidence: '0.90', type: '合理的スタイル検索' },
          { query: '大人 ベーシック トレンチコート', confidence: '0.85', type: '上品アウター検索' }
        ]
      },
      marin: {
        name: 'マリン（若者向けトレンド）',
        fashionStyle: '若者が好むカジュアルで流行性の高いファッション',
        preferences: ['カジュアル', 'トレンド', 'プチプラ', '着回し', 'リラックス'],
        priorities: ['トレンド感', '着心地', 'コスパ', '日常使い', '親しみやすさ'],
        keywords: ['カジュアル', 'プチプラ', 'トレンド', '韓国', 'ストリート', 'ナチュラル'],
        queryGuideline: 'カジュアルで親しみやすく、トレンド感のある日常使いしやすいアイテムを優先する。ギャル系に限らず幅広いカジュアルスタイルに対応',
        ageGroup: '16-25歳の若い女性',
        priceRange: '低価格帯〜中価格帯',
        examples: [
          { query: 'ベージュ オーバーサイズ Tシャツ', confidence: '0.95', type: 'カジュアル単品検索' },
          { query: 'デニム ワイドパンツ ストリート', confidence: '0.90', type: 'ボトムス単品検索' },
          { query: 'カーキ ミリタリージャケット カジュアル', confidence: '0.85', type: 'アウター単品検索' }
        ]
      }
    };
    
    return configs[personality];
  }

  private rgbToJapaneseColorName(r: number, g: number, b: number): string {
    // 簡易的な色名変換
    if (r > 200 && g < 100 && b < 100) return '赤';
    if (r > 200 && g > 200 && b < 100) return '黄色';
    if (r < 100 && g > 200 && b < 100) return '緑';
    if (r < 100 && g < 100 && b > 200) return '青';
    if (r > 200 && g < 150 && b > 200) return 'ピンク';
    if (r > 150 && g > 150 && b > 150) return '白';
    if (r < 50 && g < 50 && b < 50) return '黒';
    return 'グレー';
  }

  private translateToJapanese(englishTerm: string): string | null {
    const translations: Record<string, string> = {
      'shirt': 'シャツ',
      'dress': 'ワンピース',
      'pants': 'パンツ',
      'skirt': 'スカート',
      'jacket': 'ジャケット',
      'coat': 'コート',
      'sweater': 'セーター',
      'bag': 'バッグ',
      'shoes': '靴',
      'hat': '帽子',
      't-shirt': 'Tシャツ',
      'jeans': 'ジーンズ',
      'blouse': 'ブラウス',
      'cardigan': 'カーディガン',
      'sneakers': 'スニーカー',
      'boots': 'ブーツ',
      'scarf': 'スカーフ',
      'gloves': '手袋',
      'accessory': 'アクセサリー',
      'watch': '時計',
      'sunglasses': 'サングラス',
      'backpack': 'リュック',
      'purse': '財布',
      'wallet': '財布',
      'belt': 'ベルト',
      'tie': 'ネクタイ',
      'socks': '靴下',
      'underwear': '下着',
      'swimsuit': '水着',
      'pajamas': 'パジャマ',
      'suit': 'スーツ',
      'uniform': '制服',
      'hoodie': 'パーカー',
      'vest': 'ベスト',
      'shorts': 'ショートパンツ',
      'leggings': 'レギンス',
      'stockings': 'ストッキング',
      'heels': 'ヒール',
      'sandals': 'サンダル',
      'necklace': 'ネックレス',
      'bracelet': 'ブレスレット',
      'earrings': 'イヤリング',
      'ring': '指輪'
    };
    
    const lowerTerm = englishTerm.toLowerCase();
    return translations[lowerTerm] || null;
  }
}

// シングルトンインスタンス
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  return geminiService;
}

export type { GeminiQueryResponse, VisionAnalysisData };