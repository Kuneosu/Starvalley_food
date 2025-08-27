import { Ollama } from 'ollama';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ollama 클라이언트 초기화
const ollama = new Ollama({
  host: 'http://localhost:11434' // 기본 Ollama 서버 주소
});

/**
 * 이미지 URL을 base64로 변환
 * @param {string} imageUrl - 이미지 URL
 * @returns {Promise<string>} - base64 인코딩된 이미지
 */
async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * LLaVA 모델을 사용하여 이미지에서 메뉴 텍스트 추출
 * @param {string} imageUrl - 분석할 이미지 URL
 * @returns {Promise<string>} - 추출된 메뉴 텍스트
 */
export async function extractMenuWithVision(imageUrl) {
  const spinner = ora('Initializing LLaVA vision model...').start();
  
  try {
    // 모델 사용 가능 여부 확인
    spinner.text = 'Checking LLaVA model availability...';
    const models = await ollama.list();
    const llavaModel = models.models.find(m => m.name.includes('llava'));
    
    if (!llavaModel) {
      spinner.text = 'LLaVA model not found. Pulling llava:7b (this may take a while on first run)...';
      
      // 모델 다운로드 진행 상황 표시
      const pullStream = await ollama.pull({
        model: 'llava:7b',
        stream: true
      });
      
      for await (const progress of pullStream) {
        if (progress.status) {
          spinner.text = `Downloading LLaVA: ${progress.status}`;
          if (progress.completed && progress.total) {
            const percent = Math.round((progress.completed / progress.total) * 100);
            spinner.text = `Downloading LLaVA: ${percent}%`;
          }
        }
      }
    }
    
    spinner.text = 'Converting image for analysis...';
    
    // 이미지를 base64로 변환
    const imageBase64 = await imageUrlToBase64(imageUrl);
    
    spinner.text = 'Analyzing menu image with LLaVA vision model...';
    
    // LLaVA 모델로 이미지 분석
    const response = await ollama.chat({
      model: 'llava:7b',
      messages: [{
        role: 'user',
        content: `당신은 한국어 메뉴판 전문 분석가입니다. 이 이미지는 한국 구내식당의 주간 메뉴판입니다.

정확한 텍스트 추출이 최우선입니다.

메뉴 분석 지시사항:
1. 이미지에서 보이는 실제 텍스트만 추출하세요
2. 요일별로 정확히 구분 (월, 화, 수, 목, 금, 토, 일)
3. 중식/석식/간식 시간대가 명시되어 있다면 구분
4. 메뉴 이름을 정확히 한글로 기록
5. 가격이 표시되어 있다면 숫자 그대로 포함
6. 특별 메뉴, 이벤트, 공지사항 등 추가 정보도 포함

주의사항:
- 추측하지 마세요. 이미지에서 명확히 보이는 것만 기록
- 메뉴 이름이 불분명하면 "불분명한 메뉴" 표시
- 환상이나 잘못된 정보를 생성하지 마세요

출력 형식:
[요일] (중식/석식)
- 메뉴1
- 메뉴2
- 가격: 0,000원 (있는 경우)

[추가 정보]
- 공지사항이나 특별 메뉴 (있는 경우)

지금 이미지를 정확히 분석해주세요:`,
        images: [imageBase64]
      }],
      stream: false,
      options: {
        temperature: 0.1,  // 창의성 낮추고 정확성 높임
        top_p: 0.9,
        repeat_penalty: 1.1
      }
    });
    
    spinner.succeed('Menu analysis completed');
    
    return response.message.content;
    
  } catch (error) {
    spinner.fail('Vision processing failed');
    
    // 상세한 에러 메시지 제공
    if (error.message.includes('connection refused') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Ollama server is not running. Please start Ollama first with: ollama serve');
    } else if (error.message.includes('model not found')) {
      throw new Error('LLaVA model not found. Please pull the model with: ollama pull llava:7b');
    } else {
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }
}

/**
 * Ollama 서버 상태 확인
 * @returns {Promise<boolean>} - 서버가 실행 중인지 여부
 */
export async function checkOllamaStatus() {
  try {
    const ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    
    await ollama.list();
    return true;
  } catch (error) {
    return false;
  }
}