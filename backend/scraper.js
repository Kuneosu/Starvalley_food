import puppeteer from 'puppeteer';

/**
 * Star Valley 카카오 채널에서 메뉴 이미지 URL을 가져옵니다.
 * @returns {Promise<string>} 메뉴 이미지 URL
 */
export async function scrapeMenuImage() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROME_PATH || undefined // 시스템 Chrome 사용
  });
  
  try {
    const page = await browser.newPage();
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Star Valley 카카오톡 채널 페이지 방문
    await page.goto('https://pf.kakao.com/_dYJxhG/posts', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 메뉴 이미지 찾기 - 최신 게시물의 이미지
    const imageUrl = await page.evaluate(() => {
      // 게시물 이미지들을 찾습니다
      const images = document.querySelectorAll('img[src*="postfiles.pstatic.net"], img[src*="kakaocdn.net"], img[src*="pstatic.net"]');
      
      for (let img of images) {
        const src = img.src;
        // 메뉴판으로 보이는 이미지 패턴 확인
        if (src && (src.includes('jpg') || src.includes('jpeg') || src.includes('png'))) {
          // 이미지 크기가 충분히 큰지 확인 (메뉴판은 보통 큰 이미지)
          if (img.width > 200 && img.height > 200) {
            return src;
          }
        }
      }
      
      // 대안: 모든 이미지 중 첫 번째
      if (images.length > 0) {
        return images[0].src;
      }
      
      return null;
    });
    
    if (!imageUrl) {
      throw new Error('메뉴 이미지를 찾을 수 없습니다.');
    }
    
    return imageUrl;
    
  } finally {
    await browser.close();
  }
}

/**
 * 이미지 URL이 유효한지 확인합니다.
 * @param {string} imageUrl - 확인할 이미지 URL
 * @returns {Promise<boolean>} 유효성 여부
 */
export async function validateImageUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.error('이미지 URL 검증 실패:', error.message);
    return false;
  }
}