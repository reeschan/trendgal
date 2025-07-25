import { NextRequest, NextResponse } from 'next/server';
import { GoogleVisionService } from '@/services/api/googleVision';
import { AttributeInferenceService } from '@/services/analysis/attributeInference';

/*
 * フロントエンドでの使用例:
 * 
 * const eventSource = new EventSource('/api/analyze-vision', {
 *   method: 'POST',
 *   body: JSON.stringify({ imageBase64, filename, streaming: true })
 * });
 * 
 * eventSource.addEventListener('progress', (event) => {
 *   const data = JSON.parse(event.data);
 *   setProgress(data.percentage);
 *   setCurrentItem(data.currentItem);
 * });
 * 
 * eventSource.addEventListener('complete', (event) => {
 *   const data = JSON.parse(event.data);
 *   setAnalysisResult(data);
 *   eventSource.close();
 * });
 */

async function handleStreamingAnalysis(imageBase64: string, filename?: string) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // SSEヘッダー情報を送信
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          console.log(`📡 Sending SSE event: ${event}`, data);
          controller.enqueue(encoder.encode(message));
        };

        sendEvent('start', { message: 'Vision API analysis started', filename });

        // Google Vision API解析
        const visionService = new GoogleVisionService();
        const visionResult = await visionService.analyzeImage(imageBase64);
        
        sendEvent('vision-complete', {
          labelCount: visionResult.labelAnnotations.length,
          objectCount: visionResult.localizedObjectAnnotations?.length || 0,
          colorCount: visionResult.imagePropertiesAnnotation.dominantColors.colors.length
        });

        // アイテム検出処理
        const inferenceService = new AttributeInferenceService();
        const detectedItems = await inferenceService.inferFashionItems(
          visionResult,
          imageBase64,
          (progress) => {
            sendEvent('progress', {
              current: progress.current,
              total: progress.total,
              percentage: Math.round((progress.current / progress.total) * 100),
              currentItem: progress.currentItem
            });
          }
        );

        // 色パレット抽出
        const colorPaletteResult = inferenceService.extractColorPalette(visionResult);
        const overallStyle = inferenceService.inferOverallStyle(visionResult.labelAnnotations);

        // プログレス統計情報
        const progressStats = {
          totalItemsDetected: detectedItems.length,
          itemsWithBoundingBox: detectedItems.filter(item => item.boundingBox).length,
          itemsWithIndividualColors: detectedItems.filter(item => item.attributes.colors.length > 0).length,
          colorAnalysisSuccessRate: detectedItems.length > 0 
            ? Math.round((detectedItems.filter(item => item.attributes.colors.length > 0).length / detectedItems.length) * 100)
            : 0
        };

        // 最終結果を送信
        sendEvent('complete', {
          success: true,
          data: {
            detectedItems,
            overallStyle,
            colorPalette: colorPaletteResult.colors,
            colorPaletteInfo: colorPaletteResult.colorInfo,
            confidence: inferenceService.calculateOverallConfidence(detectedItems),
            progressStats
          }
        });

        controller.close();
      } catch (error) {
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        sendEvent('error', {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, filename, streaming } = await request.json();
    
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

    // ストリーミングが要求された場合
    console.log('📡 Streaming parameter:', streaming);
    if (streaming) {
      console.log('📡 Switching to streaming mode');
      return handleStreamingAnalysis(imageBase64, filename);
    }
    
    console.log('📡 Using regular mode');

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
    
    // プログレス情報をログ出力
    const detectedItems = await inferenceService.inferFashionItems(
      visionResult, 
      imageBase64,
      (progress) => {
        console.log(`🎯 Analysis Progress: ${progress.current}/${progress.total} (${Math.round(progress.current / progress.total * 100)}%) - ${progress.currentItem}`);
      }
    );
    
    const colorPaletteResult = inferenceService.extractColorPalette(visionResult);
    const colorPalette = colorPaletteResult.colors;
    const overallStyle = inferenceService.inferOverallStyle(visionResult.labelAnnotations);

    console.log('🎯 Vision analysis completed:', {
      itemCount: detectedItems.length,
      overallStyle: overallStyle,
      confidence: inferenceService.calculateOverallConfidence(detectedItems),
      itemsWithBoundingBox: detectedItems.filter(item => item.boundingBox).length,
      itemsWithIndividualColors: detectedItems.filter(item => item.attributes.colors.length > 0).length
    });

    // プログレス統計情報
    const progressStats = {
      totalItemsDetected: detectedItems.length,
      itemsWithBoundingBox: detectedItems.filter(item => item.boundingBox).length,
      itemsWithIndividualColors: detectedItems.filter(item => item.attributes.colors.length > 0).length,
      colorAnalysisSuccessRate: detectedItems.length > 0 
        ? Math.round((detectedItems.filter(item => item.attributes.colors.length > 0).length / detectedItems.length) * 100)
        : 0
    };

    // Vision解析結果のみを返す（商品推薦は含まない）
    return NextResponse.json({
      success: true,
      data: {
        detectedItems,
        overallStyle,
        colorPalette,
        colorPaletteInfo: colorPaletteResult.colorInfo,
        confidence: inferenceService.calculateOverallConfidence(detectedItems),
        progressStats
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