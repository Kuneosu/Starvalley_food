#!/usr/bin/env node

import { parseMenu } from './src/parser.js';
import chalk from 'chalk';

// Test the updated parser with better structured data
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

console.log(chalk.blue('🧪 Testing updated parser...'));
console.log(chalk.yellow('Input text lines:'));
const lines = testText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
lines.forEach((line, i) => {
  console.log(chalk.gray(`${i + 1}: "${line}"`));
});

console.log(chalk.green('\nParsed result:'));
const result = parseMenu(testText);
console.log(result);