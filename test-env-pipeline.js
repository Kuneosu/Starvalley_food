#!/usr/bin/env node

import { processMenu, validateEnvironment } from './backend/processor.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPipeline() {
  try {
    console.log('🧪 GitHub Actions 환경 시뮬레이션 테스트\n');
    
    // 환경변수 설정 (실제 GitHub Actions에서와 동일하게)
    // 환경변수에서 로드되어야 함
    if (!process.env.OPENAI_API_KEY || !process.env.GITHUB_TOKEN) {
      console.error('❌ 환경변수가 설정되지 않았습니다.');
      console.log('다음 환경변수를 .env 파일에 설정하거나 직접 export하세요:');
      console.log('- OPENAI_API_KEY=your_openai_api_key');
      console.log('- GITHUB_TOKEN=your_github_personal_access_token');
      process.exit(1);
    }
    process.env.GITHUB_OWNER = 'Kuneosu';
    process.env.GITHUB_REPO = 'Starvalley_food';
    process.env.GITHUB_BRANCH = 'main';
    
    // 환경변수 디버깅
    console.log('Environment variables:');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
    console.log('- GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Set' : 'Missing');
    console.log('- GITHUB_OWNER:', process.env.GITHUB_OWNER);
    console.log('- GITHUB_REPO:', process.env.GITHUB_REPO);
    console.log('- GITHUB_BRANCH:', process.env.GITHUB_BRANCH);
    
    // 환경변수 확인
    const missing = validateEnvironment();
    if (missing.length > 0) {
      console.error('\n❌ Missing environment variables:', missing);
      process.exit(1);
    }
    
    console.log('\n✅ 환경변수 확인 완료');
    
    // 메뉴 처리 실행
    console.log('\n🚀 메뉴 처리 파이프라인 시작...');
    const result = await processMenu(true);
    
    console.log('\n✅ 메뉴 처리 완료!');
    console.log(`📊 메뉴 개수: ${result.menuItems.length}`);
    console.log(`⏱️ 소요시간: ${(result.duration / 1000).toFixed(2)}초`);
    console.log(`🔗 파일 URL: ${result.fileUrl}`);
    
    console.log('\n🎉 테스트 성공! GitHub Actions도 정상 작동할 것입니다.');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 OpenAI API 키 문제입니다:');
      console.log('   • API 키가 올바른지 확인하세요');
      console.log('   • API 사용량 한도를 확인하세요');
    } else if (error.message.includes('GitHub')) {
      console.log('\n💡 GitHub API 문제입니다:');
      console.log('   • GitHub 토큰 권한을 확인하세요');
      console.log('   • 저장소 접근 권한을 확인하세요');
    } else if (error.message.includes('스크래핑') || error.message.includes('이미지')) {
      console.log('\n💡 스크래핑 문제입니다:');
      console.log('   • 카카오 채널 접근 상태를 확인하세요');
      console.log('   • 네트워크 연결을 확인하세요');
    }
    
    process.exit(1);
  }
}

// 실행
testPipeline();