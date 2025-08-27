#!/usr/bin/env node

import { processMenu, validateEnvironment } from './backend/processor.js';

/**
 * GitHub Actions 전용 워크플로우 스크립트
 * 환경변수는 GitHub Actions에서 자동으로 로드됨
 */
async function main() {
  try {
    console.log('🚀 GitHub Actions - 메뉴 처리 시작');
    
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
      console.error('Missing environment variables:', missing);
      console.log('::set-output name=success::false');
      console.log(`::set-output name=error::Missing environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ 환경변수 확인 완료');
    
    // 메뉴 처리 실행
    const result = await processMenu(true);
    
    console.log('✅ 메뉴 처리 완료');
    console.log(`📊 메뉴 개수: ${result.menuItems.length}`);
    console.log(`⏱️ 소요시간: ${(result.duration / 1000).toFixed(2)}초`);
    console.log(`🔗 파일 URL: ${result.fileUrl}`);
    
    // GitHub Actions 출력 설정
    console.log('::set-output name=success::true');
    console.log(`::set-output name=menu_count::${result.menuItems.length}`);
    console.log(`::set-output name=file_url::${result.fileUrl}`);
    console.log(`::set-output name=duration::${result.duration}`);
    
  } catch (error) {
    console.error('❌ 처리 실패:', error.message);
    console.error('Stack trace:', error.stack);
    
    // 환경 정보 디버깅
    console.log('\n🔍 환경 디버깅 정보:');
    console.log('- Node 버전:', process.version);
    console.log('- 작업 디렉토리:', process.cwd());
    console.log('- 환경변수 개수:', Object.keys(process.env).length);
    console.log('- Chrome 경로:', process.env.PUPPETEER_EXECUTABLE_PATH || 'Not set');
    console.log('- Puppeteer 스킵 설정:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'Not set');
    
    // 파일 시스템 확인
    try {
      const fs = await import('fs');
      const files = fs.readdirSync('.');
      console.log('- 현재 디렉토리 파일:', files.slice(0, 10).join(', '));
      
      if (fs.existsSync('./backend')) {
        const backendFiles = fs.readdirSync('./backend');
        console.log('- Backend 파일:', backendFiles.join(', '));
      }
    } catch (fsError) {
      console.log('- 파일 시스템 확인 실패:', fsError.message);
    }
    
    // 구체적인 오류 정보 제공
    if (error.message.includes('OpenAI')) {
      console.log('\n💡 OpenAI API 관련 오류:');
      console.log('   - API 키가 올바른지 확인하세요');
      console.log('   - API 사용량 한도를 확인하세요');
      console.log('   - 네트워크 연결을 확인하세요');
    } else if (error.message.includes('GitHub')) {
      console.log('\n💡 GitHub API 관련 오류:');
      console.log('   - Personal Access Token 권한을 확인하세요');
      console.log('   - Contents 및 Metadata 권한이 필요합니다');
    } else if (error.message.includes('스크래핑') || error.message.includes('Puppeteer')) {
      console.log('\n💡 스크래핑/Puppeteer 관련 오류:');
      console.log('   - Chrome/Puppeteer 설정을 확인하세요');
      console.log('   - Kakao 채널 접근 상태를 확인하세요');
      console.log('   - 네트워크 연결을 확인하세요');
    } else if (error.message.includes('Cannot find module') || error.message.includes('import')) {
      console.log('\n💡 모듈 관련 오류:');
      console.log('   - 의존성 설치가 완료되었는지 확인하세요');
      console.log('   - 파일 경로가 올바른지 확인하세요');
    } else {
      console.log('\n💡 기타 오류:');
      console.log('   - 로그를 확인하여 구체적인 원인을 파악하세요');
      console.log('   - 로컬 환경에서 동일한 오류가 발생하는지 확인하세요');
    }
    
    // GitHub Actions 출력 설정
    console.log('::set-output name=success::false');
    console.log(`::set-output name=error::${error.message}`);
    process.exit(1);
  }
}

// 실행
main();