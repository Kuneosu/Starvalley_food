import { createWorker } from 'tesseract.js';
import ora from 'ora';

export async function extractTextFromImage(imageUrl) {
  const spinner = ora('Initializing OCR engine...').start();
  
  let worker;
  try {
    // Create worker with Korean language
    worker = await createWorker('kor', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          spinner.text = `OCR processing: ${Math.round(m.progress * 100)}%`;
        }
      }
    });
    
    spinner.text = 'Loading Korean language model...';
    
    // Set simple OCR parameters without OSD
    await worker.setParameters({
      tessedit_pageseg_mode: '6', // Uniform block of text
      preserve_interword_spaces: '1'
    });
    
    spinner.text = 'Recognizing text from menu image...';
    
    const { data: { text } } = await worker.recognize(imageUrl);
    
    spinner.succeed('Text extraction completed');
    
    return text.trim();
    
  } catch (error) {
    spinner.fail('OCR processing failed');
    throw new Error(`OCR failed: ${error.message}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}