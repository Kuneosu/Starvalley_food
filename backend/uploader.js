import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

/**
 * GitHub API를 사용하여 JSON 파일을 업로드합니다.
 * @param {Array<string>} menuItems - 메뉴 목록
 * @param {string} date - 날짜 (YYMMDD 형식)
 * @returns {Promise<string>} 업로드된 파일의 URL
 */
export async function uploadToGitHub(menuItems, date = null) {
  const currentDate = date || new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const fileName = `starvalley_food_${currentDate}.json`;
  
  const data = {
    date: new Date().toISOString().split('T')[0],
    menu: menuItems,
    updated_at: new Date().toISOString(),
    total_items: menuItems.length
  };
  
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  
  const githubApi = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/${fileName}`;
  
  try {
    // 기존 파일 확인
    let sha = null;
    try {
      const existingResponse = await fetch(githubApi, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'starvalley-food-bot'
        }
      });
      
      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        sha = existingData.sha;
        console.log('기존 파일 발견, 업데이트 진행...');
      }
    } catch (error) {
      console.log('새 파일 생성...');
    }
    
    // 파일 업로드/업데이트
    const uploadData = {
      message: `Update menu data for ${currentDate}`,
      content: content,
      branch: process.env.GITHUB_BRANCH || 'main'
    };
    
    if (sha) {
      uploadData.sha = sha;
    }
    
    const response = await fetch(githubApi, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'starvalley-food-bot'
      },
      body: JSON.stringify(uploadData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub 업로드 실패: ${response.status} - ${errorData.message}`);
    }
    
    const result = await response.json();
    const fileUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH || 'main'}/data/${fileName}`;
    
    console.log(`GitHub 업로드 성공: ${fileName}`);
    console.log(`파일 URL: ${fileUrl}`);
    
    return fileUrl;
    
  } catch (error) {
    console.error('GitHub 업로드 실패:', error.message);
    throw error;
  }
}

/**
 * GitHub 저장소 연결 상태를 확인합니다.
 * @returns {Promise<boolean>} 연결 가능 여부
 */
export async function checkGitHubConnection() {
  try {
    const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-bot'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('GitHub 연결 확인 실패:', error.message);
    return false;
  }
}

/**
 * data 디렉토리가 없으면 생성합니다.
 */
export async function ensureDataDirectory() {
  const githubApi = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/README.md`;
  
  try {
    const response = await fetch(githubApi, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'starvalley-food-bot'
      }
    });
    
    if (response.status === 404) {
      // data 디렉토리가 없으므로 README.md 파일로 디렉토리 생성
      const content = Buffer.from('# Star Valley Food Data\n\n이 디렉토리에는 매일의 메뉴 데이터가 JSON 형식으로 저장됩니다.').toString('base64');
      
      await fetch(githubApi, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'starvalley-food-bot'
        },
        body: JSON.stringify({
          message: 'Create data directory with README',
          content: content,
          branch: process.env.GITHUB_BRANCH || 'main'
        })
      });
      
      console.log('data 디렉토리 생성 완료');
    }
  } catch (error) {
    console.log('data 디렉토리 확인/생성 중 오류:', error.message);
  }
}