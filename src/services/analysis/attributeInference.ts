import { GoogleVisionResponse } from '@/types/analysis';
import { DetectedItem, AnalysisResult, ItemAttributes, Product } from '@/types/product';
import { YahooShoppingService } from '@/services/api/yahooShopping';

export class AttributeInferenceService {
  private yahooShopping: YahooShoppingService;

  constructor() {
    this.yahooShopping = new YahooShoppingService();
  }
  
  async processVisionResult(visionResult: GoogleVisionResponse): Promise<AnalysisResult> {
    const detectedItems = this.inferFashionItems(visionResult);
    const colorPalette = this.extractColorPalette(visionResult);
    const overallStyle = this.inferOverallStyle(visionResult.labelAnnotations);
    
    // 検出されたアイテムに基づいて商品を検索
    const recommendations = await this.searchSimilarProducts(detectedItems);
    
    return {
      detectedItems,
      overallStyle,
      colorPalette,
      recommendations,
      confidence: this.calculateOverallConfidence(detectedItems)
    };
  }

  private async searchSimilarProducts(detectedItems: DetectedItem[]): Promise<Product[]> {
    const products: Product[] = [];
    const searchErrors: string[] = [];
    
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
    
    // 代表色（最初の色）のみを使用
    const colorQuery = item.attributes.colors?.length > 0 
      ? this.getColorName(item.attributes.colors[0]) 
      : '';
    
    // 単色 + カテゴリの形式で検索クエリを作成
    if (colorQuery && colorQuery !== '色') {
      return `${colorQuery} ${itemName}`;
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
      const colorName = item.attributes.colors?.length > 0 
        ? this.getColorName(item.attributes.colors[0]) 
        : 'カラー';
      
      const categoryName = this.createFallbackQuery(item);
      
      // モック商品を生成
      for (let i = 0; i < 2; i++) {
        mockProducts.push({
          id: `mock_${item.id}_${i}`,
          name: `${colorName}${categoryName} - サンプル商品${i + 1}`,
          price: 1980 + Math.floor(Math.random() * 3000),
          originalPrice: 2980 + Math.floor(Math.random() * 3000),
          imageUrl: '/images/placeholder.svg',
          shopName: 'サンプルブランド',
          shopUrl: '#',
          category: item.type as any,
          tags: [categoryName, colorName],
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
      id: `yahoo_${Math.random().toString(36).substr(2, 9)}`,
      name: yahooProduct.Name,
      price: parseInt(yahooProduct.Price) || 0,
      originalPrice: parseInt(yahooProduct.Price) || 0,
      imageUrl: yahooProduct.Image?.Medium || yahooProduct.Image?.Small || '',
      shopName: yahooProduct.Brand || 'ブランド名不明',
      shopUrl: yahooProduct.Url,
      category: category as any,
      tags: [category],
      rating: yahooProduct.Review?.Rate ? parseFloat(yahooProduct.Review.Rate) : undefined,
      reviewCount: yahooProduct.Review?.Count ? parseInt(yahooProduct.Review.Count) : undefined
    };
  }

  private inferFashionItems(visionResult: GoogleVisionResponse): DetectedItem[] {
    const items: DetectedItem[] = [];
    const labels = visionResult.labelAnnotations;
    const objects = visionResult.localizedObjectAnnotations || [];
    
    // ファッション関連のラベルを分類
    const fashionKeywords = {
      tops: ['shirt', 'blouse', 'top', 'sweater', 'hoodie', 'jacket', 'coat', 'cardigan', 't-shirt', 'tank top'],
      bottoms: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'bottom'],
      dress: ['dress', 'gown', 'robe', 'frock'],
      shoes: ['shoe', 'boot', 'sneaker', 'sandal', 'heel', 'footwear', 'loafer'],
      accessories: ['bag', 'purse', 'handbag', 'backpack', 'hat', 'cap', 'sunglasses', 'watch', 'jewelry', 'necklace', 'bracelet'],
      outer: ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear']
    };

    // ラベルベースの検出
    Object.entries(fashionKeywords).forEach(([category, keywords]) => {
      const matchingLabels = labels.filter(label => 
        keywords.some(keyword => 
          label.description.toLowerCase().includes(keyword)
        )
      );

      matchingLabels.forEach((label, index) => {
        const attributes = this.inferAttributes(label.description, visionResult);
        
        items.push({
          id: `${category}_${index}`,
          type: category as any,
          description: this.generateDescription(label.description, attributes),
          confidence: label.score,
          attributes,
          boundingBox: this.findBoundingBox(label.description, objects)
        });
      });
    });

    // オブジェクト検出ベースの補完
    objects.forEach((obj, index) => {
      if (!items.some(item => item.description.toLowerCase().includes(obj.name.toLowerCase()))) {
        const category = this.categorizeObject(obj.name);
        if (category) {
          const attributes = this.inferAttributes(obj.name, visionResult);
          
          items.push({
            id: `object_${index}`,
            type: category,
            description: this.generateDescription(obj.name, attributes),
            confidence: obj.score,
            attributes,
            boundingBox: this.convertBoundingBox(obj.boundingPoly)
          });
        }
      }
    });

    return items.slice(0, 6); // 最大6個まで
  }

  private inferAttributes(itemName: string, visionResult: GoogleVisionResponse): ItemAttributes {
    const colors = this.extractItemColors(visionResult);
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
    
    return dominantColors
      .sort((a, b) => b.pixelFraction - a.pixelFraction)
      .slice(0, 3)
      .map(color => this.rgbToHex(color.red, color.green, color.blue));
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
    const colorNames = attributes.colors.map(color => this.getColorName(color));
    const colorText = colorNames.length > 0 ? colorNames.join('・') + 'の' : '';
    
    return `${colorText}${itemName}`;
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

  private extractColorPalette(visionResult: GoogleVisionResponse): string[] {
    return visionResult.imagePropertiesAnnotation.dominantColors.colors
      .sort((a, b) => b.pixelFraction - a.pixelFraction)
      .slice(0, 5)
      .map(color => this.rgbToHex(color.red, color.green, color.blue));
  }

  private inferOverallStyle(labels: any[]): string {
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

  private calculateOverallConfidence(items: DetectedItem[]): number {
    if (items.length === 0) return 0;
    
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    return Math.round(avgConfidence * 100) / 100;
  }
}