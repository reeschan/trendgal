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

    console.log('Starting image analysis for:', filename || 'unknown file');

    // Google Vision APIで画像解析
    const visionService = new GoogleVisionService();
    const visionResult = await visionService.analyzeImage(imageBase64);

    console.log('Vision API result:', {
      labelCount: visionResult.labelAnnotations.length,
      objectCount: visionResult.localizedObjectAnnotations?.length || 0,
      colorCount: visionResult.imagePropertiesAnnotation.dominantColors.colors.length
    });

    // カスタム属性推定
    const inferenceService = new AttributeInferenceService();
    const analysisResult = await inferenceService.processVisionResult(visionResult);

    console.log('Analysis completed:', {
      itemCount: analysisResult.detectedItems.length,
      overallStyle: analysisResult.overallStyle,
      confidence: analysisResult.confidence,
      recommendationCount: analysisResult.recommendations.length
    });

    return NextResponse.json({
      success: true,
      data: analysisResult,
      debug: process.env.NODE_ENV === 'development' ? {
        visionLabels: visionResult.labelAnnotations.slice(0, 10),
        visionObjects: visionResult.localizedObjectAnnotations?.slice(0, 5),
        dominantColors: visionResult.imagePropertiesAnnotation.dominantColors.colors.slice(0, 5)
      } : undefined
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // エラーの詳細を返す（開発環境のみ）
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

// ヘルスチェック用
export async function GET() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Service account key not configured' },
        { status: 500 }
      );
    }

    const visionService = new GoogleVisionService();
    const isConnected = await visionService.testConnection();

    return NextResponse.json({
      status: isConnected ? 'ok' : 'error',
      message: isConnected ? 'Vision API connection successful' : 'Vision API connection failed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Health check failed' 
      },
      { status: 500 }
    );
  }
}