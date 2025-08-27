#!/usr/bin/env node

import chalk from 'chalk';

function debugParseStructuredMenu(text) {
  console.log(chalk.blue('🔍 Debugging parser...'));
  
  // Clean up the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into lines and filter out empty ones
  const lines = cleanText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log(chalk.yellow('Lines after cleanup:'));
  lines.forEach((line, i) => {
    console.log(chalk.gray(`${i}: "${line}"`));
  });
  
  const menu = {};
  let currentSection = null;
  
  for (const [index, line] of lines.entries()) {
    const cleanLine = line.replace(/[|*#~\-_=.,:]+/g, '').trim();
    
    console.log(chalk.cyan(`\nProcessing line ${index}: "${line}"`));
    console.log(chalk.cyan(`Clean line: "${cleanLine}"`));
    
    // Check if this line is a section header
    const sectionMatch = cleanLine.match(/(조식|중식|석식|아침|점심|저녁)/i);
    
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      console.log(chalk.green(`  ✅ Found section: ${currentSection}`));
      if (!menu[currentSection]) {
        menu[currentSection] = [];
      }
    } else if (cleanLine.includes('메뉴') || cleanLine.includes('구내식당') || 
               cleanLine.match(/\d{4}[.\-년]\d{1,2}[.\-월]\d{1,2}/) ||
               cleanLine.match(/\d{1,2}월\s*\d{1,2}일/)) {
      console.log(chalk.yellow(`  ⏭️ Skipping header/date: ${cleanLine}`));
      continue;
    } else if (currentSection && cleanLine.length > 2 && !cleanLine.match(/^\d+원$/)) {
      console.log(chalk.blue(`  📝 Adding to section "${currentSection}": ${cleanLine}`));
      menu[currentSection].push(cleanLine);
    } else if (!currentSection && cleanLine.length > 3 && 
               !cleanLine.includes('구내식당') && !cleanLine.includes('메뉴')) {
      console.log(chalk.magenta(`  📋 Adding to default menu: ${cleanLine}`));
      if (!menu['메뉴']) {
        menu['메뉴'] = [];
      }
      menu['메뉴'].push(cleanLine);
    } else {
      console.log(chalk.red(`  ❌ Ignored: ${cleanLine}`));
    }
  }
  
  console.log(chalk.green('\n📊 Final menu object:'));
  console.log(menu);
  
  return menu;
}

const testText = `
스타밸리 구내식당
2024년 8월 26일

조식
김치찌개
계란후라이
밑반찬 3종

중식
불고기
된장찌개
밥
밑반찬 5종

석식
삼겹살구이
김치찌개
밥
샐러드
`;

debugParseStructuredMenu(testText);