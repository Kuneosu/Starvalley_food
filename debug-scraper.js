import puppeteer from 'puppeteer';

async function debugScraper() {
  console.log('Starting debug scraper...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Open visible browser for debugging
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      executablePath: process.platform === 'darwin' 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : undefined
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navigating to Kakao channel...');
    await page.goto('https://pf.kakao.com/_axkixdn/posts', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get all image URLs on the page
    const imageData = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width || img.naturalWidth,
        height: img.height || img.naturalHeight,
        className: img.className
      }));
    });
    
    console.log('\nFound images:');
    imageData.forEach((img, index) => {
      console.log(`${index + 1}. ${img.src.substring(0, 80)}...`);
      console.log(`   Alt: ${img.alt}, Size: ${img.width}x${img.height}, Class: ${img.className}`);
    });
    
    // Check for background images
    const bgImages = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const bgImages = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          const match = style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
          if (match && match[1]) {
            bgImages.push({
              url: match[1],
              element: el.tagName,
              className: el.className
            });
          }
        }
      });
      
      return bgImages;
    });
    
    console.log('\nFound background images:');
    bgImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.url.substring(0, 80)}...`);
      console.log(`   Element: ${img.element}, Class: ${img.className}`);
    });
    
    console.log('\nPress Ctrl+C to exit...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Keep browser open for inspection
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugScraper();