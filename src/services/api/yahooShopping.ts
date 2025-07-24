export interface YahooShoppingProduct {
  index: number;
  name: string;
  description: string;
  headLine: string;
  url: string;
  inStock: boolean;
  code: string;
  condition: string;
  imageId: string;
  image: {
    small?: string;
    medium?: string;
  };
  review: {
    rate?: string;
    count?: string;
  };
  affiliateRate: number;
  price: number;
  premiumPrice: number;
  premiumPriceStatus: boolean;
  premiumDiscountRate?: number;
  premiumDiscountType?: string;
  priceLabel: any;
  point: any;
  shipping: any;
  genreCategory: any;
  parentGenreCategories: any[];
  brand: {
    name?: string;
  };
  parentBrands: any[];
  janCode: string;
  payment: string;
  releaseDate?: string;
  seller: {
    name?: string;
  };
  delivery: any;
  exImage: {
    url?: string;
  };
}

export interface YahooShoppingResponse {
  totalResultsAvailable: number;
  totalResultsReturned: number;
  firstResultsPosition: number;
  request: {
    query: string;
  };
  hits: YahooShoppingProduct[];
  // 旧形式との互換性のため
  ResultSet?: {
    Result: YahooShoppingProduct[];
    totalResultsReturned: number;
    totalResultsAvailable: number;
  };
}

export class YahooShoppingService {
  private clientId: string;
  private baseUrl = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';

  constructor() {
    const clientId = process.env.YAHOO_CLIENT_ID;
    if (!clientId) {
      console.error('❌ YAHOO_CLIENT_ID環境変数が設定されていません');
      throw new Error('YAHOO_CLIENT_ID environment variable is not set');
    }
    
    console.log('🔑 Yahoo Shopping API 初期化:', {
      clientIdLength: clientId.length,
      clientIdPreview: clientId.substring(0, 10) + '...',
      hasClientId: !!clientId
    });
    
    this.clientId = clientId;
  }

  async searchProducts(query: string, options?: {
    results?: number;
    sort?: 'score' | '-score' | 'price' | '-price' | 'review_count' | '-review_count';
    category_id?: string;
    price_from?: number;
    price_to?: number;
  }): Promise<YahooShoppingProduct[]> {
    try {
      const params = new URLSearchParams({
        appid: this.clientId,
        query: query,
        results: (options?.results || 20).toString(),
        image_size: 'medium',
        ...(options?.sort && { sort: options.sort }),
        ...(options?.category_id && { category_id: options.category_id }),
        ...(options?.price_from && { price_from: options.price_from.toString() }),
        ...(options?.price_to && { price_to: options.price_to.toString() }),
      });

      const url = `${this.baseUrl}?${params}`;
      console.log('🔍 Yahoo Shopping API リクエスト:', {
        url: url,
        query: query,
        options: options,
        clientId: this.clientId.substring(0, 10) + '...' // セキュリティのため一部のみ表示
      });

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Yahoo Shopping API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 400) {
          throw new Error(`不正なリクエストです。クエリ: "${query}"`);
        } else if (response.status === 401) {
          throw new Error('Yahoo Shopping APIの認証に失敗しました。Client IDを確認してください。');
        } else if (response.status === 403) {
          throw new Error('Yahoo Shopping APIへのアクセスが拒否されました。API制限を確認してください。');
        } else if (response.status >= 500) {
          throw new Error('Yahoo Shopping APIサーバーエラーが発生しました。しばらく後に再試行してください。');
        } else {
          throw new Error(`Yahoo Shopping API error: ${response.status} ${response.statusText}`);
        }
      }

      const data: YahooShoppingResponse = await response.json();
      
      console.log('📦 Yahoo Shopping API レスポンス:', {
        query: query,
        totalResults: data.totalResultsAvailable || 0,
        returnedResults: data.totalResultsReturned || 0,
        hasHits: !!data.hits,
        hitLength: data.hits?.length || 0,
        rawResponse: process.env.NODE_ENV === 'development' ? data : '[hidden in production]'
      });

      // 新しいAPIレスポンス構造をチェック
      if (data.hits && data.hits.length > 0) {
        console.log(`✅ ${data.hits.length}件の商品を取得: "${query}"`);
        return data.hits;
      }

      // 従来のResultSet構造もサポート（後方互換性）
      if (data.ResultSet && data.ResultSet.Result && data.ResultSet.Result.length > 0) {
        console.log(`✅ ${data.ResultSet.Result.length}件の商品を取得（ResultSet形式）: "${query}"`);
        return data.ResultSet.Result;
      }

      console.warn(`⚠️ 検索結果が0件: "${query}"`);
      console.log('レスポンスの詳細:', {
        totalResultsAvailable: data.totalResultsAvailable || (data.ResultSet?.totalResultsAvailable),
        totalResultsReturned: data.totalResultsReturned || (data.ResultSet?.totalResultsReturned),
        hasHits: !!data.hits,
        hasResultSet: !!(data.ResultSet)
      });
      return [];
    } catch (error) {
      console.error('Error searching Yahoo Shopping products:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Yahoo Shopping API検索中に予期しないエラーが発生しました: ${String(error)}`);
      }
    }
  }

  async searchByCategory(categoryQuery: string, options?: {
    results?: number;
    priceRange?: { min: number; max: number };
  }): Promise<YahooShoppingProduct[]> {
    return this.searchProducts(categoryQuery, {
      results: options?.results,
      sort: '-score',
      ...(options?.priceRange && {
        price_from: options.priceRange.min,
        price_to: options.priceRange.max,
      }),
    });
  }

  async searchSimilarProducts(productName: string, brand?: string): Promise<YahooShoppingProduct[]> {
    const query = brand ? `${productName} ${brand}` : productName;
    return this.searchProducts(query, {
      results: 10,
      sort: '-score',
    });
  }

  // 価格帯で絞り込み
  async searchByPriceRange(query: string, minPrice: number, maxPrice: number): Promise<YahooShoppingProduct[]> {
    return this.searchProducts(query, {
      results: 20,
      price_from: minPrice,
      price_to: maxPrice,
      sort: 'price',
    });
  }
}