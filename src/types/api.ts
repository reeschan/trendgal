export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface ImageAnalysisRequest {
  imageBase64: string;
  filename: string;
}

export interface ProductSearchRequest {
  keywords: string[];
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'price' | 'popularity' | 'rating' | 'similarity';
  limit?: number;
}

export interface RakutenSearchParams {
  keyword: string;
  genreId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'standard' | 'sales' | 'price' | '-price' | 'reviewCount' | 'reviewAverage';
  hits?: number;
  page?: number;
}

export interface RakutenProduct {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  mediumImageUrls: Array<{ imageUrl: string }>;
  shopName: string;
  shopUrl: string;
  reviewCount: number;
  reviewAverage: number;
  genreId: string;
  itemCode: string;
  tags?: string[];
}

export interface GalMessage {
  id: string;
  text: string;
  type: 'greeting' | 'analysis' | 'recommendation' | 'reaction' | 'thinking';
  mood: 'excited' | 'thinking' | 'happy' | 'surprised' | 'winking';
  timestamp: Date;
}