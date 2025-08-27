#!/usr/bin/env node

import { uploadToGitHub } from './backend/uploader.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function testGitHubOnly() {
  try {
    console.log(chalk.blue('🧪 GitHub 업로드 테스트\n'));
    
    // 테스트용 메뉴 데이터 (8월 27일 실제 메뉴)
    const testMenuItems = [
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
    
    console.log(chalk.cyan('📋 업로드할 테스트 메뉴:'));
    testMenuItems.forEach((item, index) => {
      console.log(chalk.white(`   ${index + 1}. ${item}`));
    });
    
    console.log(chalk.yellow('\n📤 GitHub에 업로드 중...'));
    console.time('GitHub Upload');
    
    const fileUrl = await uploadToGitHub(testMenuItems);
    console.timeEnd('GitHub Upload');
    
    console.log(chalk.green('✅ GitHub 업로드 성공'));
    console.log(chalk.white(`🔗 파일 URL: ${fileUrl}`));
    
    console.log(chalk.green('\n🎉 GitHub 업로드 테스트 성공!'));
    
  } catch (error) {
    console.error(chalk.red('❌ 테스트 실패:'), error.message);
  }
}

testGitHubOnly();