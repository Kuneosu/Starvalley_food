#!/usr/bin/env node

import { extractTextFromImage } from './src/ocr.js';
import { parseMenu } from './src/parser.js';
import chalk from 'chalk';

async function testOCR() {
  console.log(chalk.blue('🧪 Testing OCR functionality with sample image...'));
  
  try {
    // Use a sample Korean text image URL for testing
    const testImageUrl = 'https://via.placeholder.com/600x400/ffffff/000000?text=%ED%95%9C%EA%B5%AD%EC%96%B4+%EB%A9%94%EB%89%B4+%ED%85%8C%EC%8A%A4%ED%8A%B8';
    
    console.log(chalk.yellow('Testing with placeholder image...'));
    
    // Test OCR
    const extractedText = await extractTextFromImage(testImageUrl);
    console.log(chalk.green('\n📄 Extracted Text:'));
    console.log(extractedText);
    
    // Test menu parsing
    const formattedMenu = parseMenu(extractedText);
    console.log(chalk.green('\n🍽️ Formatted Menu:'));
    console.log(formattedMenu);
    
    console.log(chalk.cyan('\n✅ OCR and parsing components are working!'));
    console.log(chalk.yellow('Note: The web scraping component needs network access to work properly.'));
    
  } catch (error) {
    console.error(chalk.red('❌ Test Error:'), error.message);
  }
}

// Test with mock menu text
function testMenuParsing() {
  console.log(chalk.blue('\n🧪 Testing menu parsing with mock data...'));
  
  const mockMenuText = `
스타밸리 구내식당
2024년 8월 26일 오늘의 메뉴

조식
- 김치찌개
- 계란후라이
- 밑반찬 3종

중식
- 불고기
- 된장찌개  
- 밥
- 밑반찬 5종

석식
- 삼겹살구이
- 김치찌개
- 밥
- 샐러드
`;

  const formattedMenu = parseMenu(mockMenuText);
  console.log(chalk.green('📋 Mock Menu Parsing Result:'));
  console.log(formattedMenu);
}

// Run tests
testMenuParsing();
testOCR();