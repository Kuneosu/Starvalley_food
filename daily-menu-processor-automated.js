#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Star Valley 카카오 채널에서 메뉴 이미지와 날짜 정보 스크래핑
 * @returns {Promise<Array<Object>>} 메뉴 데이터 배열 [{imageUrl, dateText, menuDate}]
 */
async function scrapeMenuData() {
  console.log('🔧 브라우저 초기화 중...');

  // GitHub Actions 환경인지 확인
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

  const launchOptions = {
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  };

  // 로컬 macOS 환경에서만 Chrome 경로 지정
  if (!isGitHubActions && process.platform === 'darwin') {
    launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();
    
    console.log('🔧 페이지 설정 중...');
    
    // 네트워크 이벤트 리스너 추가 (디버깅용)
    page.on('requestfailed', (request) => {
      console.log(`❌ 요청 실패: ${request.url()} - ${request.failure().errorText}`);
    });
    
    page.on('response', (response) => {
      console.log(`📡 응답: ${response.status()} ${response.url()}`);
    });
    
    // 타임아웃 설정
    page.setDefaultTimeout(30000);
    
    // User Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Star Valley 카카오 채널 접속
    const channelUrl = 'https://pf.kakao.com/_axkixdn/posts';
    console.log(`🌐 카카오 채널 접속 시도: ${channelUrl}`);
    
    await page.goto(channelUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로드 성공');
    
    // 동적 콘텐츠 로딩을 위한 추가 대기
    console.log('⏳ 동적 콘텐츠 로딩 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 페이지 로딩 대기 - 더 관대한 셀렉터 사용
    try {
      await page.waitForSelector('img', { timeout: 15000 });
      console.log('🖼️ 이미지 로드 완료');
    } catch (error) {
      console.log('⚠️ 이미지 셀렉터 대기 실패, 계속 진행...');
    }
    
    // wrap_fit_thumb div에서 배경 이미지 URL 파싱
    const menuDataList = await page.evaluate(() => {
      const results = [];
      
      // wrap_fit_thumb 클래스를 가진 div 요소들 찾기
      const thumbDivs = document.querySelectorAll('div.wrap_fit_thumb');
      console.log(`wrap_fit_thumb div 개수: ${thumbDivs.length}`);
      
      // 각 div에서 배경 이미지 URL 추출
      const backgroundImages = [];
      for (const div of thumbDivs) {
        const style = div.getAttribute('style');
        if (style && style.includes('background-image')) {
          // style 속성에서 URL 추출: background-image: url("...") 형태
          const urlMatch = style.match(/background-image:\s*url\(['""]?([^'"")]+)['""]?\)/);
          if (urlMatch && urlMatch[1]) {
            const imageUrl = urlMatch[1];
            if (imageUrl.includes('kakaocdn')) {
              backgroundImages.push({
                element: div,
                imageUrl: imageUrl
              });
              console.log(`배경 이미지 URL 발견: ${imageUrl}`);
            }
          }
        }
      }
      
      console.log(`배경 이미지 개수: ${backgroundImages.length}`);
      
      // 메뉴 관련 텍스트 찾기
      const allElements = document.querySelectorAll('*');
      const menuTexts = [];
      
      for (const element of allElements) {
        const text = element.textContent || element.innerText || '';
        if (text.includes('메뉴') && (text.includes('월') || text.includes('일')) && text.length < 100) {
          // 중복 제거를 위해 텍스트 정리
          const cleanText = text.replace(/\s+/g, ' ').trim();
          const isAlreadyAdded = menuTexts.some(item => item.text === cleanText);
          if (!isAlreadyAdded) {
            menuTexts.push({
              element: element,
              text: cleanText
            });
          }
        }
      }
      
      console.log(`고유 메뉴 텍스트 발견: ${menuTexts.length}개`);
      menuTexts.forEach((item, index) => {
        console.log(`${index + 1}. ${item.text}`);
      });
      
      // 메뉴 텍스트와 배경 이미지 매칭
      for (const menuText of menuTexts) {
        // 가장 가까운 배경 이미지 찾기
        let closestImage = null;
        let minDistance = Infinity;
        
        for (const bgImg of backgroundImages) {
          try {
            // DOM 트리에서의 거리 계산
            const textRect = menuText.element.getBoundingClientRect();
            const imgRect = bgImg.element.getBoundingClientRect();
            const distance = Math.abs(textRect.top - imgRect.top) + Math.abs(textRect.left - imgRect.left);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestImage = bgImg;
            }
          } catch (error) {
            console.log(`거리 계산 오류: ${error.message}`);
          }
        }
        
        if (closestImage) {
          // 날짜 파싱
          const dateMatch = menuText.text.match(/(\d{1,2})월\s*(\d{1,2})일/);
          let menuDate = '';
          
          if (dateMatch) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            const currentYear = new Date().getFullYear().toString().slice(-2);
            menuDate = `${currentYear}${month}${day}`;
          }
          
          // 중복 방지 - 같은 이미지 URL이 이미 있는지 확인
          const isDuplicate = results.some(result => result.imageUrl === closestImage.imageUrl);
          if (!isDuplicate) {
            results.push({
              imageUrl: closestImage.imageUrl,
              dateText: menuText.text,
              menuDate: menuDate
            });
            
            console.log(`매칭 완료: ${menuText.text} -> ${closestImage.imageUrl}`);
          } else {
            console.log(`중복 제거: ${closestImage.imageUrl}`);
          }
        }
      }
      
      // 메뉴 텍스트가 없어도 배경 이미지가 있으면 첫 번째 이미지만 추가
      if (results.length === 0 && backgroundImages.length > 0) {
        results.push({
          imageUrl: backgroundImages[0].imageUrl,
          dateText: '날짜 정보 없음',
          menuDate: ''
        });
      }
      
      return results.sort((a, b) => b.menuDate.localeCompare(a.menuDate));
    });
    
    if (menuDataList.length === 0) {
      throw new Error('메뉴 이미지를 찾을 수 없습니다');
    }
    
    console.log(`📋 발견된 메뉴 데이터: ${menuDataList.length}개`);
    menuDataList.forEach((data, index) => {
      console.log(`   ${index + 1}. ${data.dateText} (${data.menuDate})`);
    });
    
    return menuDataList;
    
  } finally {
    await browser.close();
  }
}

/**
 * Gemini Vision API를 사용한 이미지 분석 (재시도 로직 포함)
 * @param {string} imageUrl - 분석할 이미지 URL
 * @param {string} dateText - 포스트 제목의 날짜 정보
 * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @returns {Promise<Array<string>>} 추출된 메뉴 목록
 */
async function analyzeImageWithGemini(imageUrl, dateText, maxRetries = 3) {
  console.log('🤖 Gemini Vision API로 이미지 분석 중...');
  console.log(`📅 날짜 정보: ${dateText}`);

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 재시도 ${attempt}/${maxRetries}...`);
        // 재시도 간 대기 시간 (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // 이미지를 fetch로 가져와서 base64로 변환
      console.log('📥 이미지 다운로드 중...');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // Gemini 모델 생성
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `이 이미지는 한국 구내식당의 메뉴판입니다. 포스트 제목: "${dateText}"

메뉴 항목들만 정확히 추출해서 JSON 배열 형태로 출력해주세요. 다른 설명 없이 JSON 배열만 반환해주세요.
예시: ["흑미밥/백미밥", "김치찌개", "돈까스"]

주의사항:
- 메뉴 이름만 추출하고 설명이나 부가 정보는 제외
- 한국어 음식명 그대로 유지
- 날짜나 요일 정보는 제외`;

      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ];

      console.log('🔍 Gemini API 분석 중...');
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const content = response.text().trim();

      console.log('Gemini 응답:', content);

      // JSON 파싱 시도
      let menuItems;
      try {
        // JSON 배열 직접 파싱 시도
        if (content.startsWith('[') && content.endsWith(']')) {
          menuItems = JSON.parse(content);
          console.log('✅ JSON 파싱 성공');
        } else {
          // JSON 배열 패턴 찾기
          const jsonMatch = content.match(/\[.*\]/s);
          if (jsonMatch) {
            menuItems = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON 패턴 파싱 성공');
          } else {
            throw new Error('JSON 형태를 찾을 수 없음');
          }
        }
      } catch (parseError) {
        console.log('⚠️ JSON 파싱 실패:', parseError.message);
        // 대안: 줄 단위로 분리하여 메뉴 추출
        const lines = content.split('\n').filter(line =>
          line.trim() &&
          !line.includes('[') &&
          !line.includes(']') &&
          line.length > 1
        );
        menuItems = lines.map(line => line.replace(/["',\-\*]/g, '').trim()).filter(item => item);

        if (menuItems.length === 0) {
          menuItems = ['메뉴 파싱 실패 - 수동 확인 필요'];
        }
      }

      console.log(`✅ Gemini 분석 완료: ${menuItems.length}개 메뉴 추출`);
      return menuItems;

    } catch (error) {
      lastError = error;
      console.log(`❌ Gemini API 호출 실패 (시도 ${attempt}/${maxRetries}):`, error.message);

      // 이미지 다운로드 타임아웃 관련 오류 처리
      if (error.message.includes('Timeout') || error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        console.log(`⚠️ 이미지 다운로드 타임아웃 발생: ${imageUrl}`);
        if (attempt < maxRetries) {
          console.log(`🔄 ${Math.min(1000 * Math.pow(2, attempt), 10000)}ms 후 재시도...`);
          continue;
        }
      }

      // 400 오류이지만 타임아웃이 아닌 경우는 재시도하지 않음
      if (error.message.includes('400') && !error.message.includes('timeout') && !error.message.includes('Timeout')) {
        throw new Error(`이미지 형식 또는 API 요청 오류: ${error.message}`);
      }

      // 다른 오류의 경우 재시도 계속
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  // 모든 재시도 실패
  if (lastError.message.includes('Timeout') || lastError.message.includes('timeout') || lastError.message.includes('ETIMEDOUT')) {
    throw new Error(`이미지 다운로드 타임아웃: ${imageUrl} (${maxRetries}회 재시도 실패)`);
  } else {
    throw new Error(`Gemini API 분석 실패: ${lastError.message} (${maxRetries}회 재시도 실패)`);
  }
}

/**
 * GitHub 연결 상태 확인
 * @returns {Promise<boolean>} 연결 상태
 */
async function checkGitHubConnection() {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-cli'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * GitHub에 메뉴 데이터 업로드
 * @param {Array<string>} menuItems - 메뉴 항목 배열
 * @returns {Promise<string>} 업로드된 파일 URL
 */
async function uploadToGitHub(menuItems, menuDate, dateText) {
  const fileName = `starvalley_food_${menuDate}.json`;
  
  // menuDate를 한국어 날짜로 변환
  const year = `20${menuDate.slice(0, 2)}`;
  const month = menuDate.slice(2, 4);
  const day = menuDate.slice(4, 6);
  const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
  const koreanDate = dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  const menuData = {
    date: koreanDate,
    originalDateText: dateText,
    menuDate: menuDate,
    timestamp: new Date().toLocaleString('ko-KR'),
    menuItems: menuItems,
    count: menuItems.length
  };
  
  const content = JSON.stringify(menuData, null, 2);
  const encodedContent = Buffer.from(content).toString('base64');
  
  // 기존 파일 확인
  const checkUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/${fileName}`;
  let sha = null;
  
  try {
    const checkResponse = await fetch(checkUrl, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-cli'
      }
    });
    
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
      console.log('기존 파일 발견, 업데이트 진행...');
    }
  } catch (error) {
    console.log('새 파일 생성 진행...');
  }
  
  // 파일 업로드/업데이트
  const uploadUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/${fileName}`;
  const uploadData = {
    message: `Update menu data for ${menuDate} (${dateText}) via Gemini Vision API`,
    content: encodedContent,
    branch: process.env.GITHUB_BRANCH || 'main'
  };
  
  if (sha) {
    uploadData.sha = sha;
  }
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'starvalley-food-cli'
    },
    body: JSON.stringify(uploadData)
  });
  
  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.text();
    throw new Error(`GitHub 업로드 실패: ${errorData}`);
  }
  
  const result = await uploadResponse.json();
  const fileUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH || 'main'}/data/${fileName}`;
  
  console.log(`GitHub 업로드 성공: ${fileName}`);
  console.log(`파일 URL: ${fileUrl}`);
  
  return fileUrl;
}

/**
 * 완전 자동화 메인 처리 함수 (날짜별 다중 처리)
 */
async function processMenuAutomated() {
  const startTime = Date.now();
  const results = [];
  
  try {
    console.log('🚀 Star Valley 완전 자동 메뉴 처리 시작\n');
    
    // 1. GitHub 연결 확인
    console.log('1️⃣ GitHub 연결 상태 확인...');
    const githubStatus = await checkGitHubConnection();
    if (!githubStatus) {
      throw new Error('GitHub API 연결 실패');
    }
    console.log('✅ GitHub 연결 완료\n');
    
    // 2. 메뉴 데이터 스크래핑 (당일 + 다음날)
    console.log('2️⃣ 메뉴 데이터 스크래핑...');
    let menuDataList;
    try {
      menuDataList = await scrapeMenuData();
      console.log(`✅ 스크래핑 완료: ${menuDataList.length}개 메뉴 발견\n`);
    } catch (scrapeError) {
      console.log(`⚠️ 스크래핑 실패: ${scrapeError.message}`);
      throw new Error(`메뉴 데이터 스크래핑 실패: ${scrapeError.message}`);
    }
    
    // 3. 각 메뉴에 대해 Gemini 분석 및 업로드
    for (let i = 0; i < menuDataList.length; i++) {
      const menuData = menuDataList[i];

      console.log(`\n${i + 1}/${menuDataList.length} 처리 중: ${menuData.dateText}`);
      console.log(`📅 메뉴 날짜: ${menuData.menuDate}`);

      try {
        // Gemini Vision API 분석
        console.log('🤖 Gemini Vision API 분석 중...');
        const menuItems = await analyzeImageWithGemini(menuData.imageUrl, menuData.dateText);

        console.log(`📋 추출된 메뉴 (${menuItems.length}개):`);
        menuItems.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item}`);
        });

        // GitHub 업로드
        console.log('📤 GitHub 업로드 중...');
        const fileUrl = await uploadToGitHub(menuItems, menuData.menuDate, menuData.dateText);

        results.push({
          date: menuData.menuDate,
          dateText: menuData.dateText,
          menuItems,
          fileUrl,
          success: true
        });

        console.log(`✅ ${menuData.dateText} 처리 완료`);

      } catch (error) {
        console.log(`\n❌ 처리 실패: ${error.message}`);

        // 구체적인 오류 안내
        if (error.message.includes('이미지 다운로드 타임아웃')) {
          console.log('💡 카카오 CDN 서버 응답 지연 - 해당 날짜는 건너뛰고 다른 메뉴를 처리합니다');
        } else if (error.message.includes('Timeout while downloading')) {
          console.log('💡 이미지 다운로드 타임아웃 - 카카오 서버 응답 지연으로 추정됩니다');
        } else if (error.message.includes('이미지 형식 또는 API 요청 오류')) {
          console.log('💡 이미지 형식이 지원되지 않습니다');
        } else if (error.message.includes('Gemini API 분석 실패')) {
          console.log('💡 Gemini API 연결 문제 또는 이미지 분석 실패');
        } else if (error.message.includes('GitHub')) {
          console.log('💡 GitHub 업로드 실패 - 토큰과 권한을 확인하세요');
        } else {
          console.log('💡 예상치 못한 오류가 발생했습니다');
        }

        // 실패한 항목을 결과에 추가
        results.push({
          date: menuData.menuDate,
          dateText: menuData.dateText,
          menuItems: [],
          fileUrl: null,
          success: false,
          error: error.message
        });

        console.log(`⚠️ ${menuData.dateText} 처리 실패 - 다음 메뉴로 계속 진행합니다`);
      }

      // 연속 API 호출 간 딜레이
      if (i < menuDataList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 완료
    const duration = Date.now() - startTime;
    const successfulResults = results.filter(result => result.success);
    const failedResults = results.filter(result => !result.success);
    const totalMenus = successfulResults.reduce((sum, result) => sum + result.menuItems.length, 0);

    if (successfulResults.length > 0) {
      console.log('\n🎉 처리 완료!');
      console.log(`✅ 성공: ${successfulResults.length}개 날짜`);
      if (failedResults.length > 0) {
        console.log(`❌ 실패: ${failedResults.length}개 날짜`);
      }
      console.log(`📊 총 메뉴: ${totalMenus}개`);
      console.log(`⏱️ 총 시간: ${(duration / 1000).toFixed(2)}초`);

      console.log('\n📋 성공한 처리 결과:');
      successfulResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.dateText} (${result.date}) - ${result.menuItems.length}개 메뉴`);
        console.log(`      ${result.fileUrl}`);
      });

      if (failedResults.length > 0) {
        console.log('\n⚠️ 실패한 처리 결과:');
        failedResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.dateText} (${result.date}) - ${result.error}`);
        });
      }
    } else {
      console.log('\n❌ 모든 메뉴 처리가 실패했습니다');
      console.log(`⏱️ 총 시간: ${(duration / 1000).toFixed(2)}초`);
    }
    
    return {
      success: true,
      results,
      totalMenus,
      duration
    };
    
  } catch (error) {
    console.error('\n❌ 처리 실패:', error.message);

    // 오류 유형별 구체적인 안내 메시지
    if (error.message.includes('GitHub')) {
      console.log('💡 GitHub 토큰 또는 권한을 확인하세요');
    } else if (error.message.includes('이미지 다운로드 타임아웃')) {
      console.log('💡 카카오 CDN 서버 응답 지연 - 잠시 후 다시 시도하세요');
      console.log('💡 이미지 URL이 유효한지 확인하거나 네트워크 연결을 점검하세요');
    } else if (error.message.includes('Timeout while downloading')) {
      console.log('💡 이미지 다운로드 타임아웃 - 카카오 서버 응답 지연으로 추정됩니다');
      console.log('💡 몇 분 후 다시 시도하시거나 네트워크 연결을 확인하세요');
    } else if (error.message.includes('이미지 형식 또는 API 요청 오류')) {
      console.log('💡 이미지 형식이 지원되지 않거나 잘못된 요청입니다');
    } else if (error.message.includes('Gemini API 분석 실패') && error.message.includes('재시도 실패')) {
      console.log('💡 Gemini API 연결 문제 또는 이미지 분석 실패 - API 키와 네트워크를 확인하세요');
    } else if (error.message.includes('Gemini')) {
      console.log('💡 Gemini API 키를 확인하세요');
    } else if (error.message.includes('스크래핑') || error.message.includes('메뉴 이미지')) {
      console.log('💡 카카오 채널 접근 상태를 확인하세요');
    } else {
      console.log('💡 예상치 못한 오류가 발생했습니다. 네트워크 연결과 설정을 확인하세요');
    }

    return {
      success: false,
      error: error.message,
      partialResults: results
    };
  }
}

// 직접 실행시에만 동작
if (import.meta.url === `file://${process.argv[1]}`) {
  processMenuAutomated();
}

export { processMenuAutomated };