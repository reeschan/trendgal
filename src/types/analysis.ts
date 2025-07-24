export interface VisionLabel {
  description: string;
  score: number;
  mid?: string;
}

export interface VisionColor {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
  score: number;
  pixelFraction: number;
}

export interface VisionObject {
  name: string;
  score: number;
  boundingPoly: {
    normalizedVertices: Array<{
      x: number;
      y: number;
    }>;
  };
}

export interface GoogleVisionResponse {
  labelAnnotations: VisionLabel[];
  imagePropertiesAnnotation: {
    dominantColors: {
      colors: VisionColor[];
    };
  };
  localizedObjectAnnotations?: VisionObject[];
}

export interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
}