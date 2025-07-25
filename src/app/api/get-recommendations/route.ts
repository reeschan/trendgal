import { NextRequest, NextResponse } from 'next/server';
import { AttributeInferenceService } from '@/services/analysis/attributeInference';
import { DetectedItem } from '@/types/product';
import { GoogleVisionResponse } from '@/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const { detectedItems, visionResult, characterPersonality } = await request.json() as {
      detectedItems: DetectedItem[];
      visionResult?: GoogleVisionResponse;
      characterPersonality?: 'kurisu' | 'marin';
    };
    
    if (!detectedItems || detectedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Detected items are required' },
        { status: 400 }
      );
    }

    console.log('🛍️ Starting product recommendation search...');
    console.log(`📊 Processing ${detectedItems.length} detected items`);

    // 商品推薦を取得
    const inferenceService = new AttributeInferenceService();
    
    // searchSimilarProductsメソッドを直接呼び出すためにpublicメソッドとして公開
    const recommendations = await inferenceService.searchSimilarProducts(detectedItems, visionResult, characterPersonality);

    console.log('✅ Product recommendations completed:', {
      recommendationCount: recommendations.length
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations
      }
    });

  } catch (error) {
    console.error('❌ Recommendation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = process.env.NODE_ENV === 'development' ? {
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    } : undefined;

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}