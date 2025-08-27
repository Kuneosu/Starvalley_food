#!/usr/bin/env node

import { analyzeMenuImage } from './backend/analyzer.js';
import { uploadToGitHub } from './backend/uploader.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function testOpenAIOnly() {
  try {
    console.log(chalk.blue('🧪 OpenAI + GitHub 테스트 (스크래핑 제외)\n'));
    
    // 테스트용 공개 이미지 URL (한국 메뉴판)
    const testImageUrl = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500';
    
    console.log(chalk.yellow('1️⃣ GPT-4o-mini로 메뉴 분석 중...'));
    console.time('OpenAI Analysis');
    
    const menuItems = await analyzeMenuImage(testImageUrl);
    console.timeEnd('OpenAI Analysis');
    
    console.log(chalk.green(`✅ 메뉴 분석 완료: ${menuItems.length}개 항목`));
    console.log(chalk.cyan('📋 추출된 메뉴:'));
    menuItems.forEach((item, index) => {
      console.log(chalk.white(`   ${index + 1}. ${item}`));
    });
    
    console.log(chalk.yellow('\n2️⃣ GitHub에 업로드 중...'));
    console.time('GitHub Upload');
    
    const fileUrl = await uploadToGitHub(menuItems);
    console.timeEnd('GitHub Upload');
    
    console.log(chalk.green('✅ GitHub 업로드 완료'));
    console.log(chalk.white(`🔗 파일 URL: ${fileUrl}`));
    
    console.log(chalk.green('\n🎉 테스트 성공! 모든 기능이 정상 작동합니다.'));
    
  } catch (error) {
    console.error(chalk.red('❌ 테스트 실패:'), error.message);
    
    if (error.message.includes('OpenAI')) {
      console.log(chalk.yellow('💡 OpenAI API 키나 이미지 URL을 확인해주세요.'));
    } else if (error.message.includes('GitHub')) {
      console.log(chalk.yellow('💡 GitHub 토큰이나 저장소 권한을 확인해주세요.'));
    }
  }
}

testOpenAIOnly();