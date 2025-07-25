import { GoogleVisionResponse } from '@/types/analysis';
import { DetectedItem, AnalysisResult, ItemAttributes, Product } from '@/types/product';
import { YahooShoppingService } from '@/services/api/yahooShopping';
import { getGeminiService, VisionAnalysisData } from '@/services/api/gemini';
import { GoogleVisionService } from '@/services/api/googleVision';

export class AttributeInferenceService {
  private yahooShopping: YahooShoppingService;
  private useGemini: boolean = true;

  constructor() {
    this.yahooShopping = new YahooShoppingService();
    this.useGemini = process.env.GEMINI_API_KEY ? true : false;
  }
  
  async processVisionResult(visionResult: GoogleVisionResponse, imageBase64?: string): Promise<AnalysisResult> {
    const detectedItems = await this.inferFashionItems(visionResult, imageBase64);
    const colorPaletteResult = this.extractColorPalette(visionResult);
    const overallStyle = this.inferOverallStyle(visionResult.labelAnnotations);
    
    // 検出されたアイテムに基づいて商品を検索
    // Geminiを使用する場合は、元のVisionレスポンスも渡す
    const recommendations = await this.searchSimilarProducts(detectedItems, visionResult);
    
    return {
      detectedItems,
      overallStyle,
      colorPalette: colorPaletteResult.colors,
      colorPaletteInfo: colorPaletteResult.colorInfo,
      recommendations,
      confidence: this.calculateOverallConfidence(detectedItems)
    };
  }

  async searchSimilarProducts(detectedItems: DetectedItem[], visionResult?: GoogleVisionResponse, characterPersonality?: 'kurisu' | 'marin'): Promise<Product[]> {
    const products: Product[] = [];
    const searchErrors: string[] = [];
    
    // Geminiを使用する場合は、Vision APIの結果を変換してクエリを生成
    if (this.useGemini) {
      try {
        // 元のVisionレスポンスがある場合は、より詳細なデータを使用
        const visionData = visionResult 
          ? this.convertVisionResponseToGeminiFormat(visionResult, characterPersonality)
          : this.convertToGeminiFormat(detectedItems);
        
        const geminiService = getGeminiService();
        const geminiResponse = await geminiService.generateSearchQueries(visionData);
        
        console.log('🤖 Gemini生成クエリ:');
        geminiResponse.queries.forEach((q, i) => {
          console.log(`  ${i + 1}. "${q.query}" (信頼度: ${(q.confidence * 100).toFixed(0)}%)`)
          console.log(`     理由: ${q.reasoning}`);
        });
        
        // Geminiが生成したクエリで検索
        for (const queryInfo of geminiResponse.queries.slice(0, 5)) {
          try {
            // 全て単品検索として統一（結果数は一律5件）
            const resultsCount = 5;
            
            const yahooProducts = await this.yahooShopping.searchProducts(queryInfo.query, {
              results: resultsCount,
              sort: '-score'
            });
            
            if (yahooProducts.length > 0) {
              console.log(`✅ ${yahooProducts.length}件の商品を発見: "${queryInfo.query}"`);
              
              // カテゴリを推測
              const category = this.inferCategoryFromQuery(queryInfo.query, detectedItems);
              
              const convertedProducts = yahooProducts.map(product => {
                const converted = this.convertYahooProduct(product, category);
                converted.similarity = queryInfo.confidence; // Geminiの信頼度を類似度として使用
                
                // 検索クエリに基づいてタグを追加
                if (queryInfo.query.includes('韓国')) converted.tags.push('韓国風');
                if (queryInfo.query.includes('カジュアル')) converted.tags.push('カジュアル');
                if (queryInfo.query.includes('オフィス')) converted.tags.push('オフィス');
                if (queryInfo.query.includes('プチプラ')) converted.tags.push('プチプラ');
                if (queryInfo.query.includes('トレンド')) converted.tags.push('トレンド');
                if (queryInfo.query.includes('ナチュラル')) converted.tags.push('ナチュラル');
                if (queryInfo.query.includes('ストリート')) converted.tags.push('ストリート');
                
                return converted;
              });
              products.push(...convertedProducts);
            } else {
              console.warn(`❌ 検索結果なし: "${queryInfo.query}"`);
            }
          } catch (error) {
            console.error(`❌ 検索エラー: "${queryInfo.query}"`, error);
          }
        }
        
        if (products.length > 0) {
          return products.slice(0, 10);
        }
      } catch (error) {
        console.error('❌ Geminiクエリ生成エラー:', error);
        console.log('🔄 既存のロジックにフォールバック');
      }
    }
    
    // 既存のロジック（Geminiが使えない場合のフォールバック）
    for (const item of detectedItems.slice(0, 3)) { // 最大3つのアイテムを検索
      try {
        const searchQuery = this.createSearchQuery(item);
        console.log(`🔍 検索クエリ: "${searchQuery}" (元: ${item.description})`);
        console.log(`   - アイテムタイプ: ${item.type}`);
        console.log(`   - 検出色: ${item.attributes.colors?.join(', ') || 'なし'}`);
        
        const yahooProducts = await this.yahooShopping.searchProducts(searchQuery, {
          results: 5,
          sort: '-score'
        });
        
        if (yahooProducts.length === 0) {
          console.warn(`❌ 検索結果なし: "${searchQuery}"`);
          
          // フォールバック検索: 色なしでカテゴリのみで再検索
          const fallbackQuery = this.createFallbackQuery(item);
          if (fallbackQuery !== searchQuery) {
            console.log(`🔄 フォールバック検索: "${fallbackQuery}"`);
            const fallbackProducts = await this.yahooShopping.searchProducts(fallbackQuery, {
              results: 3,
              sort: '-score'
            });
            
            if (fallbackProducts.length > 0) {
              console.log(`✅ フォールバック検索成功: ${fallbackProducts.length}件`);
              const convertedProducts = fallbackProducts.map(product => this.convertYahooProduct(product, item.type));
              products.push(...convertedProducts);
              continue;
            }
          }
          
          searchErrors.push(`「${searchQuery}」の商品が見つかりませんでした`);
          continue;
        }
        
        const convertedProducts = yahooProducts.map(product => this.convertYahooProduct(product, item.type));
        products.push(...convertedProducts);
        console.log(`✅ ${convertedProducts.length}件の商品を発見: "${searchQuery}"`);
        
      } catch (error) {
        const errorMessage = `「${item.description}」の検索でエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ 検索エラー:`, errorMessage, error);
        searchErrors.push(errorMessage);
      }
    }
    
    // 商品が見つからない場合の最終フォールバック
    if (products.length === 0) {
      console.warn('⚠️ すべての検索が失敗しました。モックデータを使用します。');
      
      // Yahoo Shopping APIが利用できない場合のモックフォールバック
      const mockProducts = await this.createMockProducts(detectedItems);
      if (mockProducts.length > 0) {
        console.log(`🎭 モック商品を生成: ${mockProducts.length}件`);
        return mockProducts;
      }
      
      const errorMessage = searchErrors.length > 0 
        ? `商品検索に失敗しました:\n${searchErrors.join('\n')}\n\nYahoo Shopping APIの設定を確認してください。`
        : '検出されたアイテムに対する商品が見つかりませんでした。Yahoo Shopping APIの接続を確認してください。';
      throw new Error(errorMessage);
    }
    
    // 一部の検索に失敗した場合は警告をログ出力
    if (searchErrors.length > 0) {
      console.warn('Some product searches failed:', searchErrors);
    }
    
    return products.slice(0, 10); // 最大10商品
  }

  private createSearchQuery(item: DetectedItem): string {
    // 英語のアイテム名を日本語に変換
    const typeMap: { [key: string]: string } = {
      // 基本カテゴリ
      'tops': 'トップス',
      'bottoms': 'ボトムス', 
      'dress': 'ワンピース',
      'shoes': '靴',
      'accessories': 'アクセサリー',
      'outer': 'アウター',
      
      // 具体的なアイテム名
      'sweater': 'セーター',
      'shirt': 'シャツ', 
      'blouse': 'ブラウス',
      'top': 'トップス',
      'hoodie': 'パーカー',
      'jacket': 'ジャケット',
      'coat': 'コート',
      'cardigan': 'カーディガン',
      't-shirt': 'Tシャツ',
      'tank top': 'タンクトップ',
      'pants': 'パンツ',
      'jeans': 'ジーンズ',
      'trousers': 'パンツ',
      'shorts': 'ショートパンツ',
      'skirt': 'スカート',
      'leggings': 'レギンス',
      'active pants': 'スポーツパンツ',
      'shoe': '靴',
      'boot': 'ブーツ',
      'sneaker': 'スニーカー',
      'sandal': 'サンダル',
      'heel': 'ヒール',
      'footwear': '靴',
      'loafer': 'ローファー',
      'bag': 'バッグ',
      'purse': 'バッグ',
      'handbag': 'ハンドバッグ',
      'backpack': 'リュック',
      'hat': '帽子',
      'cap': 'キャップ',
      'sunglasses': 'サングラス',
      'watch': '時計',
      'jewelry': 'アクセサリー',
      'necklace': 'ネックレス',
      'bracelet': 'ブレスレット',
      'blazer': 'ジャケット',
      'outerwear': 'アウター'
    };
    
    // アイテムの説明から実際のアイテム名を抽出
    const description = item.description.toLowerCase();
    let itemName = '';
    
    // 具体的なアイテム名を探す
    for (const [english, japanese] of Object.entries(typeMap)) {
      if (description.includes(english.toLowerCase())) {
        itemName = japanese;
        break;
      }
    }
    
    // 見つからない場合はカテゴリベースのマッピングを使用
    if (!itemName) {
      itemName = typeMap[item.type] || item.type;
    }
    
    return itemName;
  }

  private createFallbackQuery(item: DetectedItem): string {
    // フォールバック: 色なしでカテゴリのみ検索
    const typeMap: { [key: string]: string } = {
      'tops': 'トップス',
      'bottoms': 'ボトムス', 
      'dress': 'ワンピース',
      'shoes': '靴',
      'accessories': 'アクセサリー',
      'outer': 'アウター',
      'sweater': 'セーター',
      'shirt': 'シャツ', 
      'pants': 'パンツ',
      'jeans': 'ジーンズ',
      'trousers': 'パンツ'
    };
    
    // アイテムの説明から実際のアイテム名を抽出
    const description = item.description.toLowerCase();
    let itemName = '';
    
    // 具体的なアイテム名を探す
    for (const [english, japanese] of Object.entries(typeMap)) {
      if (description.includes(english.toLowerCase())) {
        itemName = japanese;
        break;
      }
    }
    
    // 見つからない場合はカテゴリベースのマッピングを使用
    if (!itemName) {
      itemName = typeMap[item.type] || item.type;
    }
    
    return itemName;
  }

  private async createMockProducts(detectedItems: DetectedItem[]): Promise<Product[]> {
    const mockProducts: Product[] = [];
    
    detectedItems.forEach((item, index) => {
      const colorCode = item.attributes.colors?.length > 0 
        ? item.attributes.colors[0] 
        : '#888888';
      
      const categoryName = this.createFallbackQuery(item);
      
      // モック商品を生成
      for (let i = 0; i < 2; i++) {
        mockProducts.push({
          id: `mock_${item.id}_${i}`,
          name: `${colorCode}${categoryName} - サンプル商品${i + 1}`,
          price: 1980 + Math.floor(Math.random() * 3000),
          originalPrice: 2980 + Math.floor(Math.random() * 3000),
          imageUrl: '/images/placeholder.svg',
          shopName: 'サンプルブランド',
          shopUrl: '#',
          category: item.type as any,
          tags: [categoryName, colorCode],
          rating: 4.0 + Math.random(),
          reviewCount: Math.floor(Math.random() * 200) + 10
        });
      }
    });
    
    return mockProducts.slice(0, 6);
  }

  private getStyleQuery(style: string): string {
    const styleMap: { [key: string]: string } = {
      'casual': 'カジュアル',
      'formal': 'フォーマル',
      'sporty': 'スポーティ',
      'elegant': 'エレガント',
      'street': 'ストリート'
    };
    
    return styleMap[style] || '';
  }

  private convertYahooProduct(yahooProduct: any, category: string): Product {
    return {
      id: yahooProduct.code || `yahoo_${Math.random().toString(36).substr(2, 9)}`,
      name: yahooProduct.name || yahooProduct.headLine || '商品名不明',
      price: yahooProduct.price || 0,
      originalPrice: yahooProduct.premiumPrice || yahooProduct.price || 0,
      imageUrl: yahooProduct.image?.small || yahooProduct.image?.medium || yahooProduct.exImage?.url || '/images/placeholder.svg',
      shopName: yahooProduct.brand?.name || yahooProduct.seller?.name || 'ブランド名不明',
      shopUrl: yahooProduct.url || '#',
      category: category as any,
      tags: [category],
      rating: yahooProduct.review?.rate ? parseFloat(yahooProduct.review.rate) : undefined,
      reviewCount: yahooProduct.review?.count ? parseInt(yahooProduct.review.count) : undefined,
      similarity: 0.8 + Math.random() * 0.2 // 類似度をランダムに設定
    };
  }

  async inferFashionItems(
    visionResult: GoogleVisionResponse, 
    imageBase64?: string,
    onProgress?: (progress: { current: number; total: number; currentItem: string }) => void
  ): Promise<DetectedItem[]> {
    const items: DetectedItem[] = [];
    const labels = visionResult.labelAnnotations;
    const objects = visionResult.localizedObjectAnnotations || [];
    
    let totalItemsToProcess = 0;
    let processedItems = 0;
    
    // ファッション関連のラベルを分類
    const fashionKeywords = {
      tops: ['shirt', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'coat', 'cardigan', 't-shirt', 'tank top'],
      bottoms: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'bottom'],
      dress: ['dress', 'gown', 'robe', 'frock'],
      shoes: ['shoe', 'boot', 'sneaker', 'sandal', 'heel', 'footwear', 'loafer'],
      accessories: ['bag', 'purse', 'handbag', 'backpack', 'hat', 'cap', 'sunglasses', 'watch', 'jewelry', 'necklace', 'bracelet'],
      outer: ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear']
    };

    // 総処理アイテム数をカウント
    for (const [category, keywords] of Object.entries(fashionKeywords)) {
      const matchingLabels = labels.filter(label => 
        keywords.some(keyword => 
          label.description.toLowerCase().includes(keyword)
        )
      );
      totalItemsToProcess += matchingLabels.length;
    }

    // オブジェクト検出で追加されるアイテム数も計算
    const additionalObjects = objects.filter(obj => 
      !labels.some(label => label.description.toLowerCase().includes(obj.name.toLowerCase()))
    );
    totalItemsToProcess += additionalObjects.filter(obj => this.categorizeObject(obj.name)).length;

    console.log(`🔍 Total items to process: ${totalItemsToProcess}`);

    // ラベルベースの検出
    for (const [category, keywords] of Object.entries(fashionKeywords)) {
      const matchingLabels = labels.filter(label => 
        keywords.some(keyword => 
          label.description.toLowerCase().includes(keyword)
        )
      );

      for (const [index, label] of matchingLabels.entries()) {
        processedItems++;
        const itemName = `${label.description} (${category})`;
        
        onProgress?.({
          current: processedItems,
          total: totalItemsToProcess,
          currentItem: itemName
        });

        console.log(`📊 Processing item ${processedItems}/${totalItemsToProcess}: ${itemName}`);

        const boundingBox = this.findBoundingBox(label.description, objects);
        const attributes = await this.inferAttributes(label.description, visionResult, boundingBox, imageBase64);
        
        items.push({
          id: `${category}_${index}`,
          type: category as any,
          description: this.generateDescription(label.description, attributes),
          confidence: label.score,
          attributes,
          boundingBox
        });
      }
    }

    // オブジェクト検出ベースの補完
    for (const [index, obj] of objects.entries()) {
      if (!items.some(item => item.description.toLowerCase().includes(obj.name.toLowerCase()))) {
        const category = this.categorizeObject(obj.name);
        if (category) {
          processedItems++;
          const itemName = `${obj.name} (${category})`;
          
          onProgress?.({
            current: processedItems,
            total: totalItemsToProcess,
            currentItem: itemName
          });

          console.log(`📊 Processing item ${processedItems}/${totalItemsToProcess}: ${itemName}`);

          const boundingBox = this.convertBoundingBox(obj.boundingPoly);
          const attributes = await this.inferAttributes(obj.name, visionResult, boundingBox, imageBase64);
          
          items.push({
            id: `object_${index}`,
            type: category,
            description: this.generateDescription(obj.name, attributes),
            confidence: obj.score,
            attributes,
            boundingBox
          });
        }
      }
    }

    // 重複するタイプを排除し、多様性を確保
    const uniqueItems = this.removeDuplicateTypes(items);
    return uniqueItems.slice(0, 6); // 最大6個まで
  }

  private async inferAttributes(itemName: string, visionResult: GoogleVisionResponse, boundingBox?: any, imageBase64?: string): Promise<ItemAttributes> {
    // BoundingBoxがある場合は個別に色を抽出、ない場合は全体の色を使用
    const colors = boundingBox && imageBase64 
      ? await this.extractColorsFromBoundingBox(imageBase64, boundingBox)
      : this.extractItemColors(visionResult);
      
    const style = this.inferStyle(itemName);
    const length = this.inferLength(itemName);
    const sleeve = this.inferSleeve(itemName);
    const pattern = this.inferPattern(itemName, visionResult.labelAnnotations);
    const season = this.inferSeason(colors, itemName);

    return {
      colors,
      style,
      length,
      sleeve,
      pattern,
      season
    };
  }

  private extractItemColors(visionResult: GoogleVisionResponse): string[] {
    const dominantColors = visionResult.imagePropertiesAnnotation.dominantColors.colors;
    
    // Vision APIのrawデータをそのまま使用（面積順）
    return dominantColors
      .sort((a, b) => b.pixelFraction - a.pixelFraction)
      .slice(0, 3)
      .map(color => {
        const hex = this.rgbToHex(color.red, color.green, color.blue);
        console.log(`🎨 Raw color: RGB(${color.red}, ${color.green}, ${color.blue}) → ${hex} (${(color.pixelFraction * 100).toFixed(1)}%)`);
        return hex;
      });
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    console.log(`🎨 RGB to Hex: RGB(${r}, ${g}, ${b}) → ${hex}`);
    return hex;
  }

  private calculateSaturation(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const delta = max - min;
    
    if (max === 0) return 0;
    return delta / max;
  }

  private removeDuplicateTypes(items: DetectedItem[]): DetectedItem[] {
    const seenTypes = new Set<string>();
    const uniqueItems: DetectedItem[] = [];
    
    // 信頼度順にソート
    const sortedItems = items.sort((a, b) => b.confidence - a.confidence);
    
    for (const item of sortedItems) {
      if (!seenTypes.has(item.type)) {
        seenTypes.add(item.type);
        uniqueItems.push(item);
      } else {
        console.log(`🚫 Duplicate type removed: ${item.type} - ${item.description}`);
      }
    }
    
    return uniqueItems;
  }

  private async extractColorsFromBoundingBox(imageBase64: string, boundingBox: any): Promise<string[]> {
    try {
      // BoundingBox領域を切り出した画像でVision APIを呼び出し
      const croppedImageBase64 = await this.cropImageWithBoundingBox(imageBase64, boundingBox);
      
      if (!croppedImageBase64) {
        console.warn('⚠️ Could not crop image, falling back to full image colors');
        return [];
      }

      // 切り出した画像でVision APIの色分析を実行
      const visionService = new GoogleVisionService();
      const visionResult = await visionService.analyzeImage(croppedImageBase64);
      
      // 切り出した領域の支配的な色を取得
      const colors = visionResult.imagePropertiesAnnotation.dominantColors.colors
        .sort((a, b) => b.pixelFraction - a.pixelFraction)
        .slice(0, 3)
        .map(color => {
          const hex = this.rgbToHex(color.red, color.green, color.blue);
          console.log(`🎨 BoundingBox color (Vision API): RGB(${color.red}, ${color.green}, ${color.blue}) → ${hex} (${(color.pixelFraction * 100).toFixed(1)}%)`);
          return hex;
        });
      
      console.log(`🎨 Extracted ${colors.length} colors from bounding box using Vision API`);
      return colors;
      
    } catch (error) {
      console.error('❌ Error extracting colors from bounding box:', error);
      return [];
    }
  }

  private async cropImageWithBoundingBox(imageBase64: string, boundingBox: any): Promise<string | null> {
    try {
      // サーバーサイド環境チェック
      if (typeof window !== 'undefined') {
        console.warn('⚠️ Image cropping not available in browser environment');
        return null;
      }

      // サーバーサイドでのみSharpを動的インポート
      const sharp = (await import('sharp')).default;
      
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const { width, height } = await sharp(imageBuffer).metadata();
      
      if (!width || !height) return null;

      // BoundingBoxの座標を実際のピクセル座標に変換
      const left = Math.floor(boundingBox.x * width);
      const top = Math.floor(boundingBox.y * height);
      const cropWidth = Math.floor(boundingBox.width * width);
      const cropHeight = Math.floor(boundingBox.height * height);

      // 座標の境界チェック
      if (left < 0 || top < 0 || cropWidth <= 0 || cropHeight <= 0 || 
          left + cropWidth > width || top + cropHeight > height) {
        console.warn('⚠️ Invalid bounding box coordinates, using full image');
        return imageBase64; // 元の画像をそのまま返す
      }

      console.log(`🔍 Cropping region: ${left}, ${top}, ${cropWidth}x${cropHeight} from ${width}x${height}`);

      // BoundingBox領域を切り出し
      const croppedBuffer = await sharp(imageBuffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .jpeg() // JPEG形式で出力
        .toBuffer();

      // Base64に変換して返す
      return croppedBuffer.toString('base64');
      
    } catch (error) {
      console.error('❌ Error cropping image:', error);
      return null;
    }
  }


  private inferStyle(itemName: string): 'casual' | 'formal' | 'sporty' | 'elegant' | 'street' {
    const name = itemName.toLowerCase();
    
    if (name.includes('suit') || name.includes('blazer') || name.includes('formal')) return 'formal';
    if (name.includes('sport') || name.includes('athletic') || name.includes('sneaker')) return 'sporty';
    if (name.includes('elegant') || name.includes('dress') || name.includes('gown')) return 'elegant';
    if (name.includes('street') || name.includes('urban') || name.includes('denim')) return 'street';
    
    return 'casual';
  }

  private inferLength(itemName: string): 'short' | 'medium' | 'long' | undefined {
    const name = itemName.toLowerCase();
    
    if (name.includes('short') || name.includes('mini')) return 'short';
    if (name.includes('long') || name.includes('maxi')) return 'long';
    if (name.includes('midi') || name.includes('knee')) return 'medium';
    
    return undefined;
  }

  private inferSleeve(itemName: string): 'sleeveless' | 'short' | 'long' | undefined {
    const name = itemName.toLowerCase();
    
    if (name.includes('sleeveless') || name.includes('tank')) return 'sleeveless';
    if (name.includes('short sleeve') || name.includes('t-shirt')) return 'short';
    if (name.includes('long sleeve') || name.includes('sweater')) return 'long';
    
    return undefined;
  }

  private inferPattern(itemName: string, labels: any[]): 'solid' | 'striped' | 'floral' | 'geometric' | 'animal' | undefined {
    const name = itemName.toLowerCase();
    const allLabels = labels.map(l => l.description.toLowerCase()).join(' ');
    
    if (name.includes('stripe') || allLabels.includes('stripe')) return 'striped';
    if (name.includes('floral') || allLabels.includes('flower')) return 'floral';
    if (name.includes('geometric') || allLabels.includes('pattern')) return 'geometric';
    if (name.includes('animal') || allLabels.includes('leopard') || allLabels.includes('zebra')) return 'animal';
    
    return 'solid';
  }

  private inferSeason(colors: string[], itemName: string): 'spring' | 'summer' | 'autumn' | 'winter' | undefined {
    const name = itemName.toLowerCase();
    
    // アイテム名から推定
    if (name.includes('coat') || name.includes('sweater')) return 'winter';
    if (name.includes('shorts') || name.includes('tank')) return 'summer';
    
    // 色から推定
    const warmColors = ['#FF', '#FFA', '#FF6', '#FF9'];
    const coolColors = ['#00', '#66', '#99', '#CC'];
    
    const hasWarmColors = colors.some(color => warmColors.some(warm => color.includes(warm)));
    const hasCoolColors = colors.some(color => coolColors.some(cool => color.includes(cool)));
    
    if (hasWarmColors) return 'autumn';
    if (hasCoolColors) return 'winter';
    
    return 'spring';
  }

  private categorizeObject(objectName: string): DetectedItem['type'] | null {
    const name = objectName.toLowerCase();
    
    if (name.includes('clothing') || name.includes('shirt') || name.includes('top')) return 'tops';
    if (name.includes('pants') || name.includes('jeans') || name.includes('bottom')) return 'bottoms';
    if (name.includes('dress')) return 'dress';
    if (name.includes('shoe') || name.includes('footwear')) return 'shoes';
    if (name.includes('bag') || name.includes('accessory')) return 'accessories';
    if (name.includes('jacket') || name.includes('coat')) return 'outer';
    
    return null;
  }

  private findBoundingBox(itemName: string, objects: any[]): any {
    const matchingObject = objects.find(obj => 
      obj.name.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(obj.name.toLowerCase())
    );
    
    return matchingObject ? this.convertBoundingBox(matchingObject.boundingPoly) : undefined;
  }

  private convertBoundingBox(boundingPoly: any): any {
    if (!boundingPoly?.normalizedVertices?.length) return undefined;
    
    const vertices = boundingPoly.normalizedVertices;
    const minX = Math.min(...vertices.map((v: any) => v.x));
    const minY = Math.min(...vertices.map((v: any) => v.y));
    const maxX = Math.max(...vertices.map((v: any) => v.x));
    const maxY = Math.max(...vertices.map((v: any) => v.y));
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private generateDescription(itemName: string, attributes: ItemAttributes): string {
    // HTMLタグを生成せず、シンプルなテキストのみ返す
    return itemName;
  }

  private getColorName(hex: string): string {
    const colorMap: { [key: string]: string } = {
      '#FF0000': '赤',
      '#DC143C': '赤', 
      '#B22222': '赤',
      '#00FF00': '緑',
      '#008000': '緑',
      '#228B22': '緑',
      '#0000FF': '青',
      '#0066CC': '青',
      '#4169E1': '青',
      '#FFFF00': '黄色',
      '#FFD700': '黄色',
      '#FFA500': 'オレンジ',
      '#FF4500': 'オレンジ',
      '#800080': '紫',
      '#9370DB': '紫',
      '#FF1493': 'ピンク',
      '#FFB6C1': 'ピンク',
      '#FFC0CB': 'ピンク',
      '#FF69B4': 'ピンク',
      '#000000': '黒',
      '#2F2F2F': '黒',
      '#FFFFFF': '白',
      '#F5F5F5': '白',
      '#808080': 'グレー',
      '#A9A9A9': 'グレー',
      '#696969': 'グレー',
      '#D3D3D3': 'グレー',
      '#8B4513': '茶色',
      '#A0522D': '茶色',
      '#D2691E': '茶色',
      '#F0E68C': 'ベージュ',
      '#DEB887': 'ベージュ',
      '#F5DEB3': 'ベージュ'
    };
    
    // RGBからHSLに変換して色相で判定
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 'グレー';
    
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const lightness = hsl.l;
    const saturation = hsl.s;
    
    // 彩度が低い場合は無彩色として判定
    if (saturation < 0.1) {
      if (lightness > 0.9) return '白';
      if (lightness < 0.1) return '黒';
      return 'グレー';
    }
    
    // 近似色を見つける
    let closestColor = 'グレー';
    let minDistance = Infinity;
    
    Object.entries(colorMap).forEach(([colorHex, colorName]) => {
      const distance = this.colorDistance(hex, colorHex);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = colorName;
      }
    });
    
    return closestColor;
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHsl(r: number, g: number, b: number): {h: number, s: number, l: number} {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {h, s, l};
  }

  private colorDistance(hex1: string, hex2: string): number {
    const r1 = parseInt(hex1.substr(1, 2), 16);
    const g1 = parseInt(hex1.substr(3, 2), 16);
    const b1 = parseInt(hex1.substr(5, 2), 16);
    
    const r2 = parseInt(hex2.substr(1, 2), 16);
    const g2 = parseInt(hex2.substr(3, 2), 16);
    const b2 = parseInt(hex2.substr(5, 2), 16);
    
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }

  extractColorPalette(visionResult: GoogleVisionResponse): { colors: string[], colorInfo: Array<{hex: string, percentage: number, rgb: {r: number, g: number, b: number}}> } {
    const colors = visionResult.imagePropertiesAnnotation.dominantColors.colors;
    
    // Vision APIのrawデータをそのまま使用（面積順）
    const processedColors = colors
      .sort((a, b) => b.pixelFraction - a.pixelFraction)
      .slice(0, 5);

    const hexColors = processedColors.map(color => {
      const hex = this.rgbToHex(color.red, color.green, color.blue);
      console.log(`🎨 Palette color: RGB(${color.red}, ${color.green}, ${color.blue}) → ${hex} (${(color.pixelFraction * 100).toFixed(1)}%)`);
      return hex;
    });

    const colorInfo = processedColors.map(color => ({
      hex: this.rgbToHex(color.red, color.green, color.blue),
      percentage: Math.round(color.pixelFraction * 100),
      rgb: { r: color.red, g: color.green, b: color.blue }
    }));

    return {
      colors: hexColors,
      colorInfo
    };
  }

  inferOverallStyle(labels: any[]): string {
    const styleKeywords = {
      'ガーリーカジュアル': ['cute', 'sweet', 'girly', 'casual'],
      'エレガント': ['elegant', 'sophisticated', 'formal', 'classy'],
      'ストリート': ['street', 'urban', 'edgy', 'hip'],
      'スポーティ': ['sport', 'athletic', 'active', 'sporty'],
      'フェミニン': ['feminine', 'soft', 'delicate', 'romantic']
    };
    
    const labelText = labels.map(l => l.description.toLowerCase()).join(' ');
    
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => labelText.includes(keyword))) {
        return style;
      }
    }
    
    return 'カジュアル';
  }

  calculateOverallConfidence(items: DetectedItem[]): number {
    if (items.length === 0) return 0;
    
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private convertToGeminiFormat(detectedItems: DetectedItem[]): VisionAnalysisData {
    // Vision APIの結果をGemini用の形式に変換
    const labels = detectedItems.map(item => ({
      description: item.description,
      score: item.confidence
    }));
    
    // 色情報を抽出
    const allColors = new Map<string, number>();
    detectedItems.forEach(item => {
      item.attributes.colors?.forEach(colorHex => {
        const rgb = this.hexToRgb(colorHex);
        if (rgb) {
          const key = `${rgb.r},${rgb.g},${rgb.b}`;
          allColors.set(key, (allColors.get(key) || 0) + 1);
        }
      });
    });
    
    // 頻度順に色をソート
    const colors = Array.from(allColors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rgbStr, count]) => {
        const [r, g, b] = rgbStr.split(',').map(Number);
        return {
          color: { red: r, green: g, blue: b },
          score: count / detectedItems.length,
          pixelFraction: 0.1
        };
      });
    
    // オブジェクト情報
    const objects = detectedItems.map(item => ({
      name: item.type,
      score: item.confidence
    }));
    
    return {
      labels,
      colors,
      objects
    };
  }

  private convertVisionResponseToGeminiFormat(visionResult: GoogleVisionResponse, characterPersonality?: 'kurisu' | 'marin'): VisionAnalysisData {
    // 元のVision APIレスポンスを直接Gemini形式に変換
    const labels = visionResult.labelAnnotations.map(label => ({
      description: label.description,
      score: label.score
    }));
    
    const colors = visionResult.imagePropertiesAnnotation.dominantColors.colors
      .slice(0, 10)
      .map(color => ({
        color: {
          red: color.red,
          green: color.green,
          blue: color.blue
        },
        score: color.score,
        pixelFraction: color.pixelFraction
      }));
    
    const objects = (visionResult.localizedObjectAnnotations || []).map(obj => ({
      name: obj.name,
      score: obj.score
    }));
    
    return {
      labels,
      colors,
      objects,
      characterPersonality
    };
  }

  private inferCategoryFromQuery(query: string, detectedItems: DetectedItem[]): string {
    const queryLower = query.toLowerCase();
    
    // クエリから直接カテゴリを推測
    if (queryLower.includes('ジャケット') || queryLower.includes('コート') || queryLower.includes('アウター')) {
      return 'outer';
    } else if (queryLower.includes('シャツ') || queryLower.includes('ニット') || queryLower.includes('トップス')) {
      return 'tops';
    } else if (queryLower.includes('パンツ') || queryLower.includes('スカート') || queryLower.includes('ボトムス')) {
      return 'bottoms';
    } else if (queryLower.includes('ワンピース')) {
      return 'dress';
    } else if (queryLower.includes('靴') || queryLower.includes('スニーカー') || queryLower.includes('ブーツ')) {
      return 'shoes';
    } else if (queryLower.includes('バッグ') || queryLower.includes('アクセサリー')) {
      return 'accessories';
    }
    
    // コーデ系のクエリの場合は最初に検出されたアイテムのカテゴリを使用
    if (queryLower.includes('コーデ') || queryLower.includes('セット')) {
      return detectedItems[0]?.type || 'tops';
    }
    
    // デフォルトは最初に検出されたアイテムのカテゴリ
    return detectedItems[0]?.type || 'tops';
  }
}