#!/usr/bin/env node

import { scrapeMenuImage } from './backend/scraper.js';
import { uploadToGitHub, checkGitHubConnection } from './backend/uploader.js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

/**
 * Claude Code API를 사용한 이미지 분석
 * @param {string} imageUrl - 분석할 이미지 URL
 * @returns {Promise<Array<string>>} 추출된 메뉴 목록
 */
async function analyzeImageWithClaude(imageUrl) {
  console.log('🔍 Claude Code API로 이미지 분석 중...');
  
  // Claude Code API를 통한 이미지 분석
  // 실제로는 Claude Code의 이미지 분석 기능을 활용
  console.log(`📷 이미지 URL: ${imageUrl.substring(0, 50)}...`);
  
  // 임시로 사용자 입력을 통한 메뉴 추출 (실제로는 Claude Code 결과 활용)
  console.log('\n📝 Claude Code를 통해 이미지에서 추출된 메뉴를 입력하세요:');
  console.log('   (각 메뉴를 새 줄로 구분하여 입력하고, 완료 시 빈 줄 입력)');
  
  const menuItems = [];
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    const askForMenu = () => {
      rl.question(`${menuItems.length + 1}. `, (input) => {
        if (input.trim() === '') {
          rl.close();
          if (menuItems.length === 0) {
            console.log('❌ 메뉴가 입력되지 않았습니다.');
            process.exit(1);
          }
          resolve(menuItems);
        } else {
          menuItems.push(input.trim());
          askForMenu();
        }
      });
    };
    
    askForMenu();
  });
}

/**
 * 메인 처리 함수
 */
async function processMenu() {
  const startTime = Date.now();
  
  try {
    console.log('🍽️ Star Valley 구내식당 메뉴 처리 시작\n');
    
    // 1. GitHub 연결 확인
    console.log('1️⃣ GitHub 연결 상태 확인...');
    const githubStatus = await checkGitHubConnection();
    if (!githubStatus) {
      throw new Error('GitHub API 연결 실패. 토큰과 저장소 정보를 확인해주세요.');
    }
    console.log('✅ GitHub 연결 확인 완료\n');
    
    // 2. 메뉴 이미지 스크래핑
    console.log('2️⃣ 메뉴 이미지 스크래핑...');
    const imageUrl = await scrapeMenuImage();
    console.log(`✅ 이미지 스크래핑 완료`);
    console.log(`📷 이미지 URL: ${imageUrl}\n`);
    
    // 3. Claude Code를 통한 이미지 분석
    console.log('3️⃣ Claude Code 이미지 분석');
    console.log('💡 다음 단계에서는 Claude Code의 이미지 분석 기능을 사용하세요:');
    console.log('   1. 위의 이미지 URL을 브라우저에서 열기');
    console.log('   2. Claude Code에 이미지를 업로드하고 메뉴 추출 요청');
    console.log('   3. 추출된 메뉴를 아래에 입력');
    
    const menuItems = await analyzeImageWithClaude(imageUrl);
    
    console.log(`\n✅ 메뉴 분석 완료: ${menuItems.length}개 항목`);
    console.log('📋 추출된 메뉴:');
    menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
    
    // 4. GitHub에 업로드
    console.log('\n4️⃣ GitHub에 데이터 업로드 중...');
    const fileUrl = await uploadToGitHub(menuItems);
    console.log('✅ GitHub 업로드 완료');
    console.log(`📁 파일 URL: ${fileUrl}\n`);
    
    // 완료
    const duration = Date.now() - startTime;
    console.log('🎉 메뉴 처리 완료!');
    console.log(`📊 메뉴 개수: ${menuItems.length}`);
    console.log(`⏱️ 총 소요시간: ${(duration / 1000).toFixed(2)}초`);
    console.log(`🔗 결과 URL: ${fileUrl}`);
    
  } catch (error) {
    console.error('\n❌ 처리 실패:', error.message);
    
    if (error.message.includes('GitHub')) {
      console.log('\n💡 해결 방법:');
      console.log('   - GitHub Personal Access Token 확인');
      console.log('   - .env 파일의 GITHUB_TOKEN 설정 확인');
    } else if (error.message.includes('스크래핑')) {
      console.log('\n💡 해결 방법:');
      console.log('   - 인터넷 연결 상태 확인');
      console.log('   - Kakao 채널 접근 가능 여부 확인');
    }
    
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  processMenu();
}

export { processMenu };