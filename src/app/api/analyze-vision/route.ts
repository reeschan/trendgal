import { NextRequest, NextResponse } from 'next/server';
import { GoogleVisionService } from '@/services/api/googleVision';
import { AttributeInferenceService } from '@/services/analysis/attributeInference';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, filename } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Service Account key not configured' },
        { status: 500 }
      );
    }

    console.log('🔍 Starting Vision API analysis for:', filename || 'unknown file');

    // Google Vision APIで画像解析のみ実行
    const visionService = new GoogleVisionService();
    const visionResult = await visionService.analyzeImage(imageBase64);

    console.log('✅ Vision API result:', {
      labelCount: visionResult.labelAnnotations.length,
      objectCount: visionResult.localizedObjectAnnotations?.length || 0,
      colorCount: visionResult.imagePropertiesAnnotation.dominantColors.colors.length
    });

    // 検出されたアイテムのみを即座に処理（商品検索は行わない）
    const inferenceService = new AttributeInferenceService();
    const detectedItems = inferenceService.inferFashionItems(visionResult);
    const colorPalette = inferenceService.extractColorPalette(visionResult);
    const overallStyle = inferenceService.inferOverallStyle(visionResult.labelAnnotations);

    console.log('🎯 Vision analysis completed immediately:', {
      itemCount: detectedItems.length,
      overallStyle: overallStyle,
      confidence: inferenceService.calculateOverallConfidence(detectedItems)
    });

    // Vision解析結果のみを返す（商品推薦は含まない）
    return NextResponse.json({
      success: true,
      data: {
        detectedItems,
        overallStyle,
        colorPalette,
        confidence: inferenceService.calculateOverallConfidence(detectedItems)
      },
      visionResult, // Gemini用に元のVision結果も含める
      debug: process.env.NODE_ENV === 'development' ? {
        visionLabels: visionResult.labelAnnotations.slice(0, 10),
        visionObjects: visionResult.localizedObjectAnnotations?.slice(0, 5),
        dominantColors: visionResult.imagePropertiesAnnotation.dominantColors.colors.slice(0, 5)
      } : undefined
    });

  } catch (error) {
    console.error('❌ Vision analysis error:', error);
    
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