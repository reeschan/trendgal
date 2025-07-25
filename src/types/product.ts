export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  shopName: string;
  shopUrl: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'dress' | 'outer';
  tags: string[];
  similarity?: number;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  colors?: string[];
}

export interface DetectedItem {
  id: string;
  type: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'dress' | 'outer';
  description: string;
  boundingBox?: BoundingBox;
  confidence: number;
  attributes: ItemAttributes;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ItemAttributes {
  colors: string[];
  style: 'casual' | 'formal' | 'sporty' | 'elegant' | 'street';
  length?: 'short' | 'medium' | 'long';
  sleeve?: 'sleeveless' | 'short' | 'long';
  pattern?: 'solid' | 'striped' | 'floral' | 'geometric' | 'animal';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  material?: string;
}

export interface AnalysisResult {
  detectedItems: DetectedItem[];
  overallStyle: string;
  colorPalette: string[];
  colorPaletteInfo?: ColorInfo[];
  recommendations: Product[];
  confidence: number;
}

export interface Color {
  hex: string;
  name: string;
  percentage: number;
}

export interface ColorInfo {
  hex: string;
  percentage: number;
  rgb: { r: number; g: number; b: number };
}