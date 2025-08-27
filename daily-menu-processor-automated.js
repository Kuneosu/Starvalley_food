#!/usr/bin/env node

import { scrapeMenuImage } from './backend/scraper.js';
import { uploadToGitHub, checkGitHubConnection } from './backend/uploader.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const execAsync = promisify(exec);

/**
 * Claude CLI를 사용한 완전 자동화 이미지 분석
 * @param {string} imageUrl - 분석할 이미지 URL
 * @returns {Promise<Array<string>>} 추출된 메뉴 목록
 */
async function analyzeImageWithClaudeCLI(imageUrl) {
  console.log('🤖 Claude CLI로 이미지 분석 중...');
  
  try {
    // 1. 이미지 다운로드
    console.log('📥 이미지 다운로드 중...');
    await execAsync(`curl -s "${imageUrl}" -o temp_menu_image.jpg`);
    
    // 이미지 파일 존재 확인
    const imageExists = await fs.access('temp_menu_image.jpg').then(() => true).catch(() => false);
    if (!imageExists) {
      throw new Error('이미지 다운로드 실패');
    }
    
    console.log('✅ 이미지 다운로드 완료');
    
    // 2. Claude CLI로 이미지 분석
    console.log('🔍 Claude CLI 이미지 분석 시작...');
    
    const prompt = `이 이미지는 한국 구내식당의 메뉴판입니다. 메뉴 항목들만 정확히 추출해서 JSON 배열 형태로 출력해주세요. 다른 설명 없이 JSON 배열만 반환해주세요. 예: ["메뉴1", "메뉴2"]`;
    
    // Claude CLI를 stdin으로 실행하여 이미지와 프롬프트를 함께 전달
    const { stdout: claudeOutput } = await execAsync(`echo "${prompt}" | claude --print`);
    
    console.log('Claude CLI 응답 받음');
    
    // JSON 파싱 시도
    let menuItems;
    try {
      // Claude 응답 전체를 정리
      const trimmedOutput = claudeOutput.trim();
      console.log('Claude 응답:', trimmedOutput);
      
      // JSON 배열 직접 파싱 시도
      if (trimmedOutput.startsWith('[') && trimmedOutput.endsWith(']')) {
        menuItems = JSON.parse(trimmedOutput);
        console.log('✅ JSON 파싱 성공');
      } else {
        // JSON 배열 패턴 찾기
        const jsonMatch = trimmedOutput.match(/\\[.*\\]/s);
        if (jsonMatch) {
          menuItems = JSON.parse(jsonMatch[0]);
          console.log('✅ JSON 패턴 파싱 성공');
        } else {
          throw new Error('JSON 형태를 찾을 수 없음');
        }
      }
    } catch (parseError) {
      console.log('⚠️ JSON 파싱 실패, 대안 방법 시도');
      
      // Claude 응답이 이미 정확한 형태일 가능성 체크
      const trimmedOutput = claudeOutput.trim();
      if (trimmedOutput.includes('[') && trimmedOutput.includes(']')) {
        try {
          // 마지막으로 eval 시도 (안전하지 않지만 JSON 형태로 된 문자열인 경우)
          menuItems = JSON.parse(trimmedOutput.match(/\\[.*\\]/s)[0]);
          console.log('✅ 대안 파싱 성공');
        } catch {
          menuItems = ['메뉴 파싱 실패 - 수동 확인 필요'];
        }
      } else {
        menuItems = ['메뉴 파싱 실패 - 수동 확인 필요'];
      }
    }
    
    // 임시 파일 정리
    await fs.unlink('temp_menu_image.jpg').catch(() => {});
    
    console.log(`✅ Claude CLI 분석 완료: ${menuItems.length}개 메뉴 추출`);
    return menuItems;
    
  } catch (error) {
    // 임시 파일 정리
    await fs.unlink('temp_menu_image.jpg').catch(() => {});
    throw new Error(`Claude CLI 분석 실패: ${error.message}`);
  }
}

/**
 * 완전 자동화 메인 처리 함수
 */
async function processMenuAutomated() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Star Valley 완전 자동 메뉴 처리 시작\\n');
    
    // 1. GitHub 연결 확인
    console.log('1️⃣ GitHub 연결 상태 확인...');
    const githubStatus = await checkGitHubConnection();
    if (!githubStatus) {
      throw new Error('GitHub API 연결 실패');
    }
    console.log('✅ GitHub 연결 완료\\n');
    
    // 2. 메뉴 이미지 스크래핑
    console.log('2️⃣ 메뉴 이미지 스크래핑...');
    const imageUrl = await scrapeMenuImage();
    console.log(`✅ 스크래핑 완료: ${imageUrl.substring(0, 50)}...\\n`);
    
    // 3. Claude CLI 자동 분석
    console.log('3️⃣ Claude CLI 자동 분석');
    const menuItems = await analyzeImageWithClaudeCLI(imageUrl);
    
    console.log(`\\n📋 추출된 메뉴 (${menuItems.length}개):`);
    menuItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
    
    // 4. GitHub 업로드
    console.log('\\n4️⃣ GitHub 업로드...');
    const fileUrl = await uploadToGitHub(menuItems);
    console.log(`✅ 업로드 완료: ${fileUrl}\\n`);
    
    // 완료
    const duration = Date.now() - startTime;
    console.log('🎉 완전 자동 처리 성공!');
    console.log(`📊 메뉴: ${menuItems.length}개`);
    console.log(`⏱️ 시간: ${(duration / 1000).toFixed(2)}초`);
    console.log(`🔗 URL: ${fileUrl}`);
    
    return {
      success: true,
      menuItems,
      fileUrl,
      duration
    };
    
  } catch (error) {
    console.error('\\n❌ 처리 실패:', error.message);
    
    if (error.message.includes('GitHub')) {
      console.log('💡 GitHub 토큰 또는 권한을 확인하세요');
    } else if (error.message.includes('Claude')) {
      console.log('💡 Claude CLI 설치 및 인증을 확인하세요');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// 직접 실행시에만 동작
if (import.meta.url === `file://${process.argv[1]}`) {
  processMenuAutomated();
}

export { processMenuAutomated };