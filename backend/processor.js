import { scrapeMenuImage, validateImageUrl } from './scraper.js';
import { analyzeMenuImage, checkOpenAIStatus } from './analyzer.js';
import { uploadToGitHub, checkGitHubConnection, ensureDataDirectory } from './uploader.js';

/**
 * 전체 메뉴 처리 파이프라인을 실행합니다.
 * @param {boolean} verbose - 자세한 로그 출력 여부
 * @returns {Promise<Object>} 처리 결과
 */
export async function processMenu(verbose = true) {
  const startTime = Date.now();
  const result = {
    success: false,
    imageUrl: null,
    menuItems: [],
    fileUrl: null,
    duration: 0,
    error: null
  };
  
  try {
    if (verbose) {
      console.log('🚀 Star Valley 메뉴 처리 시작...\n');
    }
    
    // 1. API 상태 확인
    if (verbose) console.log('1️⃣ API 연결 상태 확인...');
    
    const [openaiStatus, githubStatus] = await Promise.all([
      checkOpenAIStatus(),
      checkGitHubConnection()
    ]);
    
    if (!openaiStatus) {
      throw new Error('OpenAI API 연결 실패. API 키를 확인해주세요.');
    }
    
    if (!githubStatus) {
      throw new Error('GitHub API 연결 실패. 토큰과 저장소 정보를 확인해주세요.');
    }
    
    if (verbose) console.log('✅ API 연결 상태 양호\n');
    
    // 2. 메뉴 이미지 스크래핑
    if (verbose) console.log('2️⃣ 메뉴 이미지 가져오는 중...');
    
    const imageUrl = await scrapeMenuImage();
    result.imageUrl = imageUrl;
    
    if (verbose) {
      console.log(`✅ 이미지 URL: ${imageUrl.substring(0, 50)}...`);
    }
    
    // 이미지 URL 유효성 검증
    const isValidImage = await validateImageUrl(imageUrl);
    if (!isValidImage) {
      throw new Error('유효하지 않은 이미지 URL입니다.');
    }
    
    if (verbose) console.log('✅ 이미지 유효성 검증 완료\n');
    
    // 3. GPT-4o-mini로 이미지 분석
    if (verbose) console.log('3️⃣ GPT-4o-mini로 메뉴 분석 중...');
    
    const menuItems = await analyzeMenuImage(imageUrl);
    result.menuItems = menuItems;
    
    if (verbose) {
      console.log(`✅ 메뉴 분석 완료: ${menuItems.length}개 항목`);
      console.log('📋 추출된 메뉴:');
      menuItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
      console.log();
    }
    
    // 4. GitHub에 업로드
    if (verbose) console.log('4️⃣ GitHub에 데이터 업로드 중...');
    
    await ensureDataDirectory();
    const fileUrl = await uploadToGitHub(menuItems);
    result.fileUrl = fileUrl;
    
    if (verbose) {
      console.log(`✅ GitHub 업로드 완료`);
      console.log(`📁 파일 URL: ${fileUrl}\n`);
    }
    
    // 완료
    result.success = true;
    result.duration = Date.now() - startTime;
    
    if (verbose) {
      console.log('🎉 메뉴 처리 완료!');
      console.log(`⏱️ 총 소요시간: ${(result.duration / 1000).toFixed(2)}초`);
    }
    
    return result;
    
  } catch (error) {
    result.error = error.message;
    result.duration = Date.now() - startTime;
    
    if (verbose) {
      console.error('❌ 처리 실패:', error.message);
      console.log(`⏱️ 소요시간: ${(result.duration / 1000).toFixed(2)}초`);
    }
    
    throw error;
  }
}

/**
 * 환경변수가 올바르게 설정되었는지 확인합니다.
 * @returns {Array<string>} 누락된 환경변수 목록
 */
export function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'GITHUB_TOKEN', 
    'GITHUB_OWNER',
    'GITHUB_REPO'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  return missing;
}