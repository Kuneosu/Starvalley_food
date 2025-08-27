import OpenAI from 'openai';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

/**
 * OpenAI 클라이언트 초기화
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * GPT-4o-mini를 사용하여 메뉴 이미지를 분석합니다.
 * @param {string} imageUrl - 분석할 메뉴 이미지 URL
 * @returns {Promise<Array<string>>} 분석된 메뉴 목록
 */
export async function analyzeMenuImage(imageUrl) {
  try {
    console.log('GPT-4o-mini로 이미지 분석 중...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 이미지는 한국 구내식당의 메뉴판입니다. 정확한 메뉴명만 추출해주세요.

분석 지침:
1. 이미지에서 보이는 실제 메뉴명만 추출하세요
2. 한국어 메뉴명의 정확한 띄어쓰기를 유지하세요
3. 일반적인 구내식당 메뉴 형태를 고려하세요 (밥, 국, 반찬류)
4. OCR 오류가 있을 수 있으니 상식적인 메뉴명으로 교정해주세요
5. 날짜, 요일, 설명문은 제외하고 순수 메뉴명만 출력하세요

출력 형식: 각 메뉴를 한 줄씩, 쉼표로 구분하지 마세요.

예시:
흑미밥
낙지불고기볶음
소고기들깨우거지국
김치전
포기김치`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1 // 일관성을 위해 낮은 temperature 사용
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT-4o-mini 응답이 비어있습니다.');
    }

    // 응답을 파싱하여 메뉴 배열로 변환
    const menuItems = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => {
        // 날짜, 요일 등 불필요한 내용 제거
        const excludePatterns = [
          /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/, // 날짜
          /\d{1,2}월\s*\d{1,2}일/, // 한국어 날짜
          /(월|화|수|목|금|토|일)요일/, // 요일
          /breakfast|lunch|dinner/i, // 영어 식사시간
          /조식|중식|석식/, // 한국어 식사시간
          /menu|메뉴/i // 메뉴라는 단어
        ];
        
        return !excludePatterns.some(pattern => pattern.test(line));
      });

    console.log(`GPT-4o-mini 분석 완료: ${menuItems.length}개 메뉴 추출`);
    return menuItems;

  } catch (error) {
    console.error('GPT-4o-mini 분석 실패:', error.message);
    throw new Error(`메뉴 이미지 분석 실패: ${error.message}`);
  }
}

/**
 * OpenAI API 상태를 확인합니다.
 * @returns {Promise<boolean>} API 사용 가능 여부
 */
export async function checkOpenAIStatus() {
  try {
    // 간단한 completions 요청으로 API 키 유효성 확인
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
      temperature: 0
    });
    return true;
  } catch (error) {
    console.error('OpenAI API 상태 확인 실패:', error.message);
    return false;
  }
}