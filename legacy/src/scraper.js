import puppeteer from 'puppeteer';
import ora from 'ora';

export async function scrapeMenu(retryCount = 0) {
  const maxRetries = 2;
  const spinner = ora('Launching browser...').start();
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
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
    
    spinner.text = 'Opening Kakao channel page...';
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the page
    await page.goto('https://pf.kakao.com/_axkixdn/posts', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    spinner.text = 'Waiting for content to load...';
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    spinner.text = 'Looking for menu image...';
    
    // Get the image URL from background images (where menu images are stored)
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
    
    spinner.succeed(`Menu image URL found: ${imageUrl.substring(0, 50)}...`);
    
    return imageUrl;
    
  } catch (error) {
    spinner.fail('Failed to scrape menu');
    
    if (retryCount < maxRetries) {
      console.log(`Retrying... (${retryCount + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return scrapeMenu(retryCount + 1);
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