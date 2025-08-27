import { Ollama } from 'ollama';
import ora from 'ora';

// Ollama 클라이언트 초기화
const ollama = new Ollama({
  host: 'http://localhost:11434'
});

/**
 * 사용 가능한 한국어 로컬 AI 모델 목록
 */
const KOREAN_MODELS = [
  'qwen2.5-coder:7b',      // 최우선 - 코드 이해력 좋고 텍스트 처리 우수
  'llama3.1:8b',           // 대안 1 - 일반 언어 모델
  'gemma3:4b',             // 대안 2 - 가벼운 모델
  'gemma3:1b'              // 최후 대안 - 매우 가벼움
];

/**
 * 최적의 한국어 모델 선택
 * @returns {Promise<string>} - 선택된 모델명
 */
async function selectBestModel() {
  try {
    const models = await ollama.list();
    const availableModels = models.models.map(m => m.name);
    
    // 우선순위대로 사용 가능한 모델 찾기
    for (const model of KOREAN_MODELS) {
      if (availableModels.some(available => available.includes(model.split(':')[0]))) {
        return model;
      }
    }
    
    // 기본값으로 첫 번째 모델 반환
    return KOREAN_MODELS[0];
  } catch (error) {
    console.warn('Model selection failed, using default:', error.message);
    return KOREAN_MODELS[0];
  }
}

/**
 * OCR 결과를 한국어 AI로 후처리하여 올바른 메뉴명으로 수정
 * @param {string} ocrText - OCR로 추출된 원본 텍스트
 * @returns {Promise<string>} - AI가 수정한 깔끔한 메뉴 텍스트
 */
export async function processOCRWithAI(ocrText) {
  const spinner = ora('AI로 메뉴 텍스트 정리 중...').start();
  
  try {
    // 최적 모델 선택
    const model = await selectBestModel();
    spinner.text = `${model} 모델로 텍스트 처리 중...`;
    
    // OCR 텍스트가 너무 짧거나 의미 없는 경우 처리
    if (!ocrText || ocrText.trim().length < 10) {
      spinner.fail('OCR 텍스트가 너무 짧습니다');
      return '메뉴를 읽을 수 없습니다.';
    }
    
    const response = await ollama.chat({
      model: model,
      messages: [{
        role: 'user',
        content: `다음 OCR 텍스트에서 메뉴명만 추출하고 오타를 수정해주세요:

${ocrText}

일반적인 OCR 오타 수정 예시:
- "혹미밥" → "흑미밥" 
- "7|볶습" → "기볶음"
- "롯난이" → "못난이"
- "틀깨" → "들깨"
- "솔" → "음"

정확한 메뉴명만 쉼표로 구분해서 출력해주세요. 설명이나 추가 텍스트는 포함하지 마세요.`
      }],
      stream: false,
      options: {
        temperature: 0.1,  // 창의성 낮추고 정확성 높임
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_predict: 200   // 응답 길이 제한
      }
    });
    
    spinner.succeed(`${model} 모델로 메뉴 정리 완료`);
    
    // AI 응답 후처리
    let processedText = response.message.content.trim();
    
    // 불필요한 설명 제거하고 메뉴 목록만 추출
    processedText = cleanAIResponse(processedText);
    
    return processedText;
    
  } catch (error) {
    spinner.fail('AI 텍스트 처리 실패');
    
    if (error.message.includes('connection refused')) {
      throw new Error('Ollama 서버가 실행되지 않았습니다. "ollama serve" 명령으로 시작하세요.');
    } else if (error.message.includes('model')) {
      throw new Error(`AI 모델 로딩 실패: ${error.message}`);
    } else {
      throw new Error(`AI 텍스트 처리 실패: ${error.message}`);
    }
  }
}

/**
 * AI 응답에서 순수한 메뉴 목록만 추출
 * @param {string} aiResponse - AI의 원본 응답
 * @returns {string} - 정리된 메뉴 목록
 */
function cleanAIResponse(aiResponse) {
  // 줄바꿈을 쉼표로 변환
  let cleaned = aiResponse
    .replace(/\n+/g, ', ')
    .replace(/,\s*,+/g, ',') // 연속된 쉼표 제거
    .replace(/^[,\s]+|[,\s]+$/g, '') // 앞뒤 쉼표/공백 제거
    .trim();
  
  // AI가 추가한 불필요한 텍스트 제거 (더 강화)
  const unwantedPatterns = [
    /^[^:]*:/g, // "결과:", "수정된 메뉴:" 등 제거
    /^-\s*/g,  // 시작 부분의 "- " 제거
    /^\d+\.\s*/g, // "1. " "2. " 등 번호 제거
    /다음은.*?:|메뉴.*?:|결과.*?:|수정.*?:/gi,
    /입니다|됩니다|있습니다|합니다/gi,
    /구내식당|식당|메뉴판|오늘의/gi
  ];
  
  for (const pattern of unwantedPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // 특수문자나 숫자로 시작하는 불필요한 부분 제거
  cleaned = cleaned
    .split(',')
    .map(item => item.trim())
    .filter(item => {
      // 한글이 포함된 의미 있는 메뉴명만 유지
      return item.length > 1 && /[가-힣]/.test(item) && item.length < 50;
    })
    .join(', ');
  
  return cleaned || '메뉴 처리 중 오류가 발생했습니다.';
}

/**
 * 하이브리드 처리: OCR + AI 조합으로 최적 결과 생성
 * @param {string} imageUrl - 메뉴 이미지 URL
 * @param {Function} ocrFunction - 사용할 OCR 함수
 * @returns {Promise<string>} - 최종 처리된 메뉴 텍스트
 */
export async function hybridOCRAI(imageUrl, ocrFunction) {
  const spinner = ora('하이브리드 OCR + AI 처리 시작...').start();
  
  try {
    // 1단계: OCR로 텍스트 추출
    spinner.text = 'OCR로 메뉴 이미지 분석 중...';
    console.time('OCR Processing Time');
    const ocrResult = await ocrFunction(imageUrl);
    console.timeEnd('OCR Processing Time');
    
    // 2단계: AI로 텍스트 후처리
    spinner.text = 'AI로 메뉴 텍스트 정리 중...';
    console.time('AI Processing Time');
    const processedResult = await processOCRWithAI(ocrResult);
    console.timeEnd('AI Processing Time');
    
    spinner.succeed('하이브리드 OCR + AI 처리 완료');
    
    return processedResult;
    
  } catch (error) {
    spinner.fail('하이브리드 처리 실패');
    throw error;
  }
}

/**
 * 로컬 AI 상태 확인
 * @returns {Promise<object>} - AI 상태 정보
 */
export async function checkAIStatus() {
  try {
    const models = await ollama.list();
    const availableModels = models.models
      .filter(m => KOREAN_MODELS.some(km => m.name.includes(km.split(':')[0])))
      .map(m => m.name);
    
    return {
      available: availableModels.length > 0,
      models: availableModels,
      recommended: availableModels.length > 0 ? availableModels[0] : null
    };
  } catch (error) {
    return {
      available: false,
      models: [],
      recommended: null,
      error: error.message
    };
  }
}