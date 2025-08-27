#!/usr/bin/env node

/**
 * 하이브리드 OCR + AI 성능 테스트 스크립트
 * 
 * 사용법:
 * node test-hybrid.js
 * node test-hybrid.js --compare     # 모든 방식 비교
 */

import { scrapeMenu } from './src/scraper.js';
import { extractTextFromImage } from './src/ocr.js';
import { extractMenuWithVision, checkOllamaStatus } from './src/vision.js';
import { hybridOCRAI, processOCRWithAI, checkAIStatus } from './src/textProcessor.js';
import { parseMenu } from './src/parser.js';
import chalk from 'chalk';

// 실제 8월 27일 메뉴 (정답)
const ACTUAL_MENU = [
  '흑미밥/백미밥',
  '낙지불고기볶음', 
  '소고기들깨우거지국',
  '못난이순살치킨스틱&갈릭디핑소스',
  '알리오올리오',
  '김치메밀전병구이',
  '무나물볶음',
  '양념마늘쫑',
  '야채겉절이',
  '가든샐러드&키위D',
  '포기김치'
];

/**
 * 메뉴 정확도 계산
 */
function calculateAccuracy(result, actual) {
  if (!result || result.length === 0) return 0;
  
  const resultItems = result.toLowerCase().split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
  const actualItems = actual.map(s => s.toLowerCase());
  
  let matches = 0;
  let partialMatches = 0;
  
  for (const actualItem of actualItems) {
    const exactMatch = resultItems.some(resultItem => 
      resultItem.includes(actualItem) || actualItem.includes(resultItem)
    );
    
    if (exactMatch) {
      matches++;
    } else {
      // 부분 일치 검사 (70% 이상 유사)
      const partialMatch = resultItems.some(resultItem => {
        const similarity = calculateSimilarity(resultItem, actualItem);
        return similarity > 0.7;
      });
      
      if (partialMatch) {
        partialMatches++;
      }
    }
  }
  
  return {
    exactAccuracy: Math.round((matches / actualItems.length) * 100),
    totalAccuracy: Math.round(((matches + partialMatches * 0.5) / actualItems.length) * 100),
    matches,
    partialMatches,
    total: actualItems.length
  };
}

/**
 * 문자열 유사도 계산 (간단한 버전)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * 레벤슈타인 거리 계산
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function testHybridProcessing() {
  console.log(chalk.blue('='.repeat(70)));
  console.log(chalk.blue.bold('🚀 Hybrid OCR + AI Performance Test'));
  console.log(chalk.blue('='.repeat(70)));
  
  try {
    // 1. 시스템 상태 확인
    console.log(chalk.yellow('\n1. Checking system status...'));
    
    const ollamaStatus = await checkOllamaStatus();
    const aiStatus = await checkAIStatus();
    
    console.log(chalk.white(`Ollama server: ${ollamaStatus ? '✅ Running' : '❌ Not running'}`));
    console.log(chalk.white(`AI models available: ${aiStatus.available ? '✅ Yes' : '❌ No'}`));
    if (aiStatus.recommended) {
      console.log(chalk.white(`Recommended model: ${aiStatus.recommended}`));
    }
    
    // 2. 이미지 가져오기
    console.log(chalk.yellow('\n2. Fetching menu image...'));
    const imageUrl = await scrapeMenu();
    console.log(chalk.green(`✅ Image URL: ${imageUrl.substring(0, 50)}...`));
    
    const results = {};
    const compareAll = process.argv.includes('--compare');
    
    // 3. 하이브리드 방식 테스트
    console.log(chalk.yellow('\n3. Testing Hybrid OCR + AI...'));
    console.time('Hybrid Total Time');
    try {
      results.hybrid = await hybridOCRAI(imageUrl, extractTextFromImage);
      console.timeEnd('Hybrid Total Time');
      console.log(chalk.green('✅ Hybrid processing completed'));
    } catch (error) {
      console.timeEnd('Hybrid Total Time');
      results.hybrid = `Error: ${error.message}`;
      console.log(chalk.red('❌ Hybrid processing failed'));
    }
    
    if (compareAll) {
      // 4. 기존 방식들과 비교
      console.log(chalk.yellow('\n4. Comparing with other methods...'));
      
      // Legacy OCR
      console.log(chalk.cyan('Testing Legacy OCR...'));
      console.time('Legacy OCR Time');
      try {
        const ocrText = await extractTextFromImage(imageUrl);
        results.legacyOCR = parseMenu(ocrText);
      } catch (error) {
        results.legacyOCR = `Error: ${error.message}`;
      }
      console.timeEnd('Legacy OCR Time');
      
      // LLaVA Vision (if available)
      if (ollamaStatus) {
        console.log(chalk.cyan('Testing LLaVA Vision...'));
        console.time('LLaVA Time');
        try {
          results.llava = await extractMenuWithVision(imageUrl);
        } catch (error) {
          results.llava = `Error: ${error.message}`;
        }
        console.timeEnd('LLaVA Time');
      }
      
      // OCR + AI (without hybrid wrapper)
      console.log(chalk.cyan('Testing OCR + AI separately...'));
      console.time('OCR + AI Time');
      try {
        const ocrText = await extractTextFromImage(imageUrl);
        results.ocrPlusAI = await processOCRWithAI(parseMenu(ocrText));
      } catch (error) {
        results.ocrPlusAI = `Error: ${error.message}`;
      }
      console.timeEnd('OCR + AI Time');
    }
    
    // 5. 결과 표시
    console.log(chalk.green('\n' + '='.repeat(70)));
    console.log(chalk.green.bold('📊 RESULTS COMPARISON'));
    console.log(chalk.green('='.repeat(70)));
    
    // 실제 정답 표시
    console.log(chalk.white('\n🎯 Expected Menu (August 27, 2024):'));
    console.log(chalk.gray(ACTUAL_MENU.join(', ')));
    
    // 하이브리드 결과
    console.log(chalk.cyan('\n🚀 Hybrid OCR + AI Result:'));
    console.log(chalk.white(results.hybrid));
    
    if (results.hybrid && !results.hybrid.startsWith('Error:')) {
      const accuracy = calculateAccuracy(results.hybrid, ACTUAL_MENU);
      console.log(chalk.green(`Accuracy: ${accuracy.totalAccuracy}% (${accuracy.matches} exact + ${accuracy.partialMatches} partial matches)`));
    }
    
    if (compareAll) {
      // 다른 방식들 결과
      if (results.legacyOCR) {
        console.log(chalk.cyan('\n📊 Legacy OCR Result:'));
        console.log(chalk.white(results.legacyOCR));
        if (!results.legacyOCR.startsWith('Error:')) {
          const accuracy = calculateAccuracy(results.legacyOCR, ACTUAL_MENU);
          console.log(chalk.yellow(`Accuracy: ${accuracy.totalAccuracy}%`));
        }
      }
      
      if (results.llava) {
        console.log(chalk.cyan('\n🤖 LLaVA Vision Result:'));
        console.log(chalk.white(results.llava.substring(0, 200) + '...'));
        if (!results.llava.startsWith('Error:')) {
          const accuracy = calculateAccuracy(results.llava, ACTUAL_MENU);
          console.log(chalk.yellow(`Accuracy: ${accuracy.totalAccuracy}%`));
        }
      }
      
      if (results.ocrPlusAI) {
        console.log(chalk.cyan('\n🔧 OCR + AI Result:'));
        console.log(chalk.white(results.ocrPlusAI));
        if (!results.ocrPlusAI.startsWith('Error:')) {
          const accuracy = calculateAccuracy(results.ocrPlusAI, ACTUAL_MENU);
          console.log(chalk.yellow(`Accuracy: ${accuracy.totalAccuracy}%`));
        }
      }
    }
    
    console.log(chalk.green('\n✅ Test completed successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
    
    if (process.argv.includes('--debug')) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// 도움말 표시
function showHelp() {
  console.log(chalk.cyan('Hybrid OCR + AI Performance Test'));
  console.log(chalk.white('\nUsage:'));
  console.log(chalk.white('  node test-hybrid.js [options]'));
  console.log(chalk.white('\nOptions:'));
  console.log(chalk.white('  --compare    Compare with all available methods'));
  console.log(chalk.white('  --debug      Show detailed error information'));
  console.log(chalk.white('  --help       Show this help message'));
  console.log(chalk.white('\nTest Details:'));
  console.log(chalk.cyan('  • Tests new hybrid OCR + AI processing'));
  console.log(chalk.cyan('  • Measures accuracy against actual Aug 27 menu'));
  console.log(chalk.cyan('  • Compares performance with existing methods'));
}

// 명령줄 인수 처리
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// 테스트 실행
console.log(chalk.cyan('\n🧪 Starting Hybrid Processing Test...\n'));
testHybridProcessing();