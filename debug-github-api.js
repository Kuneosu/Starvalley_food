#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

async function testGitHubAPI() {
  try {
    console.log('🔍 GitHub API 연결 테스트 시작...\n');
    
    // 환경변수 확인
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.PERSONAL_ACCESS_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Kuneosu';
    const GITHUB_REPO = process.env.GITHUB_REPO || 'Starvalley_food';
    
    console.log('환경변수 확인:');
    console.log('- GITHUB_TOKEN:', GITHUB_TOKEN ? `${GITHUB_TOKEN.substring(0, 10)}...` : 'Missing');
    console.log('- GITHUB_OWNER:', GITHUB_OWNER);
    console.log('- GITHUB_REPO:', GITHUB_REPO);
    console.log('- GITHUB_BRANCH:', process.env.GITHUB_BRANCH || 'main');
    
    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token이 설정되지 않았습니다.');
    }
    
    // 1. 저장소 접근 확인
    console.log('\n📋 1단계: 저장소 접근 확인...');
    const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-bot'
      }
    });
    
    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      throw new Error(`저장소 접근 실패: ${repoResponse.status} - ${error.message}`);
    }
    
    const repoData = await repoResponse.json();
    console.log(`✅ 저장소 접근 성공: ${repoData.full_name}`);
    console.log(`   권한: ${repoData.permissions ? JSON.stringify(repoData.permissions) : '정보 없음'}`);
    
    // 2. data 디렉토리 확인
    console.log('\n📁 2단계: data 디렉토리 확인...');
    const dataResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-bot'
      }
    });
    
    if (dataResponse.status === 404) {
      console.log('⚠️ data 디렉토리가 없습니다. 생성을 시도합니다...');
      
      // README.md 파일로 디렉토리 생성
      const content = Buffer.from('# Star Valley Food Data\n\n이 디렉토리에는 매일의 메뉴 데이터가 JSON 형식으로 저장됩니다.').toString('base64');
      
      const createResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/README.md`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'starvalley-food-bot'
        },
        body: JSON.stringify({
          message: 'Create data directory with README',
          content: content,
          branch: process.env.GITHUB_BRANCH || 'main'
        })
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(`디렉토리 생성 실패: ${createResponse.status} - ${error.message}`);
      }
      
      console.log('✅ data 디렉토리 생성 완료');
    } else if (dataResponse.ok) {
      console.log('✅ data 디렉토리 존재 확인');
    } else {
      const error = await dataResponse.json();
      throw new Error(`디렉토리 확인 실패: ${dataResponse.status} - ${error.message}`);
    }
    
    // 3. 테스트 파일 업로드
    console.log('\n📤 3단계: 테스트 파일 업로드...');
    const testData = {
      date: new Date().toISOString().split('T')[0],
      menu: ['테스트 메뉴 1', '테스트 메뉴 2', '테스트 메뉴 3'],
      updated_at: new Date().toISOString(),
      total_items: 3,
      test: true
    };
    
    const testFileName = `test_upload_${Date.now()}.json`;
    const testContent = Buffer.from(JSON.stringify(testData, null, 2)).toString('base64');
    
    const uploadResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/${testFileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'starvalley-food-bot'
      },
      body: JSON.stringify({
        message: `Test upload: ${testFileName}`,
        content: testContent,
        branch: process.env.GITHUB_BRANCH || 'main'
      })
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`파일 업로드 실패: ${uploadResponse.status} - ${error.message}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ 테스트 파일 업로드 성공');
    console.log(`   파일 URL: ${uploadResult.content.html_url}`);
    
    // 4. 테스트 파일 삭제
    console.log('\n🗑️ 4단계: 테스트 파일 정리...');
    const deleteResponse = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/${testFileName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'starvalley-food-bot'
      },
      body: JSON.stringify({
        message: `Delete test file: ${testFileName}`,
        sha: uploadResult.content.sha,
        branch: process.env.GITHUB_BRANCH || 'main'
      })
    });
    
    if (deleteResponse.ok) {
      console.log('✅ 테스트 파일 정리 완료');
    } else {
      console.log('⚠️ 테스트 파일 정리 실패 (수동 정리 필요)');
    }
    
    console.log('\n🎉 모든 GitHub API 테스트 성공!');
    console.log('GitHub Actions에서도 정상적으로 작동할 것입니다.');
    
  } catch (error) {
    console.error('\n❌ GitHub API 테스트 실패:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 401 Unauthorized 오류 해결 방법:');
      console.log('   • GitHub Personal Access Token이 올바른지 확인');
      console.log('   • Token에 Contents 권한이 있는지 확인');
      console.log('   • Token이 만료되지 않았는지 확인');
    } else if (error.message.includes('403')) {
      console.log('\n💡 403 Forbidden 오류 해결 방법:');
      console.log('   • 저장소에 대한 쓰기 권한이 있는지 확인');
      console.log('   • Organization 정책을 확인');
    } else if (error.message.includes('404')) {
      console.log('\n💡 404 Not Found 오류 해결 방법:');
      console.log('   • 저장소 이름과 소유자가 올바른지 확인');
      console.log('   • 저장소가 존재하고 접근 가능한지 확인');
    }
    
    process.exit(1);
  }
}

// 실행
testGitHubAPI();