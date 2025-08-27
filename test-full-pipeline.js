#!/usr/bin/env node

import { scrapeMenuImage } from './backend/scraper.js';
import { analyzeMenuImage } from './backend/analyzer.js';
import { uploadToGitHub } from './backend/uploader.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

async function testFullPipeline() {
  try {
    console.log(chalk.blue('🧪 전체 파이프라인 테스트: 스크래핑 → OpenAI 분석 → GitHub 업로드\n'));
    
    // 1단계: Star Valley 카카오 채널에서 이미지 스크래핑
    console.log(chalk.yellow('1️⃣ Star Valley 카카오 채널에서 메뉴 이미지 스크래핑 중...'));
    console.time('Scraping Time');
    
    const imageUrl = await scrapeMenuImage();
    console.timeEnd('Scraping Time');
    
    console.log(chalk.green('✅ 이미지 스크래핑 성공'));
    console.log(chalk.white(`🖼️ 이미지 URL: ${imageUrl.substring(0, 80)}...`));
    
    // 2단계: OpenAI GPT-4o-mini로 이미지 분석
    console.log(chalk.yellow('\n2️⃣ OpenAI GPT-4o-mini로 메뉴 이미지 분석 중...'));
    console.time('OpenAI Analysis');
    
    const menuItems = await analyzeMenuImage(imageUrl);
    console.timeEnd('OpenAI Analysis');
    
    console.log(chalk.green(`✅ OpenAI 분석 완료: ${menuItems.length}개 메뉴 항목`));
    console.log(chalk.cyan('📋 분석된 메뉴:'));
    menuItems.forEach((item, index) => {
      console.log(chalk.white(`   ${index + 1}. ${item}`));
    });
    
    // 3단계: GitHub에 실제 데이터로 업로드
    console.log(chalk.yellow('\n3️⃣ GitHub에 실제 분석 데이터 업로드 중...'));
    console.time('GitHub Upload');
    
    const fileUrl = await uploadToGitHub(menuItems);
    console.timeEnd('GitHub Upload');
    
    console.log(chalk.green('✅ GitHub 업로드 성공'));
    console.log(chalk.white(`🔗 파일 URL: ${fileUrl}`));
    
    // 결과 요약
    console.log(chalk.green('\n' + '='.repeat(60)));
    console.log(chalk.green.bold('🎉 전체 파이프라인 테스트 성공!'));
    console.log(chalk.green('='.repeat(60)));
    console.log(chalk.white(`📊 추출된 메뉴 개수: ${menuItems.length}`));
    console.log(chalk.white(`🖼️ 원본 이미지: ${imageUrl.substring(0, 50)}...`));
    console.log(chalk.white(`📁 GitHub 파일: ${fileUrl}`));
    
    console.log(chalk.cyan('\n💡 이제 CLI로 실제 분석된 데이터를 확인해보세요:'));
    console.log(chalk.white('   node src/cli.js today'));
    console.log(chalk.white('   node src/cli.js list'));
    console.log(chalk.white('   node src/cli.js status'));
    
    console.log(chalk.yellow('\n🔍 분석 품질 확인:'));
    console.log(chalk.gray('   • 메뉴명이 정확히 추출되었나요?'));
    console.log(chalk.gray('   • 한국어 음식명이 올바르게 인식되었나요?'));
    console.log(chalk.gray('   • 불필요한 텍스트(날짜, 설명 등)는 제외되었나요?'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ 전체 파이프라인 테스트 실패:'), error.message);
    
    if (error.message.includes('Chrome') || error.message.includes('puppeteer')) {
      console.log(chalk.yellow('💡 Puppeteer/Chrome 문제입니다. 다음을 시도해보세요:'));
      console.log(chalk.cyan('   npx puppeteer browsers install chrome'));
      console.log(chalk.cyan('   또는 시스템 Chrome을 사용하도록 설정 변경'));
    } else if (error.message.includes('OpenAI')) {
      console.log(chalk.yellow('💡 OpenAI API 문제입니다:'));
      console.log(chalk.cyan('   • API 키가 올바른지 확인'));
      console.log(chalk.cyan('   • API 사용량 한도 확인'));
      console.log(chalk.cyan('   • 네트워크 연결 확인'));
    } else if (error.message.includes('GitHub')) {
      console.log(chalk.yellow('💡 GitHub API 문제입니다:'));
      console.log(chalk.cyan('   • GitHub 토큰 권한 확인'));
      console.log(chalk.cyan('   • 저장소 접근 권한 확인'));
    } else if (error.message.includes('스크래핑') || error.message.includes('이미지')) {
      console.log(chalk.yellow('💡 스크래핑 문제입니다:'));
      console.log(chalk.cyan('   • 카카오 채널 접근 가능 여부 확인'));
      console.log(chalk.cyan('   • 네트워크 연결 상태 확인'));
      console.log(chalk.cyan('   • 이미지 URL 유효성 확인'));
    }
  }
}

testFullPipeline();