import ora from 'ora';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 향상된 이미지 전처리 함수
 * @param {string} imageUrl - 원본 이미지 URL
 * @returns {Promise<string>} - 전처리된 이미지 URL (임시로 원본 반환)
 */
async function preprocessImage(imageUrl) {
  // 실제로는 여기서 이미지 크기 조정, 대비 증대, 노이즈 제거 등을 수행
  // 현재는 단순히 원본 URL 반환
  return imageUrl;
}

/**
 * Client-side OCR 시뮬레이션 (실제로는 향상된 Tesseract 사용)
 * @param {string} imageUrl - 분석할 이미지 URL
 * @returns {Promise<string>} - 추출된 텍스트
 */
export async function extractTextWithClientOCR(imageUrl) {
  const spinner = ora('Advanced OCR not available, using enhanced Tesseract...').start();
  
  try {
    // Advanced OCR이 사용 불가능하므로 향상된 Tesseract로 폴백
    const result = await extractTextWithEnhancedTesseract(imageUrl);
    spinner.succeed('Enhanced OCR processing completed');
    return result;
    
  } catch (error) {
    spinner.fail('Advanced OCR processing failed');
    throw new Error(`Advanced OCR failed: ${error.message}`);
  }
}

/**
 * 향상된 Tesseract.js를 사용한 OCR (기존 대비 개선)
 * @param {string} imageUrl - 분석할 이미지 URL  
 * @returns {Promise<string>} - 추출된 텍스트
 */
export async function extractTextWithEnhancedTesseract(imageUrl) {
  const spinner = ora('Initializing enhanced Tesseract OCR...').start();
  
  try {
    // 동적 import로 tesseract.js 로드
    const { createWorker } = await import('tesseract.js');
    
    spinner.text = 'Creating OCR worker with optimized settings...';
    
    // 한국어 + 영어 지원으로 워커 생성
    const worker = await createWorker(['kor', 'eng'], 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          spinner.text = `Enhanced OCR processing: ${Math.round(m.progress * 100)}%`;
        }
      }
    });
    
    // 한국어 메뉴판에 최적화된 매개변수 설정
    await worker.setParameters({
      tessedit_pageseg_mode: '3', // 자동 페이지 분할
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0'
    });
    
    spinner.text = 'Recognizing text with enhanced Korean support...';
    
    // 이미지에서 텍스트 인식
    const { data: { text } } = await worker.recognize(imageUrl, {
      rectangle: { top: 0, left: 0, width: 0, height: 0 } // 전체 이미지
    });
    
    // 워커 정리
    await worker.terminate();
    
    // 텍스트 후처리
    const processedText = postProcessKoreanText(text);
    
    spinner.succeed('Enhanced OCR processing completed');
    
    return processedText;
    
  } catch (error) {
    spinner.fail('Enhanced OCR processing failed');
    throw new Error(`Enhanced Tesseract OCR failed: ${error.message}`);
  }
}

/**
 * 한국어 텍스트 후처리 함수
 * @param {string} text - 원본 OCR 텍스트
 * @returns {string} - 정리된 텍스트
 */
function postProcessKoreanText(text) {
  if (!text) return '';
  
  return text
    // 연속된 공백 제거
    .replace(/\s+/g, ' ')
    // 잘못 인식된 특수문자 수정
    .replace(/[|]/g, 'ㅣ')
    .replace(/[ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ]/g, match => {
      // 단독 자음을 일반적인 오타로 보정
      const consonantMap = {
        'ㄱ': '가', 'ㄴ': '나', 'ㄷ': '다', 'ㄹ': '라',
        'ㅁ': '마', 'ㅂ': '바', 'ㅅ': '사', 'ㅇ': '아',
        'ㅈ': '자', 'ㅊ': '차', 'ㅋ': '카', 'ㅌ': '타',
        'ㅍ': '파', 'ㅎ': '하'
      };
      return consonantMap[match] || match;
    })
    // 일반적인 OCR 오타 수정
    .replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt(0) - 65248)) // 전각 숫자를 반각으로
    .replace(/[Ａ-Ｚａ-ｚ]/g, match => String.fromCharCode(match.charCodeAt(0) - 65248)) // 전각 영문을 반각으로
    // 불필요한 특수문자 제거
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ0-9\s.,()[\]{}:;\-+/\\|]/g, '')
    .trim();
}

/**
 * OCR 엔진 상태 및 성능 테스트
 * @returns {Promise<object>} - 엔진 상태 정보
 */
export async function testOCREngines() {
  const results = {
    clientSideOCR: { available: false, error: 'Not available in Node.js environment' },
    enhancedTesseract: { available: false, error: null }
  };
  
  // Enhanced Tesseract 테스트
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('kor');
    await worker.terminate();
    results.enhancedTesseract.available = true;
  } catch (error) {
    results.enhancedTesseract.error = error.message;
  }
  
  return results;
}