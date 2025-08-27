#!/usr/bin/env node

/**
 * LLaVA Vision Model 테스트 스크립트
 * 
 * 사용법:
 * node test-vision.js
 */

import { scrapeMenu } from './src/scraper.js';
import { extractMenuWithVision, checkOllamaStatus } from './src/vision.js';
import { extractTextFromImage } from './src/ocr.js';
import { extractTextWithClientOCR, extractTextWithEnhancedTesseract } from './src/easyocr.js';
import { parseMenu } from './src/parser.js';
import chalk from 'chalk';

async function testVisionModel() {
  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.blue.bold('LLaVA Vision Model Test'));
  console.log(chalk.blue('='.repeat(60)));
  
  try {
    // 1. Ollama 서버 상태 확인
    console.log(chalk.yellow('\n1. Checking Ollama server status...'));
    const ollamaRunning = await checkOllamaStatus();
    
    if (!ollamaRunning) {
      console.log(chalk.red('❌ Ollama server is not running'));
      console.log(chalk.cyan('\n📝 Instructions to setup Ollama:'));
      console.log(chalk.white('   1. Install Ollama from: https://ollama.ai'));
      console.log(chalk.white('   2. Start Ollama server: ollama serve'));
      console.log(chalk.white('   3. Pull LLaVA model: ollama pull llava:7b'));
      console.log(chalk.white('   4. Run this test again'));
      return;
    }
    
    console.log(chalk.green('✅ Ollama server is running'));
    
    // 2. 이미지 URL 가져오기
    console.log(chalk.yellow('\n2. Fetching menu image URL...'));
    const imageUrl = await scrapeMenu();
    console.log(chalk.green(`✅ Image URL: ${imageUrl.substring(0, 60)}...`));
    
    // 3. LLaVA Vision Model로 분석
    console.log(chalk.yellow('\n3. Analyzing with LLaVA Vision Model...'));
    console.time('Vision Model Time');
    const visionResult = await extractMenuWithVision(imageUrl);
    console.timeEnd('Vision Model Time');
    
    console.log(chalk.green('\n✅ Vision Model Result:'));
    console.log(chalk.white('─'.repeat(60)));
    console.log(visionResult);
    console.log(chalk.white('─'.repeat(60)));
    
    // 4. OCR과 비교 (선택사항)
    console.log(chalk.yellow('\n4. Comparing with OCR engines (optional)...'));
    const compareWithOCR = process.argv.includes('--compare');
    const compareAll = process.argv.includes('--compare-all');
    
    if (compareWithOCR || compareAll) {
      const ocrResults = {};
      
      // Legacy Tesseract OCR
      console.log(chalk.cyan('Running legacy Tesseract OCR...'));
      console.time('Legacy OCR Time');
      try {
        const ocrResult = await extractTextFromImage(imageUrl);
        ocrResults.legacy = parseMenu(ocrResult);
      } catch (error) {
        ocrResults.legacy = `Error: ${error.message}`;
      }
      console.timeEnd('Legacy OCR Time');
      
      if (compareAll) {
        // Enhanced Tesseract OCR
        console.log(chalk.cyan('Running enhanced Tesseract OCR...'));
        console.time('Enhanced OCR Time');
        try {
          ocrResults.enhanced = await extractTextWithEnhancedTesseract(imageUrl);
        } catch (error) {
          ocrResults.enhanced = `Error: ${error.message}`;
        }
        console.timeEnd('Enhanced OCR Time');
        
        // Advanced Client-side OCR
        console.log(chalk.cyan('Running advanced client-side OCR...'));
        console.time('Advanced OCR Time');
        try {
          ocrResults.advanced = await extractTextWithClientOCR(imageUrl);
        } catch (error) {
          ocrResults.advanced = `Error: ${error.message}`;
        }
        console.timeEnd('Advanced OCR Time');
      }
      
      // 결과 출력
      console.log(chalk.green('\n✅ OCR Results Comparison:'));
      console.log(chalk.white('─'.repeat(60)));
      
      console.log(chalk.cyan('\n📊 Legacy Tesseract OCR:'));
      console.log(ocrResults.legacy);
      
      if (compareAll) {
        console.log(chalk.cyan('\n🔧 Enhanced Tesseract OCR:'));
        console.log(ocrResults.enhanced);
        
        console.log(chalk.cyan('\n⚡ Advanced Client-side OCR:'));
        console.log(ocrResults.advanced);
      }
      
      console.log(chalk.white('─'.repeat(60)));
      
      // 결과 비교 요약
      console.log(chalk.yellow('\n5. Comparison Summary:'));
      console.log(chalk.white(`Vision Model Length: ${visionResult.length} characters`));
      console.log(chalk.white(`Legacy OCR Length: ${typeof ocrResults.legacy === 'string' ? ocrResults.legacy.length : 'Error'} characters`));
      
      if (compareAll) {
        console.log(chalk.white(`Enhanced OCR Length: ${typeof ocrResults.enhanced === 'string' ? ocrResults.enhanced.length : 'Error'} characters`));
        console.log(chalk.white(`Advanced OCR Length: ${typeof ocrResults.advanced === 'string' ? ocrResults.advanced.length : 'Error'} characters`));
      }
    } else {
      console.log(chalk.gray('Skip OCR comparison. Use --compare or --compare-all flag to compare with OCR'));
    }
    
    // 5. 모델 정보 표시
    console.log(chalk.yellow('\n5. Model Information:'));
    console.log(chalk.white('Model: LLaVA 7B'));
    console.log(chalk.white('Type: Vision-Language Model'));
    console.log(chalk.white('Capabilities: Image understanding, OCR, Korean language'));
    
    console.log(chalk.green('\n✅ Test completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
    
    if (error.stack && process.argv.includes('--debug')) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// 도움말 표시
function showHelp() {
  console.log(chalk.cyan('Star Valley Menu Vision & OCR Test'));
  console.log(chalk.white('\nUsage:'));
  console.log(chalk.white('  node test-vision.js [options]'));
  console.log(chalk.white('\nOptions:'));
  console.log(chalk.white('  --compare        Compare vision model with legacy OCR'));
  console.log(chalk.white('  --compare-all    Compare all available OCR engines'));
  console.log(chalk.white('  --debug          Show detailed error stack traces'));
  console.log(chalk.white('  --help           Show this help message'));
  console.log(chalk.white('\nOCR Engines Available:'));
  console.log(chalk.cyan('  • LLaVA 7B Vision Model (requires Ollama)'));
  console.log(chalk.cyan('  • Legacy Tesseract OCR'));
  console.log(chalk.cyan('  • Enhanced Tesseract OCR (optimized settings)'));
  console.log(chalk.cyan('  • Advanced Client-side OCR (PaddleOCR based)'));
}

// 명령줄 인수 처리
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// 테스트 실행
console.log(chalk.cyan('\n🚀 Starting LLaVA Vision Model Test...\n'));
testVisionModel();