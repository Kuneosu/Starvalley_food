#!/usr/bin/env node

import { processMenu, validateEnvironment } from './backend/processor.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// 환경변수 로드
dotenv.config();

async function testBackend() {
  try {
    console.log(chalk.blue('🧪 Backend 테스트 시작...\n'));
    
    // 환경변수 확인
    const missing = validateEnvironment();
    if (missing.length > 0) {
      console.error(chalk.red('❌ 누락된 환경변수:'));
      missing.forEach(env => console.error(chalk.red(`   - ${env}`)));
      return;
    }
    
    console.log(chalk.green('✅ 환경변수 확인 완료'));
    
    // 메뉴 처리 실행
    const result = await processMenu(true);
    
    console.log(chalk.green('\n🎉 Backend 테스트 성공!'));
    console.log(chalk.white(`📊 메뉴 개수: ${result.menuItems.length}`));
    console.log(chalk.white(`⏱️ 소요시간: ${(result.duration / 1000).toFixed(2)}초`));
    console.log(chalk.white(`🔗 업로드 URL: ${result.fileUrl}`));
    
    // 메뉴 출력
    console.log(chalk.cyan('\n📋 추출된 메뉴:'));
    result.menuItems.forEach((item, index) => {
      console.log(chalk.white(`   ${index + 1}. ${item}`));
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Backend 테스트 실패:'), error.message);
    
    if (error.message.includes('OpenAI API')) {
      console.log(chalk.yellow('💡 OpenAI API 키를 확인해주세요.'));
    } else if (error.message.includes('GitHub')) {
      console.log(chalk.yellow('💡 GitHub 토큰과 저장소 설정을 확인해주세요.'));
    } else if (error.message.includes('스크래핑') || error.message.includes('이미지')) {
      console.log(chalk.yellow('💡 카카오 채널 접근에 문제가 있을 수 있습니다.'));
    }
  }
}

testBackend();