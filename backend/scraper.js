import puppeteer from 'puppeteer';

/**
 * Star Valley 카카오 채널에서 메뉴 이미지 URL을 가져옵니다.
 * @returns {Promise<string>} 메뉴 이미지 URL
 */
export async function scrapeMenuImage(retryCount = 0) {
  const maxRetries = 2;
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      executablePath: process.platform === 'darwin' 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent like legacy code
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Use the working URL from legacy code
    await page.goto('https://pf.kakao.com/_axkixdn/posts', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Use the working selector logic from legacy code
    const imageUrl = await page.evaluate(() => {
      // Find elements with background images (menu images are here)
      const thumbElements = document.querySelectorAll('.wrap_fit_thumb');
      
      if (thumbElements.length > 0) {
        // Get the first post's background image (most recent menu)
        const firstThumb = thumbElements[0];
        const bgImage = window.getComputedStyle(firstThumb).backgroundImage;
        
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(["']?([^"']+)["']?\)/);
          if (match && match[1]) {
            // The image URL is already high quality (img_xl.jpg)
            return match[1];
          }
        }
      }
      
      // Fallback: try to find any kakaocdn image
      const allElements = Array.from(document.querySelectorAll('*'));
      
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          const match = style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
          if (match && match[1] && match[1].includes('kakaocdn') && match[1].includes('img_xl')) {
            return match[1];
          }
        }
      }
      
      return null;
    });
    
    if (!imageUrl) {
      throw new Error('No menu image found on the page. The page structure might have changed.');
    }
    
    return imageUrl;
    
  } catch (error) {
    if (retryCount < maxRetries) {
      console.log(`Retrying scraping... (${retryCount + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return scrapeMenuImage(retryCount + 1);
    }
    
    throw new Error(`Web scraping failed after ${maxRetries + 1} attempts: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
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